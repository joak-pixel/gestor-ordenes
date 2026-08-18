const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  generarNumeroOrden: () => ipcRenderer.invoke('generate-numero-orden'),
  guardarOrden: (datos) => ipcRenderer.invoke('guardar-orden', datos),
  obtenerHistorial: () => ipcRenderer.invoke('obtener-historial'),
  eliminarOrden: (numeroOrden) => ipcRenderer.invoke('eliminar-orden', numeroOrden),
  generarPDF: (datos) => ipcRenderer.invoke('generate-pdf', datos),
});
