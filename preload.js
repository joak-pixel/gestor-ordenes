const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  generarNumeroOrden: () => ipcRenderer.invoke('generate-numero-orden'),
  guardarOrden: (datos) => ipcRenderer.invoke('save-orden', datos),
  obtenerOrdenes: () => ipcRenderer.invoke('get-ordenes'),
  generarPDF: (datos) => ipcRenderer.invoke('generate-pdf', datos),
});
