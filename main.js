const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    }
  });

  mainWindow.loadFile('index.html');
  
  // Menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        { label: 'Salir', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Deshacer', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Rehacer', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Cortar', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copiar', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Pegar', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('generate-numero-orden', () => {
  const fecha = new Date();
  return `ORD-${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;
});

ipcMain.handle('generate-pdf', async (event, datos) => {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  
  // Nombre del archivo
  const fileName = `Orden_${datos.numero_orden}.pdf`;
  const filePath = path.join(app.getPath('downloads'), fileName);
  
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  
  // Estilos
  doc.fontSize(20).font('Helvetica-Bold').text('ORDEN DE SERVICIO', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').text(`Número: ${datos.numero_orden}`, { align: 'center' });
  doc.text(`Fecha: ${datos.fecha}`, { align: 'center' });
  
  doc.moveDown(1);
  doc.fontSize(12).font('Helvetica-Bold').text('DATOS DEL CLIENTE');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Nombre: ${datos.cliente_nombre}`);
  doc.text(`Teléfono: ${datos.cliente_telefono}`);
  doc.text(`Email: ${datos.cliente_email}`);
  doc.text(`Dirección: ${datos.cliente_direccion}`);
  
  doc.moveDown(1);
  doc.fontSize(12).font('Helvetica-Bold').text('DETALLES DEL DISPOSITIVO');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Tipo: ${datos.dispositivo_tipo}`);
  doc.text(`Marca: ${datos.dispositivo_marca}`);
  doc.text(`Modelo: ${datos.dispositivo_modelo}`);
  
  doc.moveDown(1);
  doc.fontSize(12).font('Helvetica-Bold').text('PROBLEMA REPORTADO');
  doc.fontSize(10).font('Helvetica');
  doc.text(datos.problema, { width: 500 });
  
  doc.moveDown(1);
  doc.fontSize(12).font('Helvetica-Bold').text('TRABAJO REALIZADO');
  doc.fontSize(10).font('Helvetica');
  doc.text(datos.trabajo_realizado, { width: 500 });
  
  if (datos.componentes) {
    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold').text('COMPONENTES REEMPLAZADOS');
    doc.fontSize(10).font('Helvetica');
    doc.text(datos.componentes, { width: 500 });
  }
  
  doc.moveDown(1);
  doc.fontSize(12).font('Helvetica-Bold').text('COSTOS');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Mano de obra: $${parseFloat(datos.costo_mano_obra || 0).toFixed(2)}`);
  doc.text(`Piezas: $${parseFloat(datos.costo_piezas || 0).toFixed(2)}`);
  
  const total = (parseFloat(datos.costo_mano_obra || 0) + parseFloat(datos.costo_piezas || 0)).toFixed(2);
  doc.fontSize(11).font('Helvetica-Bold').text(`TOTAL: $${total}`);
  
  if (datos.observaciones) {
    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold').text('OBSERVACIONES');
    doc.fontSize(10).font('Helvetica');
    doc.text(datos.observaciones, { width: 500 });
  }
  
  doc.end();
  
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve({ success: true, path: filePath }));
    stream.on('error', reject);
  });
});

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});