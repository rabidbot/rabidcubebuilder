const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  db: {
    run: (query, params) => ipcRenderer.invoke('db:run', query, params),
    all: (query, params) => ipcRenderer.invoke('db:all', query, params),
    exec: (sql) => ipcRenderer.invoke('db:exec', sql),
    save: () => ipcRenderer.invoke('db:save'),
  },
  dialog: {
    openCsv: () => ipcRenderer.invoke('dialog:openCsv'),
    saveFile: (defaultName) => ipcRenderer.invoke('dialog:saveFile', defaultName),
  },
  fs: {
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
  },
  scryfall: {
    fetchCard: (scryfallId) => ipcRenderer.invoke('scryfall:fetchCard', scryfallId),
    fetchBatch: (ids) => ipcRenderer.invoke('scryfall:fetchBatch', ids),
    search: (query, maxPages) => ipcRenderer.invoke('scryfall:search', query, maxPages),
  },
  isElectron: true,
});
