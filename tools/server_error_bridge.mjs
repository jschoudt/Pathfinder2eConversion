import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Filter to determine whether a server log message/stack should be monitored.
 * We capture:
 * 1. Any message/stack matching Eberron keywords or compendium paths
 * 2. Any explicit [error] or uncaught exceptions/crashes
 * 3. Any compatibility/schema/database warnings that affect packs or documents
 */
export function isRelevantServerLog(text = '') {
  // Ignore normal [info] server logs (e.g. database connected, world loading, etc.)
  if (/\[info\]/i.test(text) && !/\[(?:error|warn)\]|uncaughtexception|unhandledrejection|TypeError|ReferenceError|RangeError|EADDRINUSE/i.test(text)) {
    return false;
  }
  const errorPattern = /\[error\]|uncaughtexception|unhandledrejection|TypeError|ReferenceError|RangeError|LevelDB.*(?:error|fail)|Database.*(?:error|fail)|EADDRINUSE/i;
  const warningPattern = /\[warn\].*(?:compatibility|deletion key|deprecated|schema|validation|migrated|forced deletion|error)/i;
  const eberronPattern = /pathfinders-guide-to-eberron|eberron/i;

  return errorPattern.test(text) || warningPattern.test(text) || (eberronPattern.test(text) && /\[(?:warn|error)\]/i.test(text));
}

/**
 * Parses a block of log lines into a structured server error object
 */
export function parseServerLogBlock(lines = []) {
  if (!lines || lines.length === 0) return null;
  const joined = lines.join('\n').trim();
  if (!joined) return null;

  let level = 'error';
  if (/\[warn\]/i.test(joined) && !/\[error\]/i.test(joined)) {
    level = 'warn';
  }

  // Find the primary message line
  // Prefer line with [warn]/[error] or Error:
  let primaryMessage = lines[0];
  for (const line of lines) {
    if (/\[(?:warn|error)\]/i.test(line)) {
      primaryMessage = line.replace(/^FoundryVTT\s*\|\s*[\d\s:-]+\|\s*/i, '').trim();
      break;
    } else if (/^(?:Error|TypeError|ReferenceError|RangeError):/i.test(line)) {
      primaryMessage = line.trim();
      break;
    }
  }

  // Extract stack trace: lines starting with 'at ' or indented lines after an Error:
  const stackLines = lines.filter(l => /^\s*at\s+/.test(l) || /^\s+at\s+/.test(l));
  const stack = stackLines.length > 0 
    ? stackLines.join('\n') 
    : (joined.length > primaryMessage.length ? joined : 'No server stack trace provided');

  return {
    id: 'srv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    message: primaryMessage.replace(/^\[(?:warn|error)\]\s*/i, '').trim(),
    stack: stack.trim(),
    level,
    source: 'Foundry Server',
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a stream collector that buffers chunks from stdout/stderr,
 * groups them into discrete multiline blocks, deduplicates them, and invokes a callback.
 */
export function createLogCollector({ onLog, minBufferMs = 40 } = {}) {
  let lineBuffer = [];
  let flushTimer = null;

  function flush() {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (lineBuffer.length === 0) return;

    const currentLines = [...lineBuffer];
    lineBuffer = [];

    const fullText = currentLines.join('\n');
    if (isRelevantServerLog(fullText)) {
      const parsed = parseServerLogBlock(currentLines);
      if (parsed && onLog) {
        onLog(parsed);
      }
    }
  }

  function feed(chunk) {
    const text = chunk.toString();
    const lines = text.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // A new header line typically starts with FoundryVTT or non-whitespace Error
      const isNewHeader = /^FoundryVTT\s*\|\s*[\d\s:-]+\|\s*\[(?:warn|error)\]/i.test(line) ||
                          /^(?:Error|TypeError|ReferenceError|RangeError):/i.test(line);

      if (isNewHeader && lineBuffer.length > 0) {
        flush();
      }

      if (line.trim().length > 0) {
        lineBuffer.push(line);
      }
    }

    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, minBufferMs);
  }

  return { feed, flush };
}

/**
 * Starts the HTTP and Server-Sent Events bridge server
 */
export function startServerErrorBridge({
  port = 30005,
  persistPath = null,
  onClientConnected = null
} = {}) {
  const errors = [];
  const sseClients = new Set();

  function saveToDisk() {
    if (!persistPath) return;
    try {
      const dir = path.dirname(persistPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(persistPath, JSON.stringify(errors, null, 2));
    } catch (e) {}
  }

  function recordError(error) {
    // Generate signature for deduplication: message + first 2 lines of stack
    const stackHead = (error.stack || '').split('\n').slice(0, 2).map(l => l.trim()).join('|');
    const signature = `${error.message}::${stackHead}`;

    const existing = errors.find(e => e.signature === signature);
    if (existing) {
      existing.count = (existing.count || 1) + 1;
      existing.lastSeen = new Date().toISOString();
    } else {
      error.signature = signature;
      error.count = 1;
      error.firstSeen = new Date().toISOString();
      error.lastSeen = error.firstSeen;
      errors.push(error);
    }

    saveToDisk();

    // Broadcast to SSE clients
    const payload = `data: ${JSON.stringify({ type: 'server-error', error: existing || error })}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(payload);
      } catch (e) {
        sseClients.delete(client);
      }
    }
  }

  function clearErrors() {
    errors.length = 0;
    saveToDisk();
    const payload = `data: ${JSON.stringify({ type: 'clear' })}\n\n`;
    for (const client of sseClients) {
      try { client.write(payload); } catch (e) {}
    }
  }

  const server = http.createServer((req, res) => {
    // Enable CORS for browser client access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/api/server-errors' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(errors));
      return;
    }

    if (url.pathname === '/api/server-errors/clear' && req.method === 'POST') {
      clearErrors();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (url.pathname === '/api/client-errors' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const clientData = JSON.parse(body);
          const clientErrorsPath = path.resolve('tests/companion-module/client-errors.json');
          fs.writeFileSync(clientErrorsPath, JSON.stringify(clientData, null, 2));

          const reportPath = path.resolve('tests/companion-module/error-report.md');
          let md = `# 🚨 Eberron Client & Server Error Report\n\n`;
          const errorList = Array.isArray(clientData) ? clientData : (clientData.errors || []);
          md += `Total Errors: ${errorList.length}\n\n`;
          errorList.forEach((err, idx) => {
            md += `## Error ${idx + 1}/${errorList.length}: ${err.message || 'Unknown'}\n`;
            md += `- **Type**: \`${err.type || 'error'}\`\n`;
            md += `- **Source**: \`${err.source || 'unknown'}\`\n`;
            md += `- **Occurrences**: ${err.count || 1}\n\n`;
            md += `\`\`\`\n${err.stack || 'No stack'}\n\`\`\`\n\n`;
          });
          fs.writeFileSync(reportPath, md);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, count: errorList.length }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    if (url.pathname === '/api/client-errors' && req.method === 'GET') {
      const clientErrorsPath = path.resolve('tests/companion-module/client-errors.json');
      if (fs.existsSync(clientErrorsPath)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(fs.readFileSync(clientErrorsPath, 'utf-8'));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([]));
      }
      return;
    }

    if (url.pathname === '/api/server-events' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      res.write(': heartbeat\n\n');

      sseClients.add(res);
      if (onClientConnected) onClientConnected(sseClients.size);

      req.on('close', () => {
        sseClients.delete(res);
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, () => {
      const actualPort = server.address().port;
      resolve({
        server,
        port: actualPort,
        recordError,
        clearErrors,
        getErrors: () => [...errors],
        close: () => new Promise(res => server.close(res))
      });
    });
  });
}
