// =============================================
//  fichaje.js — Labora-e
//  Lógica del contador de fichaje del hero
// =============================================

// Estado del fichaje
let fichajeActivo   = false;
let fichajeInterval = null;
let fichajeSegundos = 0;
const META_SEGUNDOS = 8 * 3600; // Meta: 8 horas

function toggleFichaje() {
  if (!fichajeActivo) {
    iniciarFichaje();
  } else {
    pausarFichaje();
  }
}

function iniciarFichaje() {
  fichajeActivo = true;

  // Mostrar el timer, ocultar el idle
  document.getElementById('fichaje-display').style.display = 'none';
  document.getElementById('fichaje-timer').style.display   = 'block';

  // Cambiar botón a pausa
  document.getElementById('fichaje-btn-icon').textContent = '⏸';
  document.getElementById('fichaje-btn').classList.add('fichaje-btn--active');
  document.getElementById('fichaje-status').textContent = 'Trabajando';
  document.getElementById('fichaje-status').classList.add('fichaje-status--active');

  // Iniciar el intervalo cada segundo
  fichajeInterval = setInterval(() => {
    fichajeSegundos++;
    actualizarDisplay();
  }, 1000);
}

function pausarFichaje() {
  fichajeActivo = false;
  clearInterval(fichajeInterval);

  // Cambiar botón a play
  document.getElementById('fichaje-btn-icon').textContent = '▶';
  document.getElementById('fichaje-btn').classList.remove('fichaje-btn--active');
  document.getElementById('fichaje-status').textContent = 'Pausado';
  document.getElementById('fichaje-status').classList.remove('fichaje-status--active');
}

function actualizarDisplay() {
  // Calcular horas, minutos y segundos
  const h = Math.floor(fichajeSegundos / 3600);
  const m = Math.floor((fichajeSegundos % 3600) / 60);
  const s = fichajeSegundos % 60;

  // Formatear con dos dígitos siempre (01, 02...)
  const pad = n => String(n).padStart(2, '0');
  document.getElementById('fichaje-time').textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;

  // Actualizar barra de progreso
  const porcentaje = Math.min((fichajeSegundos / META_SEGUNDOS) * 100, 100);
  document.getElementById('fichaje-progress-fill').style.width = porcentaje + '%';
  document.getElementById('fichaje-percent').textContent = Math.floor(porcentaje) + '%';
}