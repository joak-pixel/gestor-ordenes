// Estado global de la orden
let ordenActual = {
  numero_orden: '',
  fecha: new Date().toISOString().split('T')[0],
  cliente_nombre: '',
  cliente_telefono: '',
  cliente_email: '',
  cliente_direccion: '',
  dispositivo_tipo: '',
  dispositivo_marca: '',
  dispositivo_modelo: '',
  problema: '',
  trabajo_realizado: '',
  componentes: '',
  costo_mano_obra: 0,
  costo_piezas: 0,
  observaciones: ''
};

// Elementos del DOM
const form = document.getElementById('ordenForm');
const btnGenerarNumero = document.getElementById('btnGenerarNumero');
const btnGuardar = document.getElementById('btnGuardar');
const btnPDF = document.getElementById('btnPDF');
const previewArea = document.getElementById('previewPDF');
const totalOrdenDisplay = document.getElementById('totalOrden');

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  // Establecer fecha actual
  document.getElementById('fecha').valueAsDate = new Date();
  ordenActual.fecha = new Date().toISOString().split('T')[0];
  
  // Generar número de orden inicial
  generarNumeroOrden();
  
  // Event listeners
  btnGenerarNumero.addEventListener('click', generarNumeroOrden);
  
  // Actualizar preview en tiempo real
  form.addEventListener('input', (e) => {
    const field = e.target.name;
    const value = e.target.value;
    ordenActual[field] = value;
    actualizarPreview();
    actualizarTotal();
  });
  
  form.addEventListener('change', (e) => {
    const field = e.target.name;
    const value = e.target.value;
    ordenActual[field] = value;
    actualizarPreview();
    actualizarTotal();
  });
  
  btnGuardar.addEventListener('click', guardarOrden);
  btnPDF.addEventListener('click', generarPDF);
  
  // Reset
  form.addEventListener('reset', () => {
    setTimeout(() => {
      ordenActual = {
        numero_orden: '',
        fecha: new Date().toISOString().split('T')[0],
        cliente_nombre: '',
        cliente_telefono: '',
        cliente_email: '',
        cliente_direccion: '',
        dispositivo_tipo: '',
        dispositivo_marca: '',
        dispositivo_modelo: '',
        problema: '',
        trabajo_realizado: '',
        componentes: '',
        costo_mano_obra: 0,
        costo_piezas: 0,
        observaciones: ''
      };
      document.getElementById('fecha').valueAsDate = new Date();
      generarNumeroOrden();
      actualizarPreview();
      actualizarTotal();
    }, 0);
  });
  
  // Mostrar preview inicial
  actualizarPreview();
});

async function generarNumeroOrden() {
  try {
    const numero = await window.api.generarNumeroOrden();
    ordenActual.numero_orden = numero;
    document.getElementById('numeroOrden').value = numero;
    actualizarPreview();
  } catch (error) {
    console.error('Error generando número de orden:', error);
  }
}

function actualizarPreview() {
  const html = `
    <div class="preview-header">
      <h1>ORDEN DE SERVICIO</h1>
      <div class="preview-row">
        <div class="preview-label">Número:</div>
        <div class="preview-value">${ordenActual.numero_orden || 'Sin asignar'}</div>
      </div>
      <div class="preview-row">
        <div class="preview-label">Fecha:</div>
        <div class="preview-value">${formatearFecha(ordenActual.fecha)}</div>
      </div>
    </div>

    <div class="preview-section">
      <h2>Datos del Cliente</h2>
      ${ordenActual.cliente_nombre ? `
        <div class="preview-row">
          <div class="preview-label">Nombre:</div>
          <div class="preview-value">${ordenActual.cliente_nombre}</div>
        </div>
      ` : ''}
      ${ordenActual.cliente_telefono ? `
        <div class="preview-row">
          <div class="preview-label">Teléfono:</div>
          <div class="preview-value">${ordenActual.cliente_telefono}</div>
        </div>
      ` : ''}
      ${ordenActual.cliente_email ? `
        <div class="preview-row">
          <div class="preview-label">Email:</div>
          <div class="preview-value">${ordenActual.cliente_email}</div>
        </div>
      ` : ''}
      ${ordenActual.cliente_direccion ? `
        <div class="preview-row">
          <div class="preview-label">Dirección:</div>
          <div class="preview-value">${ordenActual.cliente_direccion}</div>
        </div>
      ` : ''}
    </div>

    ${ordenActual.dispositivo_tipo ? `
      <div class="preview-section">
        <h2>Detalles del Dispositivo</h2>
        <div class="preview-row">
          <div class="preview-label">Tipo:</div>
          <div class="preview-value">${ordenActual.dispositivo_tipo}</div>
        </div>
        ${ordenActual.dispositivo_marca ? `
          <div class="preview-row">
            <div class="preview-label">Marca:</div>
            <div class="preview-value">${ordenActual.dispositivo_marca}</div>
          </div>
        ` : ''}
        ${ordenActual.dispositivo_modelo ? `
          <div class="preview-row">
            <div class="preview-label">Modelo:</div>
            <div class="preview-value">${ordenActual.dispositivo_modelo}</div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    ${ordenActual.problema ? `
      <div class="preview-section">
        <h2>Problema Reportado</h2>
        <div class="preview-value multi-line">${ordenActual.problema}</div>
      </div>
    ` : ''}

    ${ordenActual.trabajo_realizado ? `
      <div class="preview-section">
        <h2>Trabajo Realizado</h2>
        <div class="preview-value multi-line">${ordenActual.trabajo_realizado}</div>
      </div>
    ` : ''}

    ${ordenActual.componentes ? `
      <div class="preview-section">
        <h2>Componentes Reemplazados</h2>
        <div class="preview-value multi-line">${ordenActual.componentes}</div>
      </div>
    ` : ''}

    ${(ordenActual.costo_mano_obra || ordenActual.costo_piezas) ? `
      <div class="preview-section">
        <h2>Costos</h2>
        <div class="preview-row">
          <div class="preview-label">Mano de obra:</div>
          <div class="preview-value">$${parseFloat(ordenActual.costo_mano_obra || 0).toFixed(2)}</div>
        </div>
        <div class="preview-row">
          <div class="preview-label">Piezas:</div>
          <div class="preview-value">$${parseFloat(ordenActual.costo_piezas || 0).toFixed(2)}</div>
        </div>
        <div class="preview-total">
          TOTAL: $${calcularTotal().toFixed(2)}
        </div>
      </div>
    ` : ''}

    ${ordenActual.observaciones ? `
      <div class="preview-section">
        <h2>Observaciones</h2>
        <div class="preview-value multi-line">${ordenActual.observaciones}</div>
      </div>
    ` : ''}
  `;
  
  previewArea.innerHTML = html;
}

function calcularTotal() {
  return parseFloat(ordenActual.costo_mano_obra || 0) + parseFloat(ordenActual.costo_piezas || 0);
}

function actualizarTotal() {
  totalOrdenDisplay.textContent = `$${calcularTotal().toFixed(2)}`;
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '';
  const fecha = new Date(fechaStr + 'T00:00:00');
  return fecha.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function guardarOrden() {
  // Validar campos requeridos
  if (!form.checkValidity()) {
    alert('Por favor completa todos los campos requeridos');
    form.reportValidity();
    return;
  }

  try {
    const resultado = await window.api.guardarOrden(ordenActual);
    if (resultado.success) {
      alert('✅ Orden guardada exitosamente');
      form.reset();
    } else {
      alert('❌ Error: ' + resultado.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error al guardar la orden');
  }
}

async function generarPDF() {
  // Validar campos requeridos
  if (!form.checkValidity()) {
    alert('Por favor completa todos los campos requeridos');
    form.reportValidity();
    return;
  }

  try {
    const resultado = await window.api.generarPDF(ordenActual);
    if (resultado.success) {
      alert(`✅ PDF generado exitosamente\n${resultado.path}`);
    } else {
      alert('❌ Error al generar PDF');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error al generar PDF');
  }
}
