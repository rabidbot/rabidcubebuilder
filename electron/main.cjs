const { app, BrowserWindow, Menu, ipcMain, dialog, net } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

const isDev = !app.isPackaged;

let mainWindow = null;
let db = null;

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  const { default: initSqlJs } = require('sql.js');
  const dbPath = path.join(app.getPath('userData'), 'cube-builder.db');

  try {
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      const SQL = await initSqlJs();
      db = new SQL.Database(buffer);
    } else {
      const SQL = await initSqlJs();
      db = new SQL.Database();
    }
    createWindow();
    setupIPC();
  } catch (err) {
    console.error('Failed to initialize database:', err);
    const SQL = await initSqlJs();
    db = new SQL.Database();
    createWindow();
    setupIPC();
  }
});

let server = null;

function getMime(ext) {
  const types = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wasm': 'application/wasm',
  };
  return types[ext] || 'application/octet-stream';
}

function createWindow() {
  if (!isDev) {
    const distDir = path.join(app.getAppPath(), 'dist');
    server = http.createServer((req, res) => {
      const filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url.replace(/\?.*/, ''));
      try {
        const data = fs.readFileSync(filePath);
        res.writeHead(200, {
          'Content-Type': getMime(path.extname(filePath)),
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        });
        res.end(data);
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      }
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 3456;
      openWindow(port);
    });
  } else {
    openWindow(5173);
  }
}

function openWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Rabid Cube Builder',
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDesc, url) => {
    console.error(`Failed to load ${url}: ${errorCode} - ${errorDesc}`);
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadURL(`http://127.0.0.1:${port}/`);
  }

  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.control && input.shift && (input.code === 'KeyI' || input.key?.toUpperCase() === 'I')) {
      mainWindow.webContents.toggleDevTools();
    }
  });
}

app.on('window-all-closed', () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    const dbPath = path.join(app.getPath('userData'), 'cube-builder.db');
    fs.writeFileSync(dbPath, buffer);
    db.close();
  }
  if (server) {
    server.close();
  }
  app.quit();
});

function scryfallRequest(path) {
  return new Promise((resolve) => {
    const req = net.request({
      url: `https://api.scryfall.com${path}`,
      headers: {
        'User-Agent': 'RabidCubeBuilder/0.1.0',
        'Accept': 'application/json',
      },
    });
    req.on('response', (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk.toString(); });
      response.on('end', () => {
        try {
          if (response.statusCode === 200) {
            resolve({ ok: true, data: JSON.parse(body) });
          } else {
            resolve({ ok: false, error: `HTTP ${response.statusCode}`, data: JSON.parse(body) });
          }
        } catch (err) {
          resolve({ ok: false, error: err.message });
        }
      });
    });
    req.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });
    req.end();
  });
}

let scryfallQueue = [];
let scryfallTimer = null;
const SCRYFALL_DELAY = 50;

function processScryfallQueue() {
  if (scryfallQueue.length === 0) {
    scryfallTimer = null;
    return;
  }
  const { fn, resolve } = scryfallQueue.shift();
  fn().then(resolve);
  scryfallTimer = setTimeout(processScryfallQueue, SCRYFALL_DELAY);
}

function enqueueScryfall(fn) {
  return new Promise((resolve) => {
    scryfallQueue.push({ fn, resolve });
    if (!scryfallTimer) processScryfallQueue();
  });
}

function setupIPC() {
  ipcMain.handle('db:run', (_event, query, params) => {
    try {
      db.run(query, params);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('db:all', (_event, query, params) => {
    try {
      const stmt = db.prepare(query);
      if (params) stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return { ok: true, rows };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('db:exec', (_event, sql) => {
    try {
      db.exec(sql);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('db:save', () => {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      const dbPath = path.join(app.getPath('userData'), 'cube-builder.db');
      fs.writeFileSync(dbPath, buffer);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('dialog:openCsv', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import CSV',
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('dialog:saveFile', async (_event, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Cube',
      defaultPath: defaultName || 'cube.csv',
      filters: [
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (result.canceled) return null;
    return result.filePath;
  });

  ipcMain.handle('fs:readFile', async (_event, filePath) => {
    try {
      return { ok: true, content: fs.readFileSync(filePath, 'utf-8') };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('fs:writeFile', async (_event, filePath, content) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('scryfall:fetchCard', async (_event, scryfallId) => {
    return enqueueScryfall(() =>
      scryfallRequest(`/cards/${encodeURIComponent(scryfallId)}`)
    );
  });

  ipcMain.handle('scryfall:fetchBatch', async (_event, ids) => {
    const cards = [];
    for (let i = 0; i < ids.length; i += 75) {
      const batch = ids.slice(i, i + 75);
      const body = JSON.stringify({ identifiers: batch.map((id) => ({ id })) });
      const result = await enqueueScryfall(() =>
        new Promise((resolve) => {
          const req = net.request({
            method: 'POST',
            url: 'https://api.scryfall.com/cards/collection',
            headers: { 'Content-Type': 'application/json' },
          });
          req.on('response', (response) => {
            let data = '';
            response.on('data', (chunk) => { data += chunk.toString(); });
            response.on('end', () => {
              try {
                if (response.statusCode === 200) {
                  const json = JSON.parse(data);
                  if (json.data) cards.push(...json.data);
                  resolve({ ok: true });
                } else {
                  resolve({ ok: false, error: `HTTP ${response.statusCode}` });
                }
              } catch (err) {
                resolve({ ok: false, error: err.message });
              }
            });
          });
          req.on('error', (err) => resolve({ ok: false, error: err.message }));
          req.write(body);
          req.end();
        })
      );
      if (!result.ok) return { ok: false, error: result.error, cards };
    }
    return { ok: true, cards };
  });

  ipcMain.handle('scryfall:search', async (_event, query, maxPages) => {
    const allCards = [];
    let page = 1;
    const limit = maxPages || 5;

    for (let i = 0; i < limit; i++) {
      const encodedQuery = encodeURIComponent(query);
      const path = `/cards/search?q=${encodedQuery}&page=${page}`;
      console.log('[Scryfall:search]', `https://api.scryfall.com${path}`);
      const result = await enqueueScryfall(() => scryfallRequest(path));

      if (!result.ok) {
        if (result.data?.code === 'not_found') break;
        console.error('[Scryfall:search] error:', result.error, result.data?.details || '');
        return { ok: false, error: result.error, cards: allCards };
      }

      if (result.data.data) {
        allCards.push(...result.data.data);
      }

      if (!result.data.has_more) break;
      page++;
    }

    return { ok: true, cards: allCards, total: allCards.length };
  });
}
