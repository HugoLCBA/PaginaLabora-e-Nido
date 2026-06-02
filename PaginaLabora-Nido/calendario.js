// =============================================
//  calendario.js — Labora-e
//  Gestiona dos contextos:
//  1. Mini-mockup del hero (index.html)
//  2. Página de calendario completa (calendario.html)
// =============================================

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// ── MINI MOCKUP (index.html) ─────────────────────────────────
// Se activa solo si existe #cal-grid en el DOM

const EVENTOS_MOCKUP = { '2026-5-14': true, '2026-5-26': true };

let mockupYear  = 2026;
let mockupMonth = 4;
let mockupSelectedDay = null;

function renderMockup() {
  const grid  = document.getElementById('cal-grid');
  const label = document.getElementById('cal-month-label');
  if (!grid || !label) return;

  label.textContent = MESES[mockupMonth] + ' ' + mockupYear;
  grid.innerHTML = '';

  ['L','M','X','J','V','S','D'].forEach(h => {
    const el = document.createElement('div');
    el.className = 'cal-day cal-day--header';
    el.textContent = h;
    grid.appendChild(el);
  });

  const firstDay    = new Date(mockupYear, mockupMonth, 1).getDay();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(mockupYear, mockupMonth + 1, 0).getDate();
  const today       = new Date();

  for (let i = 0; i < offset; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day cal-day--empty';
    grid.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const el  = document.createElement('button');
    const key = `${mockupYear}-${mockupMonth + 1}-${d}`;

    const isToday    = d === today.getDate() && mockupMonth === today.getMonth() && mockupYear === today.getFullYear();
    const isSelected = mockupSelectedDay && mockupSelectedDay.d === d && mockupSelectedDay.m === mockupMonth && mockupSelectedDay.y === mockupYear;
    const hasEvent   = !!EVENTOS_MOCKUP[key];

    let cls = 'cal-day';
    if (isToday)    cls += ' cal-day--today';
    if (isSelected) cls += ' cal-day--selected';
    if (hasEvent)   cls += ' cal-day--event';

    el.className = cls;
    el.textContent = d;

    if (hasEvent) {
      const dot = document.createElement('span');
      dot.className = 'event-dot' + (key === '2026-5-26' ? ' event-dot--green' : '');
      el.appendChild(dot);
    }

    el.addEventListener('click', () => {
      mockupSelectedDay = { d, m: mockupMonth, y: mockupYear };
      renderMockup();
    });

    grid.appendChild(el);
  }

  const totalCells = offset + daysInMonth;
  const remainder  = 42 - totalCells;
  for (let i = 0; i < remainder; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day cal-day--empty';
    grid.appendChild(el);
  }
}

function mockupPrevMonth() {
  mockupMonth--;
  if (mockupMonth < 0) { mockupMonth = 11; mockupYear--; }
  mockupSelectedDay = null;
  renderMockup();
}

function mockupNextMonth() {
  mockupMonth++;
  if (mockupMonth > 11) { mockupMonth = 0; mockupYear++; }
  mockupSelectedDay = null;
  renderMockup();
}

// ── CALENDARIO COMPLETO (calendario.html) ────────────────────

const MIN_YEAR  = 2026, MIN_MONTH = 4;
const MAX_YEAR  = 2028, MAX_MONTH = 11;

let calYear     = MIN_YEAR;
let calMonth    = MIN_MONTH;
let calSelected = null;
let eventsData  = {};
let eventModalInstance = null;

// ── UTILIDADES DE FECHA ──────────────────────────────────────

function dateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

function todayStr() {
  const t = new Date();
  return dateStr(t.getFullYear(), t.getMonth(), t.getDate());
}

function isPast(year, month, day) {
  const cellDate  = new Date(year, month, day);
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  return cellDate < todayDate;
}

function isToday(year, month, day) {
  const t = new Date();
  return day === t.getDate() && month === t.getMonth() && year === t.getFullYear();
}

// ── STORAGE ──────────────────────────────────────────────────

function persistEvents() {
  localStorage.setItem('laborae_events', JSON.stringify(eventsData));
}

function escapeHTML(str) {
  return String(str).replace(/[&<>'"]/g, tag =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])
  );
}

// ── CONSTRUCCIÓN DEL GRID (42 celdas fijas) ──────────────────

function buildCalendarDays(year, month) {
  const days        = [];
  const firstDay    = new Date(year, month, 1).getDay();
  const offset      = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonth   = month === 0 ? 11 : month - 1;
  const prevYear    = month === 0 ? year - 1 : year;
  const daysInPrev  = new Date(prevYear, prevMonth + 1, 0).getDate();
  const nextMonth   = month === 11 ? 0 : month + 1;
  const nextYear    = month === 11 ? year + 1 : year;

  for (let i = offset - 1; i >= 0; i--)
    days.push({ day: daysInPrev - i, month: prevMonth, year: prevYear, type: 'other' });

  for (let d = 1; d <= daysInMonth; d++)
    days.push({ day: d, month, year, type: 'current' });

  while (days.length < 42)
    days.push({ day: days.length - offset - daysInMonth + 1, month: nextMonth, year: nextYear, type: 'other' });

  return days;
}

// ── RENDER: GRID DEL CALENDARIO ──────────────────────────────

function renderCalFull() {
  const grid    = document.getElementById('cal-grid-full');
  const title   = document.getElementById('cal-month-title');
  const btnPrev = document.getElementById('btn-prev-month');
  const btnNext = document.getElementById('btn-next-month');
  if (!grid || !title) return;

  title.textContent = `${MESES[calMonth]} ${calYear}`;

  const isMin = calYear === MIN_YEAR && calMonth === MIN_MONTH;
  const isMax = calYear === MAX_YEAR && calMonth === MAX_MONTH;
  btnPrev.disabled      = isMin;
  btnPrev.style.opacity = isMin ? '0.3' : '1';
  btnNext.disabled      = isMax;
  btnNext.style.opacity = isMax ? '0.3' : '1';

  const today = todayStr();
  const cells = buildCalendarDays(calYear, calMonth);

  // Create cells on first render, reuse after
  if (grid.children.length !== 42) {
    grid.innerHTML = '';
    for (let i = 0; i < 42; i++) {
      const el = document.createElement('div');
      el.className = 'cal-day-box';
      grid.appendChild(el);
    }
  }

  const boxes = grid.querySelectorAll('.cal-day-box');

  cells.forEach((cell, i) => {
    const el  = boxes[i];
    const ds  = dateStr(cell.year, cell.month, cell.day);
    const evs = eventsData[ds] || [];
    const past = cell.type === 'current' && isPast(cell.year, cell.month, cell.day);

    let cls = 'cal-day-box';
    if (cell.type === 'other') cls += ' cal-day-other-month';
    if (ds === today)          cls += ' today';
    if (ds === calSelected)    cls += ' selected';
    if (past)                  cls += ' cal-day-past';
    el.className = cls;

    el.innerHTML = '';

    const numEl = document.createElement('div');
    numEl.className = 'cal-day-number';
    numEl.textContent = cell.day;
    el.appendChild(numEl);

    if (evs.length > 0) {
      const evWrap = document.createElement('div');
      evWrap.className = 'cal-day-events';
      evs.slice(0, 3).forEach(ev => {
        const pill = document.createElement('div');
        pill.className = `mini-event bg-${ev.color}`;
        pill.textContent = (ev.time ? ev.time + ' ' : '') + ev.title;
        evWrap.appendChild(pill);
      });
      if (evs.length > 3) {
        const more = document.createElement('div');
        more.className = 'mini-event-more';
        more.textContent = `+${evs.length - 3} más`;
        evWrap.appendChild(more);
      }
      el.appendChild(evWrap);
    }

    if (cell.type === 'current' && !past) {
      el.style.cursor = 'pointer';
      el.title = '';
      el.onclick = () => { calSelected = ds; renderCalFull(); renderDayPanel(); };
    } else if (cell.type === 'current' && past && evs.length > 0) {
      // Past day with events: allow view but not create
      el.style.cursor = 'pointer';
      el.title = 'Día pasado — solo lectura';
      el.onclick = () => { calSelected = ds; renderCalFull(); renderDayPanel(); };
    } else {
      el.style.cursor = 'default';
      el.onclick = null;
    }
  });

  renderMonthPanel();
  renderTodaySection();
}

// ── RENDER: PANEL DE HOY ─────────────────────────────────────

function renderTodaySection() {
  const section = document.getElementById('today-section');
  if (!section) return;

  const ts      = todayStr();
  const todayEv = eventsData[ts] || [];
  const t       = new Date();
  const label   = `${t.getDate()} de ${MESES[t.getMonth()]}`;

  let html = `<div class="today-header"><span class="today-dot"></span><span>Hoy · ${label}</span></div>`;

  if (todayEv.length === 0) {
    html += `<p class="today-empty">Sin eventos hoy</p>`;
  } else {
    const sorted = todayEv.slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    sorted.forEach(ev => {
      html += `
        <div class="today-event" style="border-left-color:var(--color-${ev.color}, var(--teal))">
          <span class="today-event-time">${ev.time || '—'}</span>
          <span class="today-event-name">${escapeHTML(ev.title)}</span>
        </div>`;
    });
  }

  section.innerHTML = html;
}

// ── RENDER: PANEL DE EVENTOS DEL MES ─────────────────────────

function renderMonthPanel() {
  const panel = document.getElementById('month-events-list');
  if (!panel) return;

  // Collect all events in current month, sorted by date then time
  const allEvents = [];
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const ds = dateStr(calYear, calMonth, d);
    (eventsData[ds] || []).forEach(ev => {
      allEvents.push({ ...ev, ds, day: d });
    });
  }

  allEvents.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return (a.time || '').localeCompare(b.time || '');
  });

  const INITIAL_SHOW = 8;
  const header = document.getElementById('month-panel-title');
  if (header) header.textContent = `${MESES[calMonth]} ${calYear}`;

  const listEl = document.getElementById('month-events-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  if (allEvents.length === 0) {
    listEl.innerHTML = `<p class="month-no-events">No hay eventos este mes.</p>`;
    const showMoreBtn = document.getElementById('btn-show-more');
    if (showMoreBtn) showMoreBtn.style.display = 'none';
    return;
  }

  const toShow = allEvents.slice(0, INITIAL_SHOW);
  toShow.forEach(ev => listEl.appendChild(buildMonthEventItem(ev)));

  const showMoreBtn = document.getElementById('btn-show-more');
  if (showMoreBtn) {
    if (allEvents.length > INITIAL_SHOW) {
      showMoreBtn.style.display = 'block';
      showMoreBtn.textContent = `Mostrar ${allEvents.length - INITIAL_SHOW} más`;
      showMoreBtn.onclick = () => openAllEventsModal(allEvents);
    } else {
      showMoreBtn.style.display = 'none';
    }
  }
}

function buildMonthEventItem(ev) {
  const t = new Date(ev.ds);
  const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const label = `${dias[t.getDay()]} ${ev.day}`;

  const item = document.createElement('div');
  item.className = 'month-event-item';
  item.innerHTML = `
    <div class="month-event-bar" style="background:var(--color-${ev.color}, var(--teal))"></div>
    <div class="month-event-body">
      <div class="month-event-title">${escapeHTML(ev.title)}</div>
      <div class="month-event-meta">
        <span class="month-event-date">${label}</span>
        ${ev.time ? `<span class="month-event-time">${ev.time}</span>` : ''}
      </div>
    </div>
  `;
  item.addEventListener('click', () => {
    calSelected = ev.ds;
    renderCalFull();
    renderDayPanel();
  });
  return item;
}

function openAllEventsModal(allEvents) {
  let modal = document.getElementById('all-events-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'all-events-modal';
  modal.className = 'cal-modal-overlay';
  modal.innerHTML = `
    <div class="cal-all-events-box">
      <div class="cal-all-events-header">
        <h3>Todos los eventos · ${MESES[calMonth]} ${calYear}</h3>
        <button id="all-events-close">✕</button>
      </div>
      <div class="cal-all-events-list" id="all-events-list"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const list = document.getElementById('all-events-list');
  allEvents.forEach(ev => list.appendChild(buildMonthEventItem(ev)));

  document.getElementById('all-events-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

// ── RENDER: PANEL DEL DÍA SELECCIONADO ───────────────────────

function renderDayPanel() {
  const titleEl = document.getElementById('selected-date-title');
  const listEl  = document.getElementById('events-list');
  const btnAdd  = document.getElementById('btn-add-event');
  if (!titleEl || !listEl) return;

  if (!calSelected) {
    titleEl.textContent = 'Selecciona un día';
    listEl.innerHTML = '<div class="day-panel-empty">Selecciona un día para ver sus eventos.</div>';
    if (btnAdd) btnAdd.disabled = true;
    return;
  }

  const [y, m, d] = calSelected.split('-').map(Number);
  const past      = isPast(y, m - 1, d);
  const todayFlag = isToday(y, m - 1, d);

  titleEl.textContent = `${d} de ${MESES[m - 1]}, ${y}`;

  if (btnAdd) {
    btnAdd.disabled = past;
    btnAdd.title    = past ? 'No puedes añadir eventos en fechas pasadas' : '';
    btnAdd.style.opacity = past ? '0.4' : '1';
    btnAdd.style.cursor  = past ? 'not-allowed' : 'pointer';
  }

  // Past badge
  let badge = '';
  if (past)      badge = '<span class="day-badge day-badge--past">Pasado</span>';
  if (todayFlag) badge = '<span class="day-badge day-badge--today">Hoy</span>';

  const dayEvents = (eventsData[calSelected] || []).slice()
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  listEl.innerHTML = '';

  if (badge) {
    const badgeEl = document.createElement('div');
    badgeEl.innerHTML = badge;
    badgeEl.style.marginBottom = '8px';
    listEl.appendChild(badgeEl);
  }

  if (dayEvents.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'day-panel-empty';
    empty.textContent = past ? 'No hubo eventos este día.' : 'No hay eventos este día.';
    listEl.appendChild(empty);
    return;
  }

  dayEvents.forEach(ev => {
    const item = document.createElement('div');
    item.className = `event-item event-${ev.color}`;
    item.innerHTML = `
      <div class="event-item-top">
        <h4 class="event-item-title">${escapeHTML(ev.title)}</h4>
        ${ev.time ? `<span class="event-item-time">${ev.time}</span>` : ''}
      </div>
      ${ev.desc ? `<p class="event-item-desc">${escapeHTML(ev.desc)}</p>` : ''}
      <div class="event-item-actions">
        ${!past ? `<button class="event-action-btn edit" data-id="${ev.id}">Editar</button>` : ''}
        <button class="event-action-btn delete" data-id="${ev.id}">Eliminar</button>
      </div>
    `;
    listEl.appendChild(item);
  });

  listEl.querySelectorAll('.event-action-btn.edit').forEach(btn => {
    btn.addEventListener('click', () => openEditEventModal(btn.dataset.id));
  });
  listEl.querySelectorAll('.event-action-btn.delete').forEach(btn => {
    btn.addEventListener('click', () => deleteEvent(btn.dataset.id));
  });
}

// ── NAVEGACIÓN ────────────────────────────────────────────────

function prevMonth() {
  if (calYear === MIN_YEAR && calMonth === MIN_MONTH) return;
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalFull();
}

function nextMonth() {
  if (calYear === MAX_YEAR && calMonth === MAX_MONTH) return;
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalFull();
}

// ── MODAL: AÑADIR / EDITAR EVENTO ────────────────────────────

function openAddEventModal() {
  if (!eventModalInstance || !calSelected) return;
  const [y, m, d] = calSelected.split('-').map(Number);
  if (isPast(y, m - 1, d)) return;
  document.getElementById('eventForm').reset();
  document.getElementById('event-id').value = '';
  document.getElementById('eventModalTitle').textContent = 'Añadir Evento';
  const colorTeal = document.getElementById('color-teal');
  if (colorTeal) colorTeal.checked = true;
  eventModalInstance.show();
}

function openEditEventModal(eventId) {
  if (!eventModalInstance || !calSelected) return;
  const ev = (eventsData[calSelected] || []).find(e => e.id === eventId);
  if (!ev) return;
  document.getElementById('eventForm').reset();
  document.getElementById('event-id').value    = ev.id;
  document.getElementById('event-title').value = ev.title;
  document.getElementById('event-time').value  = ev.time || '';
  document.getElementById('event-desc').value  = ev.desc || '';
  const colorInput = document.getElementById(`color-${ev.color}`);
  if (colorInput) colorInput.checked = true;
  document.getElementById('eventModalTitle').textContent = 'Editar Evento';
  eventModalInstance.show();
}

function saveEvent() {
  if (!calSelected) return;
  const form = document.getElementById('eventForm');
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const id    = document.getElementById('event-id').value;
  const title = document.getElementById('event-title').value.trim();
  const time  = document.getElementById('event-time').value;
  const desc  = document.getElementById('event-desc').value.trim();
  const color = document.querySelector('input[name="event-color"]:checked').value;

  if (!eventsData[calSelected]) eventsData[calSelected] = [];

  if (id) {
    const idx = eventsData[calSelected].findIndex(e => e.id === id);
    if (idx !== -1) eventsData[calSelected][idx] = { id, title, time, desc, color };
  } else {
    const newId = 'evt_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    eventsData[calSelected].push({ id: newId, title, time, desc, color });
  }

  persistEvents();
  renderCalFull();      // updates grid + month panel + today section
  renderDayPanel();
  eventModalInstance.hide();
}

function deleteEvent(eventId) {
  if (!calSelected || !eventsData[calSelected]) return;
  if (!confirm('¿Seguro que quieres eliminar este evento?')) return;
  eventsData[calSelected] = eventsData[calSelected].filter(e => e.id !== eventId);
  if (eventsData[calSelected].length === 0) delete eventsData[calSelected];
  persistEvents();
  renderCalFull();      // updates grid + month panel + today section
  renderDayPanel();
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Mini-mockup (index.html)
  if (document.getElementById('cal-grid')) {
    renderMockup();
    document.getElementById('cal-prev')?.addEventListener('click', mockupPrevMonth);
    document.getElementById('cal-next')?.addEventListener('click', mockupNextMonth);
  }

  // Calendario completo (calendario.html)
  if (document.getElementById('cal-grid-full')) {
    const saved = localStorage.getItem('laborae_events');
    if (saved) {
      try {
        const raw = JSON.parse(saved);
        // Normalize keys: "2026-5-3" → "2026-05-03"
        eventsData = {};
        Object.entries(raw).forEach(([key, val]) => {
          const parts = key.split('-');
          if (parts.length === 3) {
            const normalized = `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
            eventsData[normalized] = val;
          } else {
            eventsData[key] = val;
          }
        });
      } catch { eventsData = {}; }
    }

    // Eventos de demo: insertar si no hay datos o si el formato es antiguo
    const hasValidData = Object.keys(eventsData).some(k => /^\d{4}-\d{2}-\d{2}$/.test(k));
    if (!hasValidData) {
      const t   = new Date();
      const y   = t.getFullYear();
      const m   = t.getMonth();
      const pad = n => String(n).padStart(2, '0');

      // Fecha relativa desde hoy
      const fd = offsetDays => {
        const d = new Date(t);
        d.setDate(d.getDate() + offsetDays);
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      };

      // Fecha fija en un mes concreto (mes = 0-based)
      const fm = (year, month, day) => `${year}-${pad(month+1)}-${pad(day)}`;

      const seed = [
        // ── HOY ──────────────────────────────────────────
        [fd(0),  { id:'d00', title:'Inicio de jornada',       time:'08:00', desc:'¡Buen día!',                          color:'green'  }],

        // ── PRÓXIMOS DÍAS ─────────────────────────────────
        [fd(1),  { id:'d01', title:'Reunión de equipo',        time:'09:00', desc:'Revisión semanal del proyecto.',       color:'teal'   }],
        [fd(2),  { id:'d02', title:'Entrega de informe',       time:'12:00', desc:'Informe mensual de actividad.',        color:'orange' }],
        [fd(2),  { id:'d03', title:'Llamada con cliente',      time:'16:30', desc:'Seguimiento del proyecto Q2.',         color:'blue'   }],
        [fd(3),  { id:'d04', title:'Revisión de código',       time:'11:00', desc:'Code review del sprint actual.',       color:'green'  }],
        [fd(3),  { id:'d05', title:'Sincronización diaria',    time:'09:00', desc:'Daily standup del equipo.',            color:'teal'   }],
        [fd(3),  { id:'d06', title:'Despliegue en producción', time:'18:00', desc:'Release v2.1.',                       color:'orange' }],
        [fd(3),  { id:'d07', title:'Backup base de datos',     time:'20:00', desc:'Copia de seguridad semanal.',          color:'blue'   }],
        [fd(4),  { id:'d08', title:'Formación interna',        time:'10:00', desc:'Taller de componentes Bootstrap.',     color:'purple' }],
        [fd(4),  { id:'d09', title:'Revisión de activos',      time:'16:00', desc:'Inventario trimestral.',               color:'green'  }],
        [fd(7),  { id:'d10', title:'Planificación mensual',    time:'09:30', desc:'Objetivos del próximo mes.',           color:'teal'   }],
        [fd(10), { id:'d11', title:'Demo al cliente',          time:'09:30', desc:'Presentación de avances del sprint.',  color:'teal'   }],
        [fd(10), { id:'d12', title:'Cierre de sprint',         time:'17:00', desc:'Revisión y retrospectiva.',            color:'purple' }],
        [fd(14), { id:'d13', title:'Actualización de sistema', time:'08:00', desc:'Mantenimiento preventivo.',            color:'orange' }],

        // ── MES SIGUIENTE ─────────────────────────────────
        [fm(y, m+1 > 11 ? 0 : m+1, 3),  { id:'d20', title:'Kick-off de proyecto',     time:'10:00', desc:'Arranque del nuevo trimestre.',        color:'teal'   }],
        [fm(y, m+1 > 11 ? 0 : m+1, 3),  { id:'d21', title:'Presentación al cliente',  time:'15:00', desc:'Demo de funcionalidades nuevas.',       color:'blue'   }],
        [fm(y, m+1 > 11 ? 0 : m+1, 8),  { id:'d22', title:'Revisión de roadmap',      time:'11:00', desc:'Planificación del siguiente sprint.',    color:'purple' }],
        [fm(y, m+1 > 11 ? 0 : m+1, 12), { id:'d23', title:'Formación avanzada',       time:'09:00', desc:'Taller de accesibilidad web.',           color:'green'  }],
        [fm(y, m+1 > 11 ? 0 : m+1, 15), { id:'d24', title:'Reunión con dirección',    time:'12:00', desc:'Presentación de resultados Q2.',         color:'orange' }],
        [fm(y, m+1 > 11 ? 0 : m+1, 18), { id:'d25', title:'Cierre de facturación',    time:'17:00', desc:'Revisión de facturas del mes.',          color:'teal'   }],
        [fm(y, m+1 > 11 ? 0 : m+1, 22), { id:'d26', title:'Evaluación de equipo',     time:'10:30', desc:'Revisión de objetivos individuales.',    color:'blue'   }],
        [fm(y, m+1 > 11 ? 0 : m+1, 22), { id:'d27', title:'Actualización de docs',    time:'16:00', desc:'Documentación técnica del proyecto.',    color:'purple' }],
        [fm(y, m+1 > 11 ? 0 : m+1, 27), { id:'d28', title:'Sprint planning',          time:'09:00', desc:'Planificación del siguiente sprint.',    color:'teal'   }],

        // ── DOS MESES ADELANTE ────────────────────────────
        [fm(y, m+2 > 11 ? (m+2-12) : m+2, 5),  { id:'d30', title:'Conferencia tech',       time:'09:00', desc:'Asistencia a evento de tecnología.',   color:'purple' }],
        [fm(y, m+2 > 11 ? (m+2-12) : m+2, 5),  { id:'d31', title:'Networking',             time:'18:00', desc:'Reunión con la comunidad dev.',         color:'blue'   }],
        [fm(y, m+2 > 11 ? (m+2-12) : m+2, 11), { id:'d32', title:'Revisión anual',         time:'10:00', desc:'Evaluación de métricas anuales.',       color:'teal'   }],
        [fm(y, m+2 > 11 ? (m+2-12) : m+2, 19), { id:'d33', title:'Lanzamiento v3.0',       time:'12:00', desc:'Release mayor del producto.',           color:'orange' }],
        [fm(y, m+2 > 11 ? (m+2-12) : m+2, 25), { id:'d34', title:'Formación nuevos',       time:'09:00', desc:'Onboarding nuevos miembros del equipo.',color:'green'  }],
      ];

      seed.forEach(([key, ev]) => {
        if (!eventsData[key]) eventsData[key] = [];
        // Avoid duplicates if already seeded
        if (!eventsData[key].find(e => e.id === ev.id)) {
          eventsData[key].push(ev);
        }
      });

      persistEvents();
    }

    const today = new Date();
    const inRange =
      (today.getFullYear() > MIN_YEAR || (today.getFullYear() === MIN_YEAR && today.getMonth() >= MIN_MONTH)) &&
      (today.getFullYear() < MAX_YEAR || (today.getFullYear() === MAX_YEAR && today.getMonth() <= MAX_MONTH));

    if (inRange) {
      calYear    = today.getFullYear();
      calMonth   = today.getMonth();
      calSelected = dateStr(calYear, calMonth, today.getDate());
    }

    const modalEl = document.getElementById('eventModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
      eventModalInstance = new bootstrap.Modal(modalEl);
    }

    // Reset demo button — registered once only
    const resetBtn = document.getElementById('btn-reset-demo');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (!confirm('¿Restablecer los eventos de demo? Se borrarán todos los eventos actuales.')) return;
        localStorage.removeItem('laborae_events');
        location.reload();
      }, { once: false });
    }

    document.getElementById('btn-prev-month')?.addEventListener('click', prevMonth);
    document.getElementById('btn-next-month')?.addEventListener('click', nextMonth);
    document.getElementById('btn-add-event')?.addEventListener('click', openAddEventModal);
    document.getElementById('btn-save-event')?.addEventListener('click', saveEvent);

    renderCalFull();
    renderDayPanel();
  }
});