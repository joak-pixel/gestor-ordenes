// Estado global de la orden
let ordenActual = ordenVacia();
let editandoOrden = false; // true si estamos editando una orden existente

function ordenVacia() {
  return {
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
    costo_extra: 0,
    adelanto: 0,
    garantia: false,
    garantia_fecha: '',
    observaciones: ''
  };
}

// Elementos del DOM
const form = document.getElementById('ordenForm');
const btnGenerarNumero = document.getElementById('btnGenerarNumero');
const btnGuardar = document.getElementById('btnGuardar');
const btnPDF = document.getElementById('btnPDF');
const btnNuevaOrden = document.getElementById('btnNuevaOrden');
const previewArea = document.getElementById('previewPDF');
const formTitle = document.getElementById('formTitle');
const garantiaCheckbox = document.getElementById('garantia');
const garantiaFechaGroup = document.getElementById('garantiaFechaGroup');

// Historial
const btnHistorial = document.getElementById('btnHistorial');
const btnCerrarHistorial = document.getElementById('btnCerrarHistorial');
const historialModal = document.getElementById('historialModal');
const buscarHistorial = document.getElementById('buscarHistorial');
const listaHistorial = document.getElementById('listaHistorial');
let historialCache = [];

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fecha').valueAsDate = new Date();
  ordenActual.fecha = new Date().toISOString().split('T')[0];

  generarNumeroOrden();

  // Actualizar preview en tiempo real
  form.addEventListener('input', onFormChange);
  form.addEventListener('change', onFormChange);

  // Garantía: mostrar/ocultar campo de fecha
  garantiaCheckbox.addEventListener('change', () => {
    if (garantiaCheckbox.checked) {
      garantiaFechaGroup.style.display = 'flex';
    } else {
      garantiaFechaGroup.style.display = 'none';
      document.getElementById('garantiaFecha').value = '';
      ordenActual.garantia_fecha = '';
    }
    ordenActual.garantia = garantiaCheckbox.checked;
    actualizarPreview();
  });

  btnGenerarNumero.addEventListener('click', generarNumeroOrden);
  btnGuardar.addEventListener('click', guardarOrden);
  btnPDF.addEventListener('click', generarPDF);
  btnNuevaOrden.addEventListener('click', empezarNuevaOrden);

  // Historial
  btnHistorial.addEventListener('click', abrirHistorial);
  btnCerrarHistorial.addEventListener('click', cerrarHistorial);
  historialModal.addEventListener('click', (e) => {
    if (e.target === historialModal) cerrarHistorial();
  });
  buscarHistorial.addEventListener('input', () => renderHistorial(buscarHistorial.value));

  actualizarPreview();
});

function onFormChange(e) {
  const field = e.target.name;
  if (!field) return;
  if (e.target.type === 'checkbox') {
    ordenActual[field] = e.target.checked;
  } else {
    ordenActual[field] = e.target.value;
  }
  actualizarPreview();
  actualizarTotal();
}

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

function calcularSubtotal() {
  return parseFloat(ordenActual.costo_mano_obra || 0) +
         parseFloat(ordenActual.costo_piezas || 0) +
         parseFloat(ordenActual.costo_extra || 0);
}

function calcularRestante() {
  const subtotal = calcularSubtotal();
  const adelanto = parseFloat(ordenActual.adelanto || 0);
  return subtotal - adelanto;
}

function actualizarTotal() {
  const subtotal = calcularSubtotal();
  const restante = calcularRestante();

  document.getElementById('subtotalOrden').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('restanteOrden').textContent = `$${restante.toFixed(2)}`;

  const restanteElement = document.getElementById('restanteOrden');
  if (restante > 0) {
    restanteElement.parentElement.style.background = '#f8d7da';
    restanteElement.parentElement.style.borderLeftColor = '#f5c6cb';
    restanteElement.parentElement.style.color = '#721c24';
  } else {
    restanteElement.parentElement.style.background = '#d4edda';
    restanteElement.parentElement.style.borderLeftColor = '#28a745';
    restanteElement.parentElement.style.color = '#155724';
  }
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '';
  const fecha = new Date(fechaStr + 'T00:00:00');
  return fecha.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
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

    ${(ordenActual.costo_mano_obra || ordenActual.costo_piezas || ordenActual.costo_extra || ordenActual.adelanto) ? `
      <div class="preview-section">
        <h2>Costos y Pagos</h2>
        <div class="preview-row">
          <div class="preview-label">Mano de obra:</div>
          <div class="preview-value">$${parseFloat(ordenActual.costo_mano_obra || 0).toFixed(2)}</div>
        </div>
        <div class="preview-row">
          <div class="preview-label">Piezas:</div>
          <div class="preview-value">$${parseFloat(ordenActual.costo_piezas || 0).toFixed(2)}</div>
        </div>
        ${ordenActual.costo_extra ? `
          <div class="preview-row">
            <div class="preview-label">Extra:</div>
            <div class="preview-value">$${parseFloat(ordenActual.costo_extra || 0).toFixed(2)}</div>
          </div>
        ` : ''}
        <div class="preview-total">
          SUBTOTAL: $${calcularSubtotal().toFixed(2)}
        </div>
        ${ordenActual.adelanto ? `
          <div class="preview-row">
            <div class="preview-label">Adelanto:</div>
            <div class="preview-value">$${parseFloat(ordenActual.adelanto || 0).toFixed(2)}</div>
          </div>
          <div class="preview-total">
            RESTANTE A PAGAR: $${calcularRestante().toFixed(2)}
          </div>
        ` : ''}
      </div>
    ` : ''}

    ${ordenActual.garantia ? `
      <div class="preview-section">
        <h2>Garantía</h2>
        <div class="preview-row">
          <div class="preview-label">Válida hasta:</div>
          <div class="preview-value">${ordenActual.garantia_fecha ? formatearFecha(ordenActual.garantia_fecha) : 'No especificada'}</div>
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

async function guardarOrden() {
  if (!form.checkValidity()) {
    alert('Por favor completa todos los campos requeridos');
    form.reportValidity();
    return;
  }

  try {
    const resultado = await window.api.guardarOrden(ordenActual);
    if (resultado.success) {
      alert(resultado.actualizado ? '✅ Orden actualizada exitosamente' : '✅ Orden guardada exitosamente');
      empezarNuevaOrden();
    } else {
      alert('❌ Error: ' + resultado.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error al guardar la orden');
  }
}

async function generarPDF() {
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

function empezarNuevaOrden() {
  editandoOrden = false;
  ordenActual = ordenVacia();
  form.reset();
  document.getElementById('fecha').valueAsDate = new Date();
  ordenActual.fecha = new Date().toISOString().split('T')[0];
  garantiaFechaGroup.style.display = 'none';
  formTitle.textContent = 'Nueva Orden';
  btnGuardar.textContent = '💾 Guardar Orden';
  btnGuardar.classList.remove('editando');
  generarNumeroOrden();
  actualizarPreview();
  actualizarTotal();
}

// ---------- HISTORIAL ----------

async function abrirHistorial() {
  historialCache = await window.api.obtenerHistorial();
  renderHistorial('');
  historialModal.style.display = 'flex';
  buscarHistorial.value = '';
  buscarHistorial.focus();
}

function cerrarHistorial() {
  historialModal.style.display = 'none';
}

function renderHistorial(filtro) {
  const texto = (filtro || '').toLowerCase().trim();
  const items = historialCache.filter(o => {
    if (!texto) return true;
    return (o.cliente_nombre || '').toLowerCase().includes(texto) ||
           (o.numero_orden || '').toLowerCase().includes(texto);
  });

  if (items.length === 0) {
    listaHistorial.innerHTML = `<div class="historial-vacio">No hay órdenes guardadas todavía</div>`;
    return;
  }

  listaHistorial.innerHTML = items.map(o => {
    const subtotal = parseFloat(o.costo_mano_obra || 0) + parseFloat(o.costo_piezas || 0) + parseFloat(o.costo_extra || 0);
    const restante = subtotal - parseFloat(o.adelanto || 0);
    const badgeClass = restante > 0 ? 'pendiente' : 'pagado';
    const badgeTexto = restante > 0 ? `Debe $${restante.toFixed(2)}` : 'Pagado';

    return `
      <div class="historial-item">
        <div class="historial-info">
          <div class="cliente">${o.cliente_nombre || 'Sin nombre'}</div>
          <div class="detalle">${o.numero_orden} · ${formatearFecha(o.fecha)} · ${o.dispositivo_tipo || ''} ${o.dispositivo_marca || ''}</div>
          <span class="restante-badge ${badgeClass}">${badgeTexto}</span>
        </div>
        <div class="historial-actions">
          <button class="btn-editar-historial" data-numero="${o.numero_orden}">✏️ Editar</button>
          <button class="btn-eliminar-historial" data-numero="${o.numero_orden}">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  listaHistorial.querySelectorAll('.btn-editar-historial').forEach(btn => {
    btn.addEventListener('click', () => cargarOrdenEnFormulario(btn.dataset.numero));
  });

  listaHistorial.querySelectorAll('.btn-eliminar-historial').forEach(btn => {
    btn.addEventListener('click', () => eliminarOrdenHistorial(btn.dataset.numero));
  });
}

function cargarOrdenEnFormulario(numeroOrden) {
  const orden = historialCache.find(o => o.numero_orden === numeroOrden);
  if (!orden) return;

  editandoOrden = true;
  ordenActual = { ...ordenVacia(), ...orden };

  // Rellenar todos los inputs del form
  Object.keys(ordenActual).forEach(key => {
    const input = form.querySelector(`[name="${key}"]`);
    if (!input) return;
    if (input.type === 'checkbox') {
      input.checked = !!ordenActual[key];
    } else {
      input.value = ordenActual[key] || '';
    }
  });

  garantiaFechaGroup.style.display = ordenActual.garantia ? 'flex' : 'none';

  formTitle.textContent = `Editando: ${orden.numero_orden}`;
  btnGuardar.textContent = '💾 Actualizar Orden';
  btnGuardar.classList.add('editando');

  actualizarPreview();
  actualizarTotal();
  cerrarHistorial();
}

async function eliminarOrdenHistorial(numeroOrden) {
  const confirmar = confirm('¿Eliminar esta orden del historial? Esta acción no se puede deshacer.');
  if (!confirmar) return;

  const resultado = await window.api.eliminarOrden(numeroOrden);
  if (resultado.success) {
    historialCache = await window.api.obtenerHistorial();
    renderHistorial(buscarHistorial.value);
  } else {
    alert('❌ No se pudo eliminar la orden');
  }
}
