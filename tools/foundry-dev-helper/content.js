/**
 * Foundry VTT Dev & Test Accelerator - Content Script
 * Runs in the MAIN world context on http://localhost:* and http://127.0.0.1:*
 */
(function() {
  console.log("%c⚡ [Foundry Dev Helper] Active in page context.", "color: #00cec9; font-weight: bold;");

  const path = window.location.pathname;

  // 1. AUTO-LOGIN ON /join
  let loginAttempted = false;
  function attemptAutoLogin() {
    if (loginAttempted) return true;

    const usernameInput = document.querySelector('input#join-username') ||
                          document.querySelector('input[name="username"]') ||
                          document.querySelector('form[name="join"] input[type="text"]') ||
                          document.querySelector('#join-game-form input[name="username"]');

    const userSelect = document.querySelector('select[name="userid"]') || 
                       document.querySelector('select[name="user"]') || 
                       document.querySelector('form#join-form select') ||
                       document.querySelector('form.standard-form select');

    const joinBtn = document.querySelector('button[name="join"]') || 
                    document.querySelector('button[data-action="join"]') ||
                    document.querySelector('#join-form button[type="submit"]') || 
                    document.querySelector('form[name="join"] button[type="submit"]') ||
                    document.querySelector('#join-game-form button[type="submit"]') ||
                    document.querySelector('#join-form button.bright') ||
                    document.querySelector('form button[type="submit"]');

    // Case A: Foundry v13/v14 uses an <input type="text"> for username
    if (usernameInput) {
      let gmName = "Gamemaster";
      if (typeof game !== "undefined" && game.users) {
        const gmUser = game.users.find(u => {
          if (u.role === 4 || u.isGM) return true;
          if (typeof u.hasRole === "function" && u.hasRole(4)) return true;
          const n = (u.name || "").toLowerCase();
          return n.includes("gamemaster") || n.includes("gm");
        });
        if (gmUser?.name) gmName = gmUser.name;
      }

      loginAttempted = true;
      console.log(`%c⚡ [Foundry Dev Helper] Setting username "${gmName}" and submitting join form...`, "color: #00cec9; font-weight: bold;");

      usernameInput.value = gmName;
      usernameInput.dispatchEvent(new Event("input", { bubbles: true }));
      usernameInput.dispatchEvent(new Event("change", { bubbles: true }));

      const submitAction = () => {
        if (joinBtn) {
          joinBtn.click();
        } else {
          const form = usernameInput.closest("form");
          if (form?.requestSubmit) form.requestSubmit();
          else form?.submit();
        }
      };

      setTimeout(submitAction, 100);
      // Secondary safety trigger if form was still initializing listeners
      setTimeout(() => {
        if (window.location.pathname.includes("/join")) {
          submitAction();
        }
      }, 600);
      return true;
    }

    // Case B: Foundry v10-v12 uses a <select> dropdown
    if (userSelect) {
      const validOptions = Array.from(userSelect.options || []).filter(o => o.value && o.value.trim() !== "");
      if (validOptions.length === 0) return false;

      const gmOption = validOptions.find(o => {
        const txt = (o.text || "").toLowerCase();
        return txt.includes("gamemaster") || txt.includes("gm");
      }) || validOptions[0];

      if (gmOption) {
        loginAttempted = true;
        if (userSelect.value !== gmOption.value) {
          userSelect.value = gmOption.value;
          userSelect.dispatchEvent(new Event("input", { bubbles: true }));
          userSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }

        console.log(`%c⚡ [Foundry Dev Helper] Auto-selecting Gamemaster (${gmOption.text}) and joining...`, "color: #00cec9; font-weight: bold;");
        const submitAction = () => {
          if (joinBtn) {
            joinBtn.click();
          } else {
            const form = userSelect.closest("form");
            if (form?.requestSubmit) form.requestSubmit();
            else form?.submit();
          }
        };

        setTimeout(submitAction, 100);
        setTimeout(() => {
          if (window.location.pathname.includes("/join")) {
            submitAction();
          }
        }, 600);
        return true;
      }
    }

    return false;
  }

  // 2. AUTO-LAUNCH WORLD ON /setup (if setup screen ever shown)
  let launchAttempted = false;
  function attemptAutoLaunchWorld() {
    if (launchAttempted) return true;
    const worldCard = document.querySelector('[data-package-id="pf2e-test"]');
    if (worldCard) {
      const launchBtn = worldCard.querySelector('button[data-action="launch"]') || worldCard.querySelector('.launch');
      if (launchBtn) {
        launchAttempted = true;
        console.log("%c⚡ [Foundry Dev Helper] Auto-launching pf2e-test world from setup...", "color: #00cec9; font-weight: bold;");
        launchBtn.click();
        return true;
      }
    }
    return false;
  }

  // Observe DOM for join or setup form arrival
  if (path.includes("/join") || path.endsWith("/join") || path === "/" || path.includes("/setup")) {
    if (!attemptAutoLogin() && !attemptAutoLaunchWorld()) {
      let attempts = 0;
      const pollInterval = setInterval(() => {
        attempts++;
        if (attemptAutoLogin() || attemptAutoLaunchWorld() || attempts > 50) {
          clearInterval(pollInterval);
        }
      }, 200);

      const observer = new MutationObserver(() => {
        if (attemptAutoLogin() || attemptAutoLaunchWorld()) {
          observer.disconnect();
          clearInterval(pollInterval);
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        clearInterval(pollInterval);
      }, 15000);
    }
  }

  // 3. AUTO-NUE, TOUR SUPPRESSION & AUTO-UNPAUSE ON /game
  try {
    localStorage.setItem("core.nue.shownTips", "true");
    const progress = JSON.parse(localStorage.getItem("core.tourProgress") || "{}");
    progress.core = progress.core || {};
    for (const t of ["welcome", "ui-overview", "canvas-controls", "sidebar", "backups-overview", "compatibility-preview-overview", "creating-a-world", "installing-a-system"]) {
      progress.core[t] = 999;
    }
    localStorage.setItem("core.tourProgress", JSON.stringify(progress));
  } catch (_) {}

  // Auto-unpause state
  let autoUnpauseDone = false;

  function attemptAutoUnpause(reason = "ready") {
    if (autoUnpauseDone) return true;
    if (typeof game === "undefined" || !game.ready) return false;

    // Only Gamemaster has permission to unpause
    if (!game.user?.isGM) {
      autoUnpauseDone = true;
      return false;
    }

    if (!game.paused) {
      console.log(`%c⚡ [Foundry Dev Helper] Game is already unpaused (${reason}).`, "color: #00cec9;");
      autoUnpauseDone = true;
      return true;
    }

    try {
      console.log(`%c⚡ [Foundry Dev Helper] Game is paused. Automatically unpausing as GM after UI load (${reason})...`, "color: #00cec9; font-weight: bold;");
      if (typeof game.togglePause === "function") {
        game.togglePause(false, { broadcast: true });
      }
      autoUnpauseDone = true;
      console.log("%c⚡ [Foundry Dev Helper] Game successfully unpaused!", "color: #2ecc71; font-weight: bold;");
      return true;
    } catch (err) {
      console.warn(`[Foundry Dev Helper] Could not auto-unpause game (${reason}):`, err);
      return false;
    }
  }

  function onGameReady() {
    try {
      if (typeof game !== "undefined") {
        if (game.settings) {
          game.settings.set("core", "nue.shownTips", true).catch(() => {});
          const currentProgress = game.settings.get("core", "tourProgress") || {};
          currentProgress.core = currentProgress.core || {};
          for (const tid of ["welcome", "ui-overview", "canvas-controls", "sidebar", "backups-overview", "compatibility-preview-overview", "creating-a-world", "installing-a-system"]) {
            currentProgress.core[tid] = 999;
          }
          game.settings.set("core", "tourProgress", currentProgress).catch(() => {});
        }
        if (game.tours) {
          for (const tour of game.tours) {
            try { tour.complete(); } catch (_) {}
          }
        }
        console.log("%c⚡ [Foundry Dev Helper] First-time tours and tips suppressed.", "color: #00cec9;");

        // Automatically unpause the game once UI and world are ready
        attemptAutoUnpause("game-ready");
        setTimeout(() => attemptAutoUnpause("post-ready-500ms"), 500);
        setTimeout(() => attemptAutoUnpause("post-ready-1500ms"), 1500);
      }
    } catch (_) {}
  }

  // Hook into Foundry Game lifecycle
  if (typeof Hooks !== "undefined" && Hooks.once) {
    Hooks.once("ready", onGameReady);
    Hooks.once("canvasReady", () => attemptAutoUnpause("canvas-ready"));
  } else {
    window.addEventListener("DOMContentLoaded", () => {
      if (typeof Hooks !== "undefined" && Hooks.once) {
        Hooks.once("ready", onGameReady);
        Hooks.once("canvasReady", () => attemptAutoUnpause("canvas-ready"));
      }
    });
  }

  // Fallback poller for active game tab
  if (path.includes("/game") || path.endsWith("/game") || path === "/") {
    const pauseCheckInterval = setInterval(() => {
      if (autoUnpauseDone) {
        clearInterval(pauseCheckInterval);
        return;
      }
      if (typeof game !== "undefined" && game.ready && game.user?.isGM) {
        if (attemptAutoUnpause("interval-poll")) {
          clearInterval(pauseCheckInterval);
        }
      }
    }, 400);

    setTimeout(() => clearInterval(pauseCheckInterval), 20000);
  }

  // 4. EXPOSE GLOBAL AUTOMATION API
  window.__FOUNDRY_DEV_HELPER__ = {
    version: "1.1.0",
    runTests: async () => {
      if (window.EberronTests?.runAll) {
        return await window.EberronTests.runAll();
      }
      console.warn("[Foundry Dev Helper] EberronTests not found.");
      return null;
    },
    getErrors: () => {
      return window.EberronErrorMonitor?.errors || [];
    },
    copyAllErrors: () => {
      if (window.EberronErrorMonitor) {
        const md = window.EberronErrorMonitor.formatAllErrorsMarkdown();
        window.EberronErrorMonitor.copyToClipboard(md);
        return md;
      }
      return "";
    },
    clearErrors: () => {
      window.EberronErrorMonitor?.clearErrors();
    },
    openErrorTab: () => {
      if (typeof ui !== "undefined") {
        if (ui.eberronErrors && typeof ui.eberronErrors.activate === "function") {
          ui.eberronErrors.activate();
        } else if (ui.sidebar) {
          ui.sidebar.changeTab?.("eberronErrors", "primary");
          if (!ui.sidebar.expanded) ui.sidebar.expand?.();
        }
      } else {
        window.EberronErrorMonitor?.showErrorDialog();
      }
    },
    unpauseGame: (force = true) => {
      if (force) autoUnpauseDone = false;
      return attemptAutoUnpause("api-call");
    },
    pauseGame: () => {
      if (typeof game !== "undefined" && game.user?.isGM && typeof game.togglePause === "function") {
        game.togglePause(true, { broadcast: true });
        return true;
      }
      return false;
    },
    isPaused: () => {
      return typeof game !== "undefined" ? Boolean(game.paused) : false;
    }
  };
})();
