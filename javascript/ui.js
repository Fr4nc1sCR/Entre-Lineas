// ui.js
// Utilidades de interfaz compartidas por todas las páginas.

const PORTADA_GENERICA = '/img/portada-generica.svg';

// Alertas con el estilo de la página
const Alerta = Swal.mixin({
  buttonsStyling: false,
  confirmButtonText: 'Aceptar',
  cancelButtonText: 'Cancelar',
  customClass: {
    popup: 'swal-custom',
    actions: 'swal-actions',
    confirmButton: 'btn btn-primary',
    cancelButton: 'btn btn-ghost'
  }
});

// Notificaciones pequeñas que se cierran solas
const Toast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
  customClass: { popup: 'swal-toast' }
});

// Evita que datos de la base de datos se interpreten como HTML
function escapeHTML(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

const formatoColones = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0
});

function formatearColones(monto) {
  return formatoColones.format(Number(monto) || 0);
}

// Muestra un spinner en el botón mientras se espera una respuesta
function setCargando(boton, cargando) {
  boton.disabled = cargando;
  boton.setAttribute('aria-busy', String(cargando));
}

// Iniciales para el avatar: "Julián Quesada" -> "JQ"
function obtenerIniciales(nombre) {
  const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '·';
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('theme-toggle')?.addEventListener('click', alternarTema);
});
