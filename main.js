const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
function formatearMoneda(numero) {
  const num = parseFloat(numero || 0);
  const tieneDecimales = num % 1 !== 0;
  return '$' + num.toLocaleString('es-AR', {
    minimumFractionDigits: tieneDecimales ? 2 : 0,
    maximumFractionDigits: 2
  });
}

let mainWindow;

function getHistorialPath() {
  return path.join(app.getPath('userData'), 'historial.json');
}

function leerHistorial() {
  try {
    const filePath = getHistorialPath();
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error leyendo historial:', error);
    return [];
  }
}

function escribirHistorial(historial) {
  fs.writeFileSync(getHistorialPath(), JSON.stringify(historial, null, 2), 'utf-8');
}

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
    },
    {
      label: 'Ver',
      submenu: [
        { label: 'Herramientas de Desarrollador', accelerator: 'CmdOrCtrl+Shift+I', role: 'toggleDevTools' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ---------- IPC Handlers ----------

ipcMain.handle('generate-numero-orden', () => {
  const fecha = new Date();
  return `ORD-${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;
});

// Guarda una orden nueva, o actualiza si ya existe (mismo numero_orden)
ipcMain.handle('guardar-orden', (event, datos) => {
  try {
    const historial = leerHistorial();
    const index = historial.findIndex(o => o.numero_orden === datos.numero_orden);

    const ordenGuardada = {
      ...datos,
      actualizado_en: new Date().toISOString()
    };

    if (index >= 0) {
      // Actualizar orden existente, conservar la fecha de creación original
      ordenGuardada.creado_en = historial[index].creado_en || ordenGuardada.actualizado_en;
      historial[index] = ordenGuardada;
    } else {
      ordenGuardada.creado_en = ordenGuardada.actualizado_en;
      historial.unshift(ordenGuardada);
    }

    escribirHistorial(historial);
    return { success: true, actualizado: index >= 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('obtener-historial', () => {
  return leerHistorial();
});

ipcMain.handle('eliminar-orden', (event, numeroOrden) => {
  try {
    const historial = leerHistorial().filter(o => o.numero_orden !== numeroOrden);
    escribirHistorial(historial);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('generate-pdf', async (event, datos) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  const fileName = `Orden_${datos.numero_orden}.pdf`;
  const filePath = path.join(app.getPath('downloads'), fileName);

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

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
  if (datos.dispositivo_tipo === 'Computadora') {
    if (datos.dispositivo_procesador) doc.text(`Procesador: ${datos.dispositivo_procesador}`);
    if (datos.dispositivo_placa_madre) doc.text(`Placa Madre: ${datos.dispositivo_placa_madre}`);
    if (datos.dispositivo_ram) doc.text(`Memoria RAM: ${datos.dispositivo_ram}`);
    if (datos.dispositivo_almacenamiento) doc.text(`Almacenamiento: ${datos.dispositivo_almacenamiento}`);
    if (datos.dispositivo_so) doc.text(`Sistema Operativo: ${datos.dispositivo_so}`);
  } else {
    if (datos.dispositivo_marca) doc.text(`Marca: ${datos.dispositivo_marca}`);
    if (datos.dispositivo_modelo) doc.text(`Modelo: ${datos.dispositivo_modelo}`);
  }

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
  doc.fontSize(12).font('Helvetica-Bold').text('COSTOS Y PAGOS');
  doc.fontSize(10).font('Helvetica');
 doc.text(`Mano de obra: ${formatearMoneda(datos.costo_mano_obra)}`);
doc.text(`Piezas: ${formatearMoneda(datos.costo_piezas)}`);
  if (datos.costo_extra) {
  doc.text(`Extra: ${formatearMoneda(datos.costo_extra)}`);
}

 const subtotal = parseFloat(datos.costo_mano_obra || 0) + parseFloat(datos.costo_piezas || 0) + parseFloat(datos.costo_extra || 0);
doc.fontSize(11).font('Helvetica-Bold').text(`SUBTOTAL: ${formatearMoneda(subtotal)}`);

 if (datos.adelanto) {
  doc.fontSize(10).font('Helvetica');
  doc.text(`Adelanto recibido: ${formatearMoneda(datos.adelanto)}`);
}

if (datos.pagado) {
  doc.fontSize(11).font('Helvetica-Bold').text(`PAGADO EN SU TOTALIDAD${datos.fecha_pago ? ' - Fecha: ' + datos.fecha_pago : ''}`);
} else {
  const restante = subtotal - parseFloat(datos.adelanto || 0);
  doc.fontSize(11).font('Helvetica-Bold').text(`RESTANTE A PAGAR: ${formatearMoneda(restante)}`);
}

  if (datos.garantia) {
    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold').text('GARANTÍA');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Válida hasta: ${datos.garantia_fecha || 'No especificada'}`);
  }

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
