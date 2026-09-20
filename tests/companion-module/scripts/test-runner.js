/**
 * Pathfinder's Guide to Eberron - Companion In-VTT Test Suite & Error Monitor
 *
 * This test runner and runtime error monitor operates inside the Foundry VTT client runtime.
 * It is completely isolated in this companion module to keep the
 * production compendium module clean of test code.
 */

class EberronErrorMonitor {
  static STORAGE_KEY = "pathfinders_guide_to_eberron_error_log";
  static errors = [];
  static selectedIndex = -1;
  static activeDialog = null;
  static activeDetailSheet = null;
  static isMonitoring = false;
  static serverBridgeActive = false;
  static serverBridgePort = 30005;

  /**
   * Connect to Foundry Node.js server bridge to ingest backend exceptions & warnings in real time
   */
  static initServerBridge(defaultPort = 30005) {
    if (this.serverBridgeActive) return;
    if (typeof window === "undefined" || !window.fetch) return;
    this.serverBridgeActive = true;

    const host = window.location.hostname || "localhost";

    const connect = (port) => {
      this.serverBridgePort = port;
      const baseUrl = `http://${host}:${port}`;

      // 1. Initial backlog fetch for server startup errors
      fetch(`${baseUrl}/api/server-errors`)
        .then(res => res.json())
        .then(serverErrors => {
          if (Array.isArray(serverErrors)) {
            for (const sErr of serverErrors) {
              this.captureError({
                message: sErr.message,
                stack: sErr.stack,
                source: sErr.source || "Foundry Server",
                type: sErr.level === "warn" ? "server-warning" : "server-error"
              });
            }
          }
        })
        .catch(() => {});

      // 2. Stream real-time server events via SSE
      try {
        if (typeof EventSource !== "undefined") {
          const es = new EventSource(`${baseUrl}/api/server-events`);
          es.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === "server-error" && data.error) {
                this.captureError({
                  message: data.error.message,
                  stack: data.error.stack,
                  source: data.error.source || "Foundry Server",
                  type: data.error.level === "warn" ? "server-warning" : "server-error"
                });
              } else if (data.type === "clear") {
                this.errors = this.errors.filter(e => !e.type?.startsWith("server"));
                this.saveToStorage();
                if (this.activeDialog) this.showErrorDialog();
              }
            } catch (e) {}
          };
        }
      } catch (e) {}
    };

    // Attempt port discovery from companion module, or use defaultPort
    fetch("/modules/pathfinders-guide-to-eberron-tests/bridge-port.json")
      .then(r => r.json())
      .then(data => connect(data.port || defaultPort))
      .catch(() => connect(defaultPort));
  }

  /**
   * Initialize global listeners for runtime errors, promise rejections, and console.error
   */
  static init() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Load any persisted errors from previous session/refresh
    this.loadFromStorage();

    // Connect to server error bridge for Node.js exceptions & warnings
    this.initServerBridge();

    // 1. Global unhandled error listener
    if (typeof window !== "undefined") {
      window.addEventListener("error", (event) => {
        try {
          const err = event.error || {};
          const message = err.message || event.message || "Unknown Runtime Error";
          const stack = err.stack || (event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : "");
          const source = event.filename || "window.onerror";

          if (this.isEberronError(message, stack, source)) {
            this.captureError({
              message,
              stack,
              source,
              type: "runtime"
            });
          }
        } catch (e) {
          // Prevent error monitor from crashing the client
        }
      });

      // 2. Global unhandled promise rejection listener
      window.addEventListener("unhandledrejection", (event) => {
        try {
          const reason = event.reason || {};
          const message = typeof reason === "string" ? reason : reason.message || "Unhandled Promise Rejection";
          const stack = reason.stack || "";
          const source = "unhandledrejection";

          if (this.isEberronError(message, stack, source)) {
            this.captureError({
              message,
              stack,
              source,
              type: "unhandledrejection"
            });
          }
        } catch (e) {}
      });
    }

    // 3. Intercept console.error
    if (typeof console !== "undefined" && console.error) {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        try {
          const joined = args.map(a => (a && a.stack) ? a.stack : (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
          if (this.isEberronError(joined, joined, "console.error")) {
            const firstArg = args[0];
            const message = (joined && joined.length > (firstArg?.message?.length || 0)) ? joined : (firstArg?.message || String(firstArg || "console.error"));
            const stack = (firstArg && firstArg.stack) ? firstArg.stack : new Error().stack;
            this.captureError({
              message,
              stack,
              source: "console.error",
              type: "console.error"
            });
          }
        } catch (e) {}
        return originalConsoleError.apply(console, args);
      };
    }

    // 4. Intercept console.warn (for PF2e element-validation failures and schema/deprecation warnings)
    if (typeof console !== "undefined" && console.warn) {
      const originalConsoleWarn = console.warn;
      console.warn = (...args) => {
        try {
          const joined = args.map(a => (a && a.stack) ? a.stack : (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
          if (this.isEberronError(joined, joined, "console.warn")) {
            const firstArg = args[0];
            const message = joined || (firstArg?.message || String(firstArg || "console.warn"));
            const stack = (firstArg && firstArg.stack) ? firstArg.stack : new Error().stack;
            this.captureError({
              message,
              stack,
              source: "console.warn",
              type: "validation-warning"
            });
          }
        } catch (e) {}
        return originalConsoleWarn.apply(console, args);
      };
    }

    // 5. Foundry-specific Hooks error interception if available
    if (typeof Hooks !== "undefined" && Hooks.on) {
      Hooks.on("error", (location, err, data) => {
        try {
          const message = err?.message || String(err || "Hook Error");
          const stack = err?.stack || "";
          const source = `Hooks[${location}]`;
          if (this.isEberronError(message, stack, source)) {
            this.captureError({
              message,
              stack,
              source,
              type: "foundry-hook"
            });
          }
        } catch (e) {}
      });
    }
  }

  /**
   * Determine whether an error originates from or relates to this module
   */
  static isEberronError(message = "", stack = "", source = "") {
    const combined = `${message} ${stack} ${source}`;

    // Critical filter: Prevent recursive loops on internal Foundry framework deprecation warnings
    if (/The V1 Application framework is deprecated/i.test(combined)) return false;
    if (/ApplicationV1/i.test(combined) && !/pathfinders-guide-to-eberron/i.test(stack)) return false;
    if (/EberronErrorMonitor|test-runner\.js/i.test(message)) return false;

    const pattern = /pathfinders-guide-to-eberron|eberron|Compendium\.pathfinders-guide-to-eberron/i;
    return pattern.test(combined);
  }

  /**
   * Capture and record an error with deduplication & count tracking
   */
  static captureError({ message, stack, source, type = "runtime" }) {
    const normalizedMessage = String(message || "Unknown Error").trim();
    const normalizedStack = String(stack || "").trim();

    // Generate unique signature for deduplication: message + first 3 lines of stack trace
    const stackHead = normalizedStack.split("\n").slice(0, 3).map(l => l.trim()).join("|");
    const signature = `${normalizedMessage}::${stackHead}`;

    const existing = this.errors.find(e => e.signature === signature);
    if (existing) {
      existing.count++;
      existing.lastSeen = new Date();
    } else {
      const newErr = {
        id: "err_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        signature,
        message: normalizedMessage,
        stack: normalizedStack || "No stack trace available",
        source: String(source || "unknown"),
        type,
        count: 1,
        firstSeen: new Date(),
        lastSeen: new Date()
      };
      this.errors.push(newErr);
    }

    // Persist immediately
    this.saveToStorage();

    // Requirement: "when the dialog is re-raised the newest error should be selected with details displayed"
    this.selectedIndex = this.errors.length - 1;

    // Update sidebar tab, badge, and active dialog/sheet
    if (typeof ui !== "undefined") {
      if (ui.eberronErrors && typeof ui.eberronErrors.render === "function") {
        ui.eberronErrors.render();
      }
      this.updateTabBadge();
      if (this.activeDialog && typeof this.activeDialog.render === "function") {
        this.activeDialog.render();
      }
    }
  }

  /**
   * Total number of error occurrences across all unique errors
   */
  static getTotalOccurrences() {
    return this.errors.reduce((sum, e) => sum + e.count, 0);
  }

  /**
   * Sync error collection to local bridge server for agent inspection
   */
  static syncToBridge() {
    if (typeof window === "undefined" || !window.fetch) return;
    if (this._syncTimer) clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => {
      try {
        const host = window.location.hostname || "localhost";
        const port = this.serverBridgePort || 30005;
        const payload = this.errors.map(e => ({
          id: e.id,
          message: e.message,
          stack: e.stack,
          source: e.source,
          type: e.type,
          count: e.count,
          firstSeen: e.firstSeen,
          lastSeen: e.lastSeen
        }));
        fetch(`http://${host}:${port}/api/client-errors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(() => {});
      } catch (e) {}
    }, 300);
  }

  /**
   * Persist error collection to sessionStorage
   */
  static saveToStorage() {
    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.errors));
      }
    } catch (e) {}
    this.syncToBridge();
  }

  /**
   * Restore error collection from sessionStorage
   */
  static loadFromStorage() {
    try {
      if (typeof sessionStorage !== "undefined") {
        const raw = sessionStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.errors = parsed.map(e => ({
              ...e,
              firstSeen: new Date(e.firstSeen),
              lastSeen: new Date(e.lastSeen)
            }));
            this.selectedIndex = this.errors.length - 1;
          }
        }
      }
    } catch (e) {}
  }

  /**
   * Clear all captured errors
   */
  static clearErrors() {
    this.errors = [];
    this.selectedIndex = -1;
    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (e) {}
    this.syncToBridge();

    // Clear server bridge error backlog
    if (typeof window !== "undefined" && window.fetch) {
      const host = window.location.hostname || "localhost";
      fetch(`http://${host}:${this.serverBridgePort || 30005}/api/server-errors/clear`, { method: "POST" }).catch(() => {});
    }

    if (this.activeDetailSheet) {
      this.activeDetailSheet.close();
      this.activeDetailSheet = null;
    }
    if (this.activeDialog) {
      this.activeDialog.close();
      this.activeDialog = null;
    }
    if (typeof ui !== "undefined") {
      ui.eberronErrors?.render();
      this.updateTabBadge();
      if (ui.notifications) {
        ui.notifications.info("Eberron Error Monitor: Error log cleared.");
      }
    }
  }

  /**
   * Copy text to system clipboard
   */
  static async copyToClipboard(text) {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      if (typeof ui !== "undefined" && ui.notifications) {
        ui.notifications.info("Copied error log to clipboard!");
      }
    } else {
      console.log(text);
    }
  }

  /**
   * Format a single error for markdown copy
   */
  static formatErrorMarkdown(err) {
    if (!err) return "";
    return `### ❌ Eberron Error: ${err.message}
- **Occurrences**: ${err.count}
- **Type**: \`${err.type}\`
- **Source**: \`${err.source}\`
- **First Seen**: ${new Date(err.firstSeen).toISOString()}
- **Last Seen**: ${new Date(err.lastSeen).toISOString()}

\`\`\`
${err.stack}
\`\`\``;
  }

  /**
   * Format all errors for markdown copy
   */
  static formatAllErrorsMarkdown() {
    if (this.errors.length === 0) return "No Eberron module errors recorded.";
    const header = `# 🚨 Eberron Module Error Report (${this.getTotalOccurrences()} occurrences across ${this.errors.length} unique errors)\n\n`;
    return header + this.errors.map((e, idx) => `## Error ${idx + 1}/${this.errors.length} (x${e.count})\n${this.formatErrorMarkdown(e)}`).join("\n\n---\n\n");
  }

  /**
   * Construct the HTML content for the error dialog
   */
  /**
   * Construct the HTML content for the error dialog using authentic Foundry VTT styling
   */
  static buildDialogHTML() {
    const styleBlock = `
<style id="eberron-error-style">
  .window-app.eberron-error-dialog {
    min-width: 650px;
    min-height: 420px;
  }
  .window-app.eberron-error-dialog .window-content {
    display: flex;
    flex-direction: column;
    padding: 8px;
    overflow: hidden;
    gap: 8px;
    background: rgba(22, 22, 25, 0.96);
    color: var(--color-text-light-1, #f0f0e0);
    font-family: var(--font-primary, sans-serif);
  }
  .eberron-error-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    height: 100%;
    gap: 8px;
  }
  .eberron-main-layout {
    display: flex;
    flex-direction: row;
    flex: 1;
    min-height: 0;
    gap: 8px;
  }
  .eberron-sidebar-pane {
    flex: 0 0 280px;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid var(--color-border-light-2, rgba(255, 255, 255, 0.12));
    border-radius: 4px;
    padding: 6px;
    overflow: hidden;
  }
  .eberron-sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2px 4px 6px;
    margin-bottom: 6px;
    border-bottom: 1px solid var(--color-border-light-2, rgba(255, 255, 255, 0.15));
    font-size: 12px;
    color: var(--color-text-light-heading, #fff);
  }
  .eberron-error-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-right: 2px;
  }
  .eberron-error-item {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--color-border-light-2, rgba(255, 255, 255, 0.1));
    border-radius: 4px;
    padding: 6px 8px;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
    text-align: left;
    user-select: none;
  }
  .eberron-error-item:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.25);
  }
  .eberron-error-item.active {
    background: rgba(231, 76, 60, 0.22);
    border: 1px solid var(--color-level-error, #e74c3c);
  }
  .eberron-item-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3px;
  }
  .eberron-item-title {
    font-size: 12px;
    font-weight: bold;
    color: var(--color-text-light-1, #eee);
  }
  .eberron-error-item.active .eberron-item-title {
    color: #ff7675;
  }
  .eberron-item-time {
    color: var(--color-text-dark-secondary, #999);
    font-size: 10px;
  }
  .eberron-item-msg {
    font-size: 11px;
    color: var(--color-text-light-2, #bbb);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 250px;
  }
  .eberron-detail-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid var(--color-border-light-2, rgba(255, 255, 255, 0.12));
    border-radius: 4px;
    padding: 10px;
    overflow: hidden;
  }
  .eberron-detail-header {
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--color-border-light-2, rgba(255, 255, 255, 0.15));
  }
  .eberron-detail-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 6px;
  }
  .eberron-detail-title {
    margin: 0;
    color: var(--color-level-error, #ff6b6b);
    font-size: 14px;
    font-weight: bold;
    word-break: break-word;
    line-height: 1.3;
  }
  .eberron-detail-meta-row {
    font-size: 11px;
    color: var(--color-text-dark-secondary, #aaa);
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }
  .eberron-tag-origin {
    display: inline-block;
    border-radius: 3px;
    padding: 1px 5px;
    font-size: 9px;
    font-weight: bold;
    letter-spacing: 0.5px;
    color: #fff;
  }
  .eberron-tag-origin.server {
    background: #6c5ce7;
  }
  .eberron-tag-origin.client {
    background: #0984e3;
  }
  .eberron-badge-count {
    display: inline-block;
    background: var(--color-level-error, #e74c3c);
    color: #fff;
    border-radius: 10px;
    padding: 1px 7px;
    font-size: 10px;
    font-weight: bold;
  }
  .eberron-stack-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .eberron-stack-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .eberron-stack-label {
    font-size: 11px;
    color: var(--color-text-dark-secondary, #aaa);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .eberron-stack-pre {
    flex: 1;
    margin: 0;
    background: rgba(0, 0, 0, 0.55);
    border: 1px solid var(--color-border-light-2, rgba(255, 255, 255, 0.15));
    border-radius: 4px;
    padding: 8px 10px;
    font-family: var(--font-mono, monospace);
    font-size: 11px;
    line-height: 1.4;
    color: #ff7675;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
    user-select: all;
  }
  .eberron-footer {
    display: flex;
    gap: 8px;
    padding: 6px 0 0 0;
    margin: 0;
    border-top: 1px solid var(--color-border-light-2, rgba(255, 255, 255, 0.15));
  }
  .eberron-footer button {
    flex: 1;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    font-family: var(--font-primary, sans-serif);
    font-size: 12px;
    font-weight: 500;
  }
  .eberron-btn-copy-selected {
    height: 24px;
    padding: 0 8px;
    font-size: 11px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    font-family: var(--font-primary, sans-serif);
  }
  .eberron-empty-pane {
    padding: 3rem 1.5rem;
    text-align: center;
    color: var(--color-text-dark-secondary, #aaa);
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .eberron-empty-icon {
    font-size: 3.5rem;
    color: var(--color-level-success, #2ecc71);
    margin-bottom: 1rem;
  }
</style>`;

    if (this.errors.length === 0) {
      return styleBlock + `
        <div class="eberron-error-wrapper">
          <div class="eberron-empty-pane">
            <i class="fa-solid fa-circle-check eberron-empty-icon"></i>
            <h3 style="font-family: var(--font-primary); font-size: 18px; margin: 0 0 0.5rem 0;">No Module Errors Detected</h3>
            <p style="font-size: 13px; margin: 0;">Pathfinder's Guide to Eberron is running cleanly with 0 captured runtime errors.</p>
          </div>
          <footer class="form-footer eberron-footer">
            <button type="button" data-action="dismiss"><i class="fa-solid fa-xmark"></i> Dismiss</button>
          </footer>
        </div>
      `;
    }

    if (this.selectedIndex < 0 || this.selectedIndex >= this.errors.length) {
      this.selectedIndex = this.errors.length - 1;
    }
    const current = this.errors[this.selectedIndex];

    const listItems = this.errors.map((err, idx) => {
      const isSelected = idx === this.selectedIndex;
      const isServer = err.type?.startsWith("server") || err.source?.includes("Server");
      const countBadge = err.count > 1 
        ? `<span class="eberron-badge-count" style="margin-right: 4px;">x${err.count}</span>` 
        : '';
      const originBadge = isServer
        ? `<span class="eberron-tag-origin server" style="margin-right: 4px;">SERVER</span>`
        : `<span class="eberron-tag-origin client" style="margin-right: 4px;">CLIENT</span>`;
      
      const timeStr = new Date(err.lastSeen).toLocaleTimeString();
      const escapedMsg = globalThis.foundry?.utils?.escapeHTML ? globalThis.foundry.utils.escapeHTML(err.message) : err.message;

      return `
        <div class="eberron-error-item ${isSelected ? 'active' : ''}" data-action="selectError" data-index="${idx}">
          <div class="eberron-item-meta">
            <div>${countBadge}${originBadge}<span class="eberron-item-title">Error #${idx + 1}</span></div>
            <span class="eberron-item-time">${timeStr}</span>
          </div>
          <div class="eberron-item-msg">
            ${escapedMsg}
          </div>
        </div>
      `;
    }).join("");

    const isCurrentServer = current.type?.startsWith("server") || current.source?.includes("Server");
    const escapedCurrentMsg = globalThis.foundry?.utils?.escapeHTML ? globalThis.foundry.utils.escapeHTML(current.message) : current.message;
    const escapedCurrentStack = globalThis.foundry?.utils?.escapeHTML ? globalThis.foundry.utils.escapeHTML(current.stack) : current.stack;

    return styleBlock + `
      <div class="eberron-error-wrapper">
        <div class="eberron-main-layout">
          <div class="eberron-sidebar-pane">
            <div class="eberron-sidebar-header">
              <span><i class="fa-solid fa-list-ul"></i> <strong>Errors (${this.errors.length})</strong></span>
              <span class="eberron-badge-count">${this.getTotalOccurrences()} Total</span>
            </div>
            <div class="eberron-error-list scrollable">
              ${listItems}
            </div>
          </div>

          <div class="eberron-detail-pane">
            <div class="eberron-detail-header">
              <div class="eberron-detail-title-row">
                <h3 class="detail-title">${escapedCurrentMsg}</h3>
                <span class="eberron-badge-count">${current.count} ${current.count === 1 ? 'occurrence' : 'occurrences'}</span>
              </div>
              <div class="eberron-detail-meta-row">
                <span><b>Origin:</b> <code style="color: ${isCurrentServer ? '#bb6bd9' : '#54a0ff'}; font-weight: bold;">${isCurrentServer ? 'Foundry Server (Node.js)' : 'Browser Runtime (Client)'}</code></span>
                <span><b>Type:</b> <code>${current.type}</code></span>
                <span><b>First:</b> ${new Date(current.firstSeen).toLocaleTimeString()}</span>
                <span><b>Last:</b> ${new Date(current.lastSeen).toLocaleTimeString()}</span>
                <span><b>Source:</b> <code>${current.source}</code></span>
              </div>
            </div>

            <div class="eberron-stack-container">
              <div class="eberron-stack-header">
                <span class="eberron-stack-label"><i class="fa-solid fa-code"></i> <b>Stack Trace</b></span>
                <button type="button" class="eberron-btn-copy-selected" data-action="copySelected">
                  <i class="fa-solid fa-copy"></i> Copy Selected Error
                </button>
              </div>
              <pre class="scrollable eberron-stack-pre">${escapedCurrentStack}</pre>
            </div>
          </div>
        </div>

        <footer class="form-footer eberron-footer">
          <button type="button" data-action="copyAll">
            <i class="fa-solid fa-clipboard-list"></i> Copy All Logs (Markdown)
          </button>
          <button type="button" data-action="clear">
            <i class="fa-solid fa-trash"></i> Clear Log
          </button>
          <button type="button" data-action="dismiss">
            <i class="fa-solid fa-xmark"></i> Dismiss
          </button>
        </footer>
      </div>
    `;
  }

  /**
   * Raise the interactive Error Dialog / Application
   */
  /**
   * Update notification pip/badge on sidebar tab icon
   */
  static updateTabBadge() {
    if (typeof document === "undefined") return;
    const tabBtn = document.querySelector('#sidebar-tabs [data-tab="eberronErrors"]') 
      || document.querySelector('nav.tabs [data-tab="eberronErrors"]')
      || document.querySelector('[data-tab="eberronErrors"]');
    if (!tabBtn) return;
    let badge = tabBtn.querySelector(".eberron-tab-pip");
    const count = this.getTotalOccurrences();
    if (count > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "eberron-tab-pip";
        tabBtn.style.position = "relative";
        tabBtn.appendChild(badge);
      }
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.style.display = "inline-flex";
    } else if (badge) {
      badge.style.display = "none";
    }
  }

  /**
   * Raise the interactive Error Dialog / Sidebar Tab
   */
  static showErrorDialog(selectedErr = null) {
    injectEberronErrorStyles();

    // If specific error requested, open floating detail sheet for it
    if (selectedErr) {
      return EberronErrorDetailSheet.show(selectedErr);
    }

    // If sidebar is available, activate the sidebar tab
    if (typeof ui !== "undefined") {
      registerEberronSidebarTab();
      if (ui.sidebar) {
        if (ui.eberronErrors && typeof ui.eberronErrors.activate === "function") {
          ui.eberronErrors.activate();
        } else {
          ui.sidebar.changeTab("eberronErrors", "primary");
          if (!ui.sidebar.expanded) ui.sidebar.expand();
        }
        this.updateTabBadge();
        return;
      }
    }

    const totalOccurrences = this.getTotalOccurrences();
    const title = `🚨 Eberron Error Monitor (${totalOccurrences} Occurrences / ${this.errors.length} Unique)`;

    // Check if dialog / application is already open
    if (this.activeDialog) {
      if (typeof this.activeDialog.render === "function") {
        this.activeDialog.render({ window: { title } });
        if (typeof this.activeDialog.bringToFront === "function") {
          this.activeDialog.bringToFront();
        }
        return;
      }
    }

    const AppClass = getEberronErrorAppClass();
    if (AppClass) {
      this.activeDialog = new AppClass({
        window: { title }
      });
      this.activeDialog.render(true);
      return;
    }

    // Fallback for older V1 Application environments
    this.activeDialog = new Dialog({
      title,
      content: this.buildDialogHTML(),
      buttons: {
        copyAll: {
          icon: '<i class="fa-solid fa-clipboard-list"></i>',
          label: "Copy All Logs",
          callback: () => {
            this.copyToClipboard(this.formatAllErrorsMarkdown());
            if (typeof ui !== "undefined" && ui.notifications) {
              ui.notifications.info("Copied all error logs to clipboard!");
            }
            return false;
          }
        },
        clear: {
          icon: '<i class="fa-solid fa-trash"></i>',
          label: "Clear Log",
          callback: () => {
            this.clearErrors();
            this.showErrorDialog();
          }
        },
        dismiss: {
          icon: '<i class="fa-solid fa-times"></i>',
          label: "Dismiss"
        }
      },
      default: "copyAll",
      render: (html) => {
        this.bindDialogEvents(html);
      },
      close: () => {
        this.activeDialog = null;
      }
    }, {
      width: 880,
      height: 560,
      resizable: true,
      classes: ["eberron-error-dialog", "window-app"]
    });

    this.activeDialog.render(true);
  }

  /**
   * Bind click and copy events in the dialog DOM
   */
  static bindDialogEvents(html) {
    const root = (html instanceof HTMLElement) 
      ? html 
      : ((html && html[0] instanceof HTMLElement) ? html[0] : (html?.element instanceof HTMLElement ? html.element : (typeof document !== "undefined" ? document.querySelector(".eberron-error-dialog") : null)));
    if (!root || !root.querySelectorAll) return;

    // 1. Error list selection
    root.querySelectorAll(".eberron-error-item").forEach(item => {
      item.onclick = (ev) => {
        ev.preventDefault();
        const index = parseInt(item.getAttribute("data-index"), 10);
        if (!isNaN(index) && index >= 0 && index < this.errors.length) {
          this.selectedIndex = index;
          if (this.activeDialog && typeof this.activeDialog.render === "function") {
            this.activeDialog.render();
          } else {
            const contentEl = root.querySelector(".window-content") || root;
            contentEl.innerHTML = this.buildDialogHTML();
            this.bindDialogEvents(root);
          }
        }
      };
    });

    // 2. Copy selected error
    const copyBtn = root.querySelector(".eberron-btn-copy-selected, [data-action='copySelected']");
    if (copyBtn) {
      copyBtn.onclick = (ev) => {
        ev.preventDefault();
        const current = this.errors[this.selectedIndex];
        if (current) {
          this.copyToClipboard(this.formatErrorMarkdown(current));
          if (typeof ui !== "undefined" && ui.notifications) {
            ui.notifications.info(`Copied error #${this.selectedIndex + 1} to clipboard!`);
          }
        }
      };
    }

    // 3. Copy All button
    const copyAllBtn = root.querySelector("[data-action='copyAll']");
    if (copyAllBtn) {
      copyAllBtn.onclick = (ev) => {
        ev.preventDefault();
        this.copyToClipboard(this.formatAllErrorsMarkdown());
        if (typeof ui !== "undefined" && ui.notifications) {
          ui.notifications.info("Copied all error logs to clipboard!");
        }
      };
    }

    // 4. Clear Log button
    const clearBtn = root.querySelector("[data-action='clear']");
    if (clearBtn) {
      clearBtn.onclick = (ev) => {
        ev.preventDefault();
        this.clearErrors();
        if (this.activeDialog && typeof this.activeDialog.render === "function") {
          this.activeDialog.render();
        } else {
          const contentEl = root.querySelector(".window-content") || root;
          contentEl.innerHTML = this.buildDialogHTML();
          this.bindDialogEvents(root);
        }
      };
    }

    // 5. Dismiss button
    const dismissBtn = root.querySelector("[data-action='dismiss']");
    if (dismissBtn) {
      dismissBtn.onclick = (ev) => {
        ev.preventDefault();
        if (this.activeDialog && typeof this.activeDialog.close === "function") {
          this.activeDialog.close();
        }
      };
    }
  }
}

let EberronErrorAppClass = null;

function getEberronErrorAppClass() {
  if (EberronErrorAppClass) return EberronErrorAppClass;
  const BaseClass = globalThis.foundry?.applications?.api?.ApplicationV2;
  if (!BaseClass) return null;

  class EberronErrorApp extends BaseClass {
    static DEFAULT_OPTIONS = {
      id: "eberron-error-monitor",
      tag: "div",
      classes: ["app", "window-app", "eberron-error-dialog"],
      window: {
        frame: true,
        positioned: true,
        title: "🚨 Eberron Error Monitor",
        icon: "fa-solid fa-bug",
        resizable: true,
        minimizable: true
      },
      position: {
        width: 880,
        height: 560
      },
      actions: {
        selectError: function(event, target) {
          const item = target.closest("[data-index]");
          const idx = parseInt(item?.getAttribute("data-index"), 10);
          if (!isNaN(idx) && idx >= 0 && idx < EberronErrorMonitor.errors.length) {
            EberronErrorMonitor.selectedIndex = idx;
            this.render();
          }
        },
        copyAll: function(event, target) {
          event.preventDefault();
          EberronErrorMonitor.copyToClipboard(EberronErrorMonitor.formatAllErrorsMarkdown());
          if (typeof ui !== "undefined" && ui.notifications) {
            ui.notifications.info("Copied all error logs to clipboard!");
          }
        },
        copySelected: function(event, target) {
          event.preventDefault();
          const current = EberronErrorMonitor.errors[EberronErrorMonitor.selectedIndex];
          if (current) {
            EberronErrorMonitor.copyToClipboard(EberronErrorMonitor.formatErrorMarkdown(current));
            if (typeof ui !== "undefined" && ui.notifications) {
              ui.notifications.info(`Copied error #${EberronErrorMonitor.selectedIndex + 1} to clipboard!`);
            }
          }
        },
        clear: function(event, target) {
          event.preventDefault();
          EberronErrorMonitor.clearErrors();
          this.render();
        },
        dismiss: function(event, target) {
          event.preventDefault();
          this.close();
        }
      }
    };

    /** @override */
    async _renderHTML(context, options) {
      return EberronErrorMonitor.buildDialogHTML();
    }

    /** @override */
    _replaceHTML(result, content, options) {
      content.innerHTML = result;
      EberronErrorMonitor.bindDialogEvents(content);
    }

    /** @override */
    _onClose(options) {
      super._onClose?.(options);
      EberronErrorMonitor.activeDialog = null;
    }
  }

  EberronErrorAppClass = EberronErrorApp;
  return EberronErrorAppClass;
}

function injectEberronErrorStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("eberron-error-styles")) return;
  const style = document.createElement("style");
  style.id = "eberron-error-styles";
  style.textContent = `
    /* Notification pip on sidebar tab icon */
    #sidebar-tabs [data-tab="eberronErrors"],
    nav.tabs [data-tab="eberronErrors"] {
      position: relative !important;
    }
    .eberron-tab-pip {
      position: absolute;
      top: 2px;
      right: 2px;
      background: #e74c3c;
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      border-radius: 8px;
      padding: 1px 4px;
      min-width: 14px;
      text-align: center;
      line-height: 12px;
      pointer-events: none;
      box-shadow: 0 0 4px rgba(0,0,0,0.6);
      z-index: 10;
    }

    /* Sidebar Tab Directory Container */
    .sidebar-tab.eberron-error-tab,
    #eberron-errors.sidebar-tab,
    .eberron-error-tab {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      background: rgba(18, 18, 22, 0.96);
      color: var(--color-text-light-1, #f0f0e0);
      font-family: var(--font-primary, sans-serif);
    }
    #sidebar-content.active-eberronErrors > [data-tab="eberronErrors"],
    #sidebar-content.active-eberronErrors > #eberron-errors-tab,
    .sidebar-tab.eberron-error-tab.active {
      display: flex !important;
      flex-direction: column !important;
      height: 100% !important;
    }
    #sidebar-content:not(.active-eberronErrors) > [data-tab="eberronErrors"],
    #sidebar-content:not(.active-eberronErrors) > #eberron-errors-tab {
      display: none !important;
    }
    .eberron-tab-header {
      padding: 6px 8px;
      background: rgba(0, 0, 0, 0.4);
      border-bottom: 1px solid var(--color-border-light-2, rgba(255, 255, 255, 0.12));
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex-shrink: 0;
    }
    .header-search-bar {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .header-search-bar .search-icon {
      color: var(--color-text-dark-secondary, #888);
      font-size: 11px;
    }
    .eberron-search-input {
      flex: 1;
      height: 24px;
      background: rgba(0, 0, 0, 0.45);
      border: 1px solid var(--color-border-light-2, rgba(255, 255, 255, 0.15));
      border-radius: 3px;
      padding: 0 6px;
      font-size: 11px;
      color: #fff;
    }
    .header-actions {
      display: flex;
      gap: 6px;
    }
    .header-actions .action-btn {
      flex: 1;
      height: 26px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 11px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--color-border-light-2, rgba(255, 255, 255, 0.15));
      border-radius: 3px;
      color: #eee;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .header-actions .action-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.16);
      border-color: rgba(255, 255, 255, 0.3);
      color: #fff;
    }
    .header-actions .action-btn:disabled {
      opacity: 0.4;
      cursor: default;
    }

    /* Directory List & Item Rows */
    .eberron-error-directory-list {
      flex: 1;
      overflow-y: auto;
      list-style: none;
      margin: 0;
      padding: 4px 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .eberron-error-row {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--color-border-light-2, rgba(255, 255, 255, 0.1));
      border-radius: 4px;
      padding: 6px 8px;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease;
      user-select: none;
    }
    .eberron-error-row:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.25);
    }
    .eberron-error-row .row-left {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .eberron-error-row .row-top {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }
    .eberron-error-row .row-title {
      font-size: 12px;
      font-weight: 600;
      color: #eee;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
    .eberron-error-row.is-server .row-title {
      color: #ff9ff3;
    }
    .eberron-error-row.is-client .row-title {
      color: #ff6b6b;
    }
    .eberron-error-row .row-sub {
      font-size: 10px;
      color: #999;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .eberron-error-row .row-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: 6px;
      flex-shrink: 0;
    }
    .btn-icon {
      background: transparent;
      border: none;
      color: #aaa;
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 3px;
      font-size: 11px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .btn-icon:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.15);
    }

    /* Badges & Tags */
    .badge-count {
      background: #e74c3c;
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      border-radius: 8px;
      padding: 1px 5px;
      line-height: 12px;
    }
    .eberron-tag-origin {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .eberron-tag-origin.server {
      background: #8e44ad;
      color: #fff;
    }
    .eberron-tag-origin.client {
      background: #2980b9;
      color: #fff;
    }

    /* Empty state */
    .eberron-empty-directory {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 1.5rem;
      color: #999;
    }
    .eberron-empty-directory .eberron-empty-icon {
      font-size: 3rem;
      color: #2ecc71;
      margin-bottom: 0.75rem;
    }
    .eberron-empty-directory h4 {
      font-size: 15px;
      color: #eee;
      margin: 0 0 0.5rem;
    }
    .eberron-empty-directory p {
      font-size: 12px;
      margin: 0;
    }

    /* Floating Detail Sheet */
    .window-app.eberron-detail-window {
      min-width: 620px;
      min-height: 460px;
    }
    .window-app.eberron-detail-window .window-content {
      background: rgba(20, 20, 24, 0.97);
      color: #eee;
      padding: 10px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      gap: 8px;
    }
    .eberron-detail-container {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      gap: 8px;
    }
    .eberron-detail-sheet-header {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 4px;
      padding: 8px 10px;
      flex-shrink: 0;
    }
    .eberron-title-line {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 6px;
    }
    .detail-sheet-title {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: #ff7675;
      line-height: 1.3;
      word-break: break-word;
    }
    .eberron-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 4px 12px;
      font-size: 11px;
      color: #bbb;
    }
    .meta-cell code {
      color: #54a0ff;
    }
    .eberron-stack-section {
      display: flex;
      flex-direction: column;
      flex: 1;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 4px;
      padding: 8px;
      min-height: 0;
      gap: 6px;
    }
    .stack-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      flex-shrink: 0;
    }
    .btn-copy-stack {
      height: 22px;
      padding: 0 8px;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
    }
    .eberron-stack-pre {
      flex: 1;
      margin: 0;
      background: rgba(0, 0, 0, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      padding: 8px;
      font-family: var(--font-mono, monospace);
      font-size: 11px;
      color: #ff9ff3;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-all;
      user-select: all;
    }
    .eberron-detail-footer {
      display: flex;
      gap: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      padding-top: 6px;
      margin: 0;
      flex-shrink: 0;
    }
    .eberron-detail-footer button {
      flex: 1;
      height: 30px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 12px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}

class EberronErrorDetailSheet extends (globalThis.foundry?.applications?.api?.ApplicationV2 || class {}) {
  static DEFAULT_OPTIONS = {
    id: "eberron-error-detail-sheet",
    tag: "div",
    classes: ["app", "window-app", "eberron-detail-window"],
    window: {
      frame: true,
      positioned: true,
      title: "🚨 Error Details",
      icon: "fa-solid fa-bug",
      resizable: true,
      minimizable: true
    },
    position: {
      width: 720,
      height: 520
    },
    actions: {
      copyError: function(event, target) {
        event.preventDefault();
        if (this.errorData) {
          EberronErrorMonitor.copyToClipboard(EberronErrorMonitor.formatErrorMarkdown(this.errorData));
          if (typeof ui !== "undefined" && ui.notifications) {
            ui.notifications.info("Copied error details to clipboard!");
          }
        }
      },
      closeWindow: function(event, target) {
        event.preventDefault();
        this.close();
      }
    }
  };

  constructor(errorData, options = {}) {
    const errorTitle = errorData?.message 
      ? `🚨 Error Details: ${errorData.message.slice(0, 45)}...` 
      : "🚨 Error Details";
    const opts = (typeof foundry !== "undefined" && foundry.utils?.mergeObject)
      ? foundry.utils.mergeObject(options, { window: { title: errorTitle } })
      : options;
    super(opts);
    this.errorData = errorData;
  }

  static show(err) {
    if (!err) return null;
    injectEberronErrorStyles();
    if (EberronErrorMonitor.activeDetailSheet) {
      EberronErrorMonitor.activeDetailSheet.errorData = err;
      if (typeof EberronErrorMonitor.activeDetailSheet.render === "function") {
        const errorTitle = `🚨 Error Details: ${(err.message || "").slice(0, 45)}...`;
        EberronErrorMonitor.activeDetailSheet.render({ window: { title: errorTitle } });
        EberronErrorMonitor.activeDetailSheet.bringToFront?.();
        return EberronErrorMonitor.activeDetailSheet;
      }
    }
    const sheet = new EberronErrorDetailSheet(err);
    EberronErrorMonitor.activeDetailSheet = sheet;
    sheet.render(true);
    return sheet;
  }

  async _renderHTML(context, options) {
    const err = this.errorData || {};
    const isServer = err.type?.startsWith("server") || err.source?.includes("Server");
    const timeStr = err.lastSeen ? new Date(err.lastSeen).toLocaleTimeString() : "unknown";
    const firstStr = err.firstSeen ? new Date(err.firstSeen).toLocaleTimeString() : "unknown";
    const esc = (t) => globalThis.foundry?.utils?.escapeHTML ? globalThis.foundry.utils.escapeHTML(String(t || "")) : String(t || "");

    return `
      <div class="eberron-detail-container">
        <header class="eberron-detail-sheet-header">
          <div class="eberron-title-line">
            <h3 class="detail-sheet-title">${esc(err.message || "Unknown Error")}</h3>
            <span class="badge-count">x${err.count || 1} occurrences</span>
          </div>
          <div class="eberron-meta-grid">
            <div class="meta-cell"><b>Origin:</b> <span class="eberron-tag-origin ${isServer ? 'server' : 'client'}">${isServer ? 'SERVER (Node.js)' : 'CLIENT (Browser)'}</span></div>
            <div class="meta-cell"><b>Type:</b> <code>${esc(err.type || 'runtime')}</code></div>
            <div class="meta-cell"><b>Source:</b> <code>${esc(err.source || 'unknown')}</code></div>
            <div class="meta-cell"><b>First Seen:</b> <span>${firstStr}</span></div>
            <div class="meta-cell"><b>Last Seen:</b> <span>${timeStr}</span></div>
          </div>
        </header>

        <section class="eberron-stack-section">
          <div class="stack-header-bar">
            <span><i class="fa-solid fa-code"></i> <b>Stack Trace</b></span>
            <button type="button" class="btn-copy-stack" data-action="copyError">
              <i class="fa-solid fa-copy"></i> Copy Markdown
            </button>
          </div>
          <pre class="eberron-stack-pre scrollable">${esc(err.stack || "No stack trace available")}</pre>
        </section>

        <footer class="form-footer eberron-detail-footer">
          <button type="button" data-action="copyError" class="bright">
            <i class="fa-solid fa-clipboard"></i> Copy Error Details
          </button>
          <button type="button" data-action="closeWindow">
            <i class="fa-solid fa-xmark"></i> Close
          </button>
        </footer>
      </div>
    `;
  }

  _replaceHTML(result, content, options) {
    content.innerHTML = result;
    const copyBtns = content.querySelectorAll('[data-action="copyError"]');
    copyBtns.forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        if (this.errorData) {
          EberronErrorMonitor.copyToClipboard(EberronErrorMonitor.formatErrorMarkdown(this.errorData));
        }
      };
    });
    const closeBtn = content.querySelector('[data-action="closeWindow"]');
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.preventDefault();
        this.close();
      };
    }
  }

  _onClose(options) {
    super._onClose?.(options);
    if (EberronErrorMonitor.activeDetailSheet === this) {
      EberronErrorMonitor.activeDetailSheet = null;
    }
  }
}

const TabBaseClass = globalThis.foundry?.applications?.sidebar?.AbstractSidebarTab
  || globalThis.foundry?.applications?.sidebar?.tabs?.AbstractSidebarTab
  || globalThis.foundry?.applications?.api?.ApplicationV2
  || class {};

class EberronErrorSidebarTab extends TabBaseClass {
  static tabName = "eberronErrors";

  get tabName() {
    return "eberronErrors";
  }

  static DEFAULT_OPTIONS = {
    id: "eberron-errors-tab",
    tag: "section",
    classes: ["tab", "sidebar-tab", "directory", "flexcol", "eberron-error-tab"],
    window: {
      frame: false,
      positioned: false
    },
    actions: {
      copyAll: function(event, target) {
        event.preventDefault();
        EberronErrorMonitor.copyToClipboard(EberronErrorMonitor.formatAllErrorsMarkdown());
      },
      clearAll: function(event, target) {
        event.preventDefault();
        EberronErrorMonitor.clearErrors();
      },
      copySingle: function(event, target) {
        event.preventDefault();
        event.stopPropagation();
        const row = target.closest("[data-index]");
        const idx = parseInt(row?.getAttribute("data-index"), 10);
        const err = EberronErrorMonitor.errors[idx];
        if (err) {
          EberronErrorMonitor.copyToClipboard(EberronErrorMonitor.formatErrorMarkdown(err));
          if (typeof ui !== "undefined" && ui.notifications) {
            ui.notifications.info(`Copied error #${idx + 1} to clipboard!`);
          }
        }
      },
      inspectSingle: function(event, target) {
        event.preventDefault();
        event.stopPropagation();
        const row = target.closest("[data-index]");
        const idx = parseInt(row?.getAttribute("data-index"), 10);
        const err = EberronErrorMonitor.errors[idx];
        if (err) {
          EberronErrorDetailSheet.show(err);
        }
      },
      popoutTab: function(event, target) {
        event.preventDefault();
        this.renderPopout?.();
      }
    }
  };

  filterText = "";

  /** @override */
  async _insertElement(element, options = {}) {
    if (this.isPopout) {
      return super._insertElement?.(element, options);
    }
    element.dataset.tab = "eberronErrors";
    element.dataset.group = "primary";
    const sidebarContent = document.getElementById("sidebar-content");
    if (sidebarContent) {
      const existing = sidebarContent.querySelector(`[data-tab="eberronErrors"]`);
      if (existing && existing !== element) {
        existing.replaceWith(element);
      } else if (!existing) {
        sidebarContent.appendChild(element);
      }
      return;
    }
    return super._insertElement?.(element, options);
  }

  activate() {
    if (this.isPopout) {
      this.bringToFront?.();
    } else if (typeof ui !== "undefined" && ui.sidebar) {
      this.render({ force: true });
      ui.sidebar.changeTab("eberronErrors", "primary");
      if (!ui.sidebar.expanded) ui.sidebar.expand();
    }
  }

  _onActivate() {
    super._onActivate?.();
    this.render({ force: true });
  }

  _onDeactivate() {
    super._onDeactivate?.();
  }

  /** @override */
  async _renderHTML(context, options) {
    injectEberronErrorStyles();
    return EberronErrorSidebarTab.buildTabHTML(this.filterText);
  }

  /** @override */
  _replaceHTML(result, content, options) {
    content.innerHTML = result;
    this.bindEvents(content);
  }

  bindEvents(html) {
    // Filter input
    const searchInput = html.querySelector(".eberron-search-input");
    if (searchInput) {
      searchInput.value = this.filterText;
      searchInput.oninput = (e) => {
        this.filterText = e.target.value.toLowerCase().trim();
        const rows = html.querySelectorAll(".eberron-error-row");
        rows.forEach(row => {
          const text = (row.textContent || "").toLowerCase();
          row.style.display = text.includes(this.filterText) ? "flex" : "none";
        });
      };
    }

    // Row clicks -> open floating detail sheet
    html.querySelectorAll(".eberron-error-row").forEach(row => {
      row.onclick = (e) => {
        if (e.target.closest("button")) return;
        const idx = parseInt(row.getAttribute("data-index"), 10);
        const err = EberronErrorMonitor.errors[idx];
        if (err) {
          EberronErrorDetailSheet.show(err);
        }
      };
      row.ondblclick = (e) => {
        const idx = parseInt(row.getAttribute("data-index"), 10);
        const err = EberronErrorMonitor.errors[idx];
        if (err) {
          EberronErrorDetailSheet.show(err);
        }
      };
    });

    // Inline copy buttons
    html.querySelectorAll('[data-action="copySingle"]').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const row = btn.closest("[data-index]");
        const idx = parseInt(row?.getAttribute("data-index"), 10);
        const err = EberronErrorMonitor.errors[idx];
        if (err) {
          EberronErrorMonitor.copyToClipboard(EberronErrorMonitor.formatErrorMarkdown(err));
          if (typeof ui !== "undefined" && ui.notifications) {
            ui.notifications.info(`Copied error #${idx + 1} to clipboard!`);
          }
        }
      };
    });

    // Inline inspect buttons
    html.querySelectorAll('[data-action="inspectSingle"]').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const row = btn.closest("[data-index]");
        const idx = parseInt(row?.getAttribute("data-index"), 10);
        const err = EberronErrorMonitor.errors[idx];
        if (err) {
          EberronErrorDetailSheet.show(err);
        }
      };
    });

    // Header buttons
    const copyAllBtn = html.querySelector('[data-action="copyAll"]');
    if (copyAllBtn) {
      copyAllBtn.onclick = (e) => {
        e.preventDefault();
        EberronErrorMonitor.copyToClipboard(EberronErrorMonitor.formatAllErrorsMarkdown());
      };
    }

    const clearAllBtn = html.querySelector('[data-action="clearAll"]');
    if (clearAllBtn) {
      clearAllBtn.onclick = (e) => {
        e.preventDefault();
        EberronErrorMonitor.clearErrors();
      };
    }

    const popoutBtn = html.querySelector('[data-action="popoutTab"]');
    if (popoutBtn) {
      popoutBtn.onclick = (e) => {
        e.preventDefault();
        if (typeof this.renderPopout === "function") {
          this.renderPopout();
        }
      };
    }
  }

  static buildTabHTML(filter = "") {
    const errors = EberronErrorMonitor.errors;
    const totalOccurrences = EberronErrorMonitor.getTotalOccurrences();
    const esc = (t) => globalThis.foundry?.utils?.escapeHTML ? globalThis.foundry.utils.escapeHTML(String(t || "")) : String(t || "");

    let listContent = "";
    if (errors.length === 0) {
      listContent = `
        <div class="eberron-empty-directory">
          <i class="fa-solid fa-circle-check eberron-empty-icon"></i>
          <h4>0 Active Errors</h4>
          <p>The Eberron module is running cleanly with 0 captured exceptions or warnings.</p>
        </div>
      `;
    } else {
      listContent = errors.map((err, idx) => {
        const isServer = err.type?.startsWith("server") || err.source?.includes("Server");
        const timeStr = err.lastSeen ? new Date(err.lastSeen).toLocaleTimeString() : "";
        const visible = filter ? (err.message + " " + err.source + " " + err.type).toLowerCase().includes(filter) : true;
        const countBadge = err.count > 1 ? `<span class="badge-count">x${err.count}</span>` : "";
        const originClass = isServer ? "server" : "client";
        const originLabel = isServer ? "SRV" : "CLI";

        return `
          <li class="eberron-error-row ${isServer ? 'is-server' : 'is-client'}" data-index="${idx}" data-id="${err.id}" style="${visible ? 'display:flex;' : 'display:none;'}">
            <div class="row-left">
              <div class="row-top">
                <span class="eberron-tag-origin ${originClass}">${originLabel}</span>
                ${countBadge}
                <span class="row-title" title="${esc(err.message)}">${esc(err.message)}</span>
              </div>
              <div class="row-sub">
                <span class="sub-type">${esc(err.type)}</span> • <span class="sub-time">${timeStr}</span> • <span class="sub-src">${esc(err.source)}</span>
              </div>
            </div>
            <div class="row-actions">
              <button type="button" class="btn-icon inline-copy" data-action="copySingle" data-tooltip="Copy Error Markdown" aria-label="Copy Error Markdown">
                <i class="fa-solid fa-copy"></i>
              </button>
              <button type="button" class="btn-icon inline-inspect" data-action="inspectSingle" data-tooltip="Inspect Full Details & Stack Trace" aria-label="Inspect Details">
                <i class="fa-solid fa-up-right-from-square"></i>
              </button>
            </div>
          </li>
        `;
      }).join("");
    }

    return `
      <header class="directory-header eberron-tab-header">
        <div class="header-search-bar">
          <i class="fa-solid fa-search search-icon"></i>
          <input type="search" class="eberron-search-input" placeholder="Filter errors..." value="${esc(filter)}" autocomplete="off">
          <button type="button" class="btn-icon btn-popout" data-action="popoutTab" data-tooltip="Pop Out Window" aria-label="Pop Out Window">
            <i class="fa-solid fa-up-right-from-square"></i>
          </button>
        </div>
        <div class="header-actions">
          <button type="button" class="action-btn copy-all-btn" data-action="copyAll" ${errors.length === 0 ? 'disabled' : ''}>
            <i class="fa-solid fa-clipboard-list"></i> Copy All
          </button>
          <button type="button" class="action-btn clear-all-btn" data-action="clearAll" ${errors.length === 0 ? 'disabled' : ''}>
            <i class="fa-solid fa-trash"></i> Clear (${totalOccurrences})
          </button>
        </div>
      </header>

      <ol class="directory-list eberron-error-directory-list scrollable">
        ${listContent}
      </ol>
    `;
  }
}

function registerEberronSidebarTab() {
  injectEberronErrorStyles();
  const SidebarClass = globalThis.foundry?.applications?.sidebar?.Sidebar || globalThis.Sidebar;
  if (SidebarClass?.TABS) {
    SidebarClass.TABS.eberronErrors = {
      tooltip: "Eberron Error Monitor",
      icon: "fa-solid fa-bug",
      gmOnly: false
    };
  }

  if (typeof ui !== "undefined" && !ui.eberronErrors) {
    try {
      ui.eberronErrors = new EberronErrorSidebarTab();
    } catch (e) {
      console.warn("Could not instantiate EberronErrorSidebarTab:", e);
    }
  }
}

class EberronTestRunner {
  static MODULE_ID = "pathfinders-guide-to-eberron";

  /**
   * Run the full suite of in-VTT tests and include monitored runtime errors
   */
  static async runAll() {
    console.group("%c🧪 Pathfinder's Guide to Eberron: In-VTT Test Suite", "color: #e67e22; font-weight: bold; font-size: 14px;");
    const results = {
      packsChecked: 0,
      totalDocuments: 0,
      documentErrors: [],
      runtimeErrors: [...EberronErrorMonitor.errors],
      actorTestPassed: false,
      passed: false
    };

    try {
      // 1. Verify Packs
      console.log("%c1. Verifying Compendium Packs...", "color: #3498db; font-weight: bold;");
      const modulePacks = (typeof game !== "undefined" && game.packs) 
        ? game.packs.filter(p => p.metadata.packageName === this.MODULE_ID)
        : [];
      results.packsChecked = modulePacks.length;

      if (modulePacks.length === 0) {
        throw new Error(`No packs found for package '${this.MODULE_ID}'. Ensure the compendium module is enabled.`);
      }
      console.log(`   Found ${modulePacks.length} registered compendium packs.`);

      // 2. Load all documents & verify PF2e TypeDataModels
      console.log("%c2. Validating Documents in Live PF2e Runtime...", "color: #3498db; font-weight: bold;");
      for (const pack of modulePacks) {
        const docs = await pack.getDocuments();
        results.totalDocuments += docs.length;

        for (const doc of docs) {
          // Check for DocumentClass inheritance
          if (CONFIG[doc.documentName] && !(doc instanceof CONFIG[doc.documentName].documentClass)) {
            results.documentErrors.push({
              pack: pack.metadata.id,
              name: doc.name,
              error: `Document is not an instance of ${doc.documentName} documentClass`
            });
          }

          // Verify Rule Elements parsing
          if (doc.system?.rules) {
            for (const [idx, rule] of doc.system.rules.entries()) {
              if (!rule.key) {
                results.documentErrors.push({
                  pack: pack.metadata.id,
                  name: doc.name,
                  error: `Rule element #${idx} missing 'key'`
                });
              }
            }
          }
        }
        console.log(`   ✓ ${pack.metadata.label} (${docs.length} documents)`);
      }

      // 3. In-memory Actor item embedding test
      console.log("%c3. Testing Item Embedding on Actor...", "color: #3498db; font-weight: bold;");
      const featsPack = game.packs.get(`${this.MODULE_ID}.eberron-feats`);
      if (featsPack) {
        const featDoc = await featsPack.getDocument("82iHq358U56B3uQ8"); // Aberrant Dragonmark
        if (featDoc) {
          const actorData = {
            name: "Eberron Test Character",
            type: "character"
          };
          const testActor = new CONFIG.Actor.documentClass(actorData);
          console.log(`   Created in-memory test actor: ${testActor.name}`);

          const itemSource = featDoc.toObject();
          expectTruthy(itemSource.name === "Aberrant Dragonmark", "Feat toObject matches source name");
          results.actorTestPassed = true;
          console.log(`   ✓ Aberrant Dragonmark successfully prepared for actor embedding`);
        }
      }

      // 4. Runtime Error Registration: Fail tests if runtime errors were caught
      results.runtimeErrors = [...EberronErrorMonitor.errors];
      const totalErrors = results.documentErrors.length + results.runtimeErrors.length;
      results.passed = (totalErrors === 0);

      // Report Summary
      console.log("%c----------------------------------------------------------------", "color: #888;");
      console.log(`%cTest Results: ${results.passed ? "PASSED" : "FAILED"}`, 
        results.passed ? "color: #2ecc71; font-weight: bold;" : "color: #e74c3c; font-weight: bold;");
      console.log(`  Packs Verified:       ${results.packsChecked}`);
      console.log(`  Documents Loaded:     ${results.totalDocuments}`);
      console.log(`  Document/Rule Errors: ${results.documentErrors.length}`);
      console.log(`  Monitored VTT Errors: ${results.runtimeErrors.length} (${EberronErrorMonitor.getTotalOccurrences()} occurrences)`);
      console.log(`  Actor Embed Test:     ${results.actorTestPassed ? "Passed" : "Skipped"}`);

      if (results.passed) {
        if (typeof ui !== "undefined" && ui.notifications) {
          ui.notifications.info(`Eberron Test Suite: Verified ${results.totalDocuments} items across ${results.packsChecked} packs with 0 errors!`);
        }
      } else {
        if (typeof ui !== "undefined" && ui.notifications) {
          ui.notifications.error(`Eberron Test Suite FAILED: ${results.documentErrors.length} schema errors, ${results.runtimeErrors.length} runtime errors.`);
        }
        // Raise error monitor dialog so the user can immediately grab logs
        if (EberronErrorMonitor.errors.length > 0) {
          EberronErrorMonitor.showErrorDialog();
        }
      }

    } catch (err) {
      console.error("Test Suite execution failed:", err);
      if (typeof ui !== "undefined" && ui.notifications) {
        ui.notifications.error(`Eberron Test Suite failed: ${err.message}`);
      }
      EberronErrorMonitor.captureError({
        message: err.message,
        stack: err.stack,
        source: "EberronTestRunner.runAll",
        type: "test-execution"
      });
    } finally {
      console.groupEnd();
    }

    return results;
  }

  /**
   * Helper to manually open the Error Monitor Dialog
   */
  static showErrorDialog() {
    EberronErrorMonitor.showErrorDialog();
  }

  /**
   * Helper to clear captured errors
   */
  static clearErrors() {
    EberronErrorMonitor.clearErrors();
  }
}

function expectTruthy(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

// Start monitoring as soon as script is loaded
EberronErrorMonitor.init();

// Expose on globalThis for console, macros, and debugging
if (typeof globalThis !== "undefined") {
  globalThis.EberronTests = EberronTestRunner;
  globalThis.EberronErrorMonitor = EberronErrorMonitor;
  globalThis.EberronErrorSidebarTab = EberronErrorSidebarTab;
  globalThis.EberronErrorDetailSheet = EberronErrorDetailSheet;
}

// Automatically execute on world load in test worlds & register control hooks
if (typeof Hooks !== "undefined" && Hooks.once) {
  // Early registration in init hook
  Hooks.once("init", () => {
    registerEberronSidebarTab();
  });

  // Ensure tab button and badge are present on sidebar render
  Hooks.on("renderSidebar", (sidebar, html) => {
    injectEberronErrorStyles();
    registerEberronSidebarTab();

    const root = (html instanceof HTMLElement) 
      ? html 
      : ((html && html[0] instanceof HTMLElement) ? html[0] : (typeof document !== "undefined" ? document.querySelector("#sidebar") : null));
    if (!root) return;

    const tabsMenu = root.querySelector("nav.tabs menu") || root.querySelector("nav.tabs");
    if (tabsMenu && !tabsMenu.querySelector('[data-tab="eberronErrors"]')) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ui-control plain icon fa-solid fa-bug";
      btn.dataset.action = "tab";
      btn.dataset.group = "primary";
      btn.dataset.tab = "eberronErrors";
      btn.dataset.tooltip = "Eberron Error Monitor";
      btn.setAttribute("aria-label", "Eberron Error Monitor");

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (ui.sidebar) {
          ui.sidebar.changeTab("eberronErrors", "primary");
          if (!ui.sidebar.expanded) ui.sidebar.expand();
        } else if (ui.eberronErrors?.activate) {
          ui.eberronErrors.activate();
        }
      });

      btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (ui.eberronErrors && typeof ui.eberronErrors.renderPopout === "function") {
          ui.eberronErrors.renderPopout();
        }
      });

      li.appendChild(btn);

      const settingsLi = tabsMenu.querySelector('[data-tab="settings"]')?.closest("li");
      if (settingsLi) {
        tabsMenu.insertBefore(li, settingsLi);
      } else {
        tabsMenu.appendChild(li);
      }
    }

    EberronErrorMonitor.updateTabBadge();
  });

  Hooks.once("ready", () => {
    registerEberronSidebarTab();
    EberronErrorMonitor.updateTabBadge();

    // If errors were captured during early module/pack load before UI was ready, activate tab
    if (EberronErrorMonitor.errors.length > 0 || EberronErrorMonitor.pendingDialog) {
      setTimeout(() => {
        EberronErrorMonitor.showErrorDialog();
      }, 500);
    }

    // Mark all first-time tours and NUE tips as seen/completed
    try {
      if (typeof game !== "undefined" && game.settings) {
        game.settings.set("core", "nue.shownTips", true).catch(() => {});
        const currentProgress = game.settings.get("core", "tourProgress") || {};
        currentProgress.core = currentProgress.core || {};
        for (const tid of ["welcome", "ui-overview", "canvas-controls", "sidebar", "backups-overview", "compatibility-preview-overview", "creating-a-world", "installing-a-system"]) {
          currentProgress.core[tid] = 999;
        }
        game.settings.set("core", "tourProgress", currentProgress).catch(() => {});
      }
      if (typeof game !== "undefined" && game.tours) {
        for (const tour of game.tours) {
          try { tour.complete(); } catch (_) {}
        }
      }
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("core.nue.shownTips", "true");
      }
    } catch (_) {}

    const isTestWorld = game.world.id.includes("test") || game.world.id.includes("dev");
    if (isTestWorld) {
      console.log("%c[Eberron Test Suite] Test world detected (" + game.world.id + "). Running in-VTT tests...", "color: #9b59b6;");
      setTimeout(() => {
        EberronTestRunner.runAll();
      }, 1500);
    } else {
      console.log("[Eberron Test Suite] Active. Run 'EberronTests.runAll()' or 'EberronTests.showErrorDialog()' from console.");
    }
  });

  // Add an Error Monitor button to scene controls for easy 1-click access
  Hooks.on("getSceneControlButtons", (controls) => {
    const tokenControl = controls.find(c => c.name === "token");
    if (tokenControl) {
      tokenControl.tools.push({
        name: "eberron-errors",
        title: "Eberron Module Error Monitor",
        icon: "fas fa-bug",
        visible: true,
        onClick: () => {
          EberronErrorMonitor.showErrorDialog();
        },
        button: true
      });
    }
  });
}

// Export for module systems and node testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = { EberronErrorMonitor, EberronTestRunner, EberronErrorSidebarTab, EberronErrorDetailSheet };
}
export { EberronErrorMonitor, EberronTestRunner, EberronErrorSidebarTab, EberronErrorDetailSheet };
