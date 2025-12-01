const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  selectFile: () => ipcRenderer.invoke("select-file"),
  selectDestination: () => ipcRenderer.invoke("select-destination"),
  exportTranslation: (inputFile, outputDir) =>
    ipcRenderer.invoke("export-translation", inputFile, outputDir),
});
