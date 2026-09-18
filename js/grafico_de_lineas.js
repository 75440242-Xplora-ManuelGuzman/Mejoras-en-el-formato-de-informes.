// ===========================================================================
// VIEWBOX ADAPTADO AL TAMAÑO REAL DEL CONTENEDOR
// ===========================================================================
function calcularViewBoxAdaptado(svg) {
    const width = 600; 
    const rect = svg.getBoundingClientRect();
    let proporcion = (rect.width > 0 && rect.height > 0) ? (rect.height / rect.width) : (32 / 600);
    proporcion = Math.min(Math.max(proporcion, 0.02), 1.2);

    const height = width * proporcion; 
    const padX = width * 0.017;        
    const padY = height * 0.125;       
    const scale = rect.width > 0 ? (rect.width / width) : 1;

    return { width, height, padX, padY, scale };
}

// ===========================================================================
// LECTURA DE FILTROS DINÁMICOS
// ===========================================================================
function obtenerSemanasSeleccionadas() {
    const filtro = document.getElementById('filtro-semanas');
    if (!filtro) return null; 
    const checkboxes = filtro.querySelectorAll('input[type="checkbox"]');
    return Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
}

// ===========================================================================
// FUNCIONES AUXILIARES DE COLOR Y CÁLCULO
// ===========================================================================
function colorSegunPorcentaje(porcentaje) {
    if (porcentaje >= 80) return '#1e5c3a'; // Verde
    if (porcentaje >= 50) return '#eab308'; // Naranja
    return '#dc2626';                       // Rojo
}

function calcularCumplimientoSemana(valor, meta, config) {
    if (config.format === 'percent') return valor;
    if (config.metaEsTecho) {
      return Math.max(0, ((meta - valor) / meta) * 100);
    }
    return (valor / meta) * 100;
}

// ===========================================================================
// RENDERIZADO "RESULTADO" 
// ===========================================================================
function renderKPI(cardId, config) {
    const card = document.getElementById(cardId);
    if (!card) return;

    const { title, subtitle, goal, weeks: weeksOriginales, format } = config;

    // APLICACIÓN DEL FILTRO
    let weeks = weeksOriginales;
    const semanasSeleccionadas = obtenerSemanasSeleccionadas();
    if (semanasSeleccionadas) {
        weeks = weeksOriginales.filter(w => semanasSeleccionadas.includes(w.week));
    }

    card.querySelector('[data-field="title"]').textContent = title;
    card.querySelector('[data-field="subtitle"]').textContent = subtitle;

    const color = colorSegunPorcentaje(config.resultado.colorValor);
    const avgEl = card.querySelector('[data-field="avg"]');
    avgEl.textContent = config.resultado.texto;
    avgEl.style.color = color;

    const svg = card.querySelector('.svg-grafico-linea');
    const tooltip = card.querySelector('.tooltip-grafico-linea');
    const tWeek = tooltip.querySelector('.semana-grafico-linea');
    const tValue = tooltip.querySelector('.valor-grafico-linea');

    svg.innerHTML = ''; 
    
    // Si desmarcan todas las semanas, mostramos un aviso y detenemos el renderizado
    if (weeks.length === 0) {
        svg.innerHTML = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#80868B" font-size="11" font-weight="600">Seleccione al menos una semana</text>`;
        return;
    }

    const { width, height, padX, padY, scale } = calcularViewBoxAdaptado(svg);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const drawW = width - padX * 2;
    const drawH = height - padY * 2;

    const maxVal = Math.max(...weeks.map(w => w.value), goal);
    const minVal = Math.min(...weeks.map(w => w.value), goal);
    const range = Math.max(maxVal - minVal, 10);
    const buffer = range * 0.35;
    const scaleMin = minVal - buffer;
    const scaleMax = maxVal + buffer;

    // Control de división por cero si solo hay 1 semana seleccionada (centra el punto)
    const xFor = (i) => weeks.length > 1 ? padX + (i / (weeks.length - 1)) * drawW : padX + drawW / 2;
    const yFor = (v) => padY + drawH - ((v - scaleMin) / (scaleMax - scaleMin)) * drawH;
    const yGoal = yFor(goal);

    const goalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    goalLine.setAttribute('x1', padX);
    goalLine.setAttribute('y1', yGoal);
    goalLine.setAttribute('x2', width - padX);
    goalLine.setAttribute('y2', yGoal);
    goalLine.setAttribute('stroke', '#111');
    goalLine.setAttribute('stroke-width', '1'); 
    goalLine.setAttribute('stroke-dasharray', '4 3');
    goalLine.setAttribute('opacity', '0.7');
    svg.appendChild(goalLine);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = weeks.map((w, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(w.value).toFixed(2)}`).join(' ');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);

    const RADIO_PUNTO_PX = 4;
    const radioPunto = RADIO_PUNTO_PX / scale;

    weeks.forEach((w, i) => {
      const cx = xFor(i);
      const cy = yFor(w.value);

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'grupo-puntos-grafico-linea');

      const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      core.setAttribute('cx', cx);
      core.setAttribute('cy', cy);
      core.setAttribute('r', radioPunto);
      core.setAttribute('class', 'punto-nucleo-grafico-linea');
      core.setAttribute('fill', color);

      group.appendChild(core);

      group.addEventListener('mouseenter', () => {
        tWeek.textContent = w.week;
        let displayValue = w.value;
        let mostrarSubtitulo = true; 
        if (format === 'percent') {
          displayValue = w.value + '%';
          mostrarSubtitulo = false;
        } else if (format === 'currency') {
          displayValue = '$' + w.value.toLocaleString('es-MX');
          mostrarSubtitulo = false;
        } else if (format === 'porcentuales') {
          displayValue = w.value.toLocaleString('es-MX') + 'pp';
          mostrarSubtitulo = false;
        }
        tValue.textContent = mostrarSubtitulo ? `${displayValue} ${subtitle.toLowerCase()}` : `${displayValue}`;
        tooltip.style.opacity = '1';
        positionTooltip(cx, cy);
      });

      group.addEventListener('mousemove', () => positionTooltip(cx, cy));
      group.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });

      svg.appendChild(group);
    });

    function positionTooltip(cx, cy) {
      const svgRect = svg.getBoundingClientRect();
      const scaleX = svgRect.width / width;
      const scaleY = svgRect.height / height;
      const px = cx * scaleX;
      const py = cy * scaleY;
      tooltip.style.left = `${px}px`;
      tooltip.style.top = `${py}px`;
    }
}

// ===========================================================================
// RENDERIZADO "% CUMPLIMIENTO" 
// ===========================================================================
function renderLineaCumplimiento(cardId, config) {
    const card = document.getElementById(cardId);
    if (!card) return;

    const { title, subtitle, goal, weeks: weeksOriginales } = config;

    // APLICACIÓN DEL FILTRO
    let weeks = weeksOriginales;
    const semanasSeleccionadas = obtenerSemanasSeleccionadas();
    if (semanasSeleccionadas) {
        weeks = weeksOriginales.filter(w => semanasSeleccionadas.includes(w.week));
    }

    card.querySelector('[data-field="title"]').textContent = title;
    card.querySelector('[data-field="subtitle"]').textContent = subtitle;

    const color = colorSegunPorcentaje(config.cumplimiento.colorValor);
    const avgEl = card.querySelector('[data-field="avg"]');
    avgEl.textContent = config.cumplimiento.texto;
    avgEl.style.color = color;

    const svg = card.querySelector('.svg-grafico-linea');
    const tooltip = card.querySelector('.tooltip-grafico-linea');
    const tWeek = tooltip.querySelector('.semana-grafico-linea');
    const tValue = tooltip.querySelector('.valor-grafico-linea');

    svg.innerHTML = ''; 

    // Aviso si no hay data seleccionada
    if (weeks.length === 0) {
        svg.innerHTML = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#80868B" font-size="11" font-weight="600">Seleccione al menos una semana</text>`;
        return;
    }

    const { width, height, padX, padY, scale } = calcularViewBoxAdaptado(svg);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const drawW = width - padX * 2;
    const drawH = height - padY * 2;

    const cumplimientos = weeks.map(w => calcularCumplimientoSemana(w.value, goal, config));
    const yCentro = padY + drawH / 2;
    const desvioMaximo = Math.max(...cumplimientos.map(c => Math.abs(c - 100)), 10);
    const escalaDesvio = desvioMaximo * 1.3;

    const yFor = (c) => yCentro - ((c - 100) / escalaDesvio) * (drawH / 2);

    const goalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    goalLine.setAttribute('x1', padX);
    goalLine.setAttribute('y1', yCentro);
    goalLine.setAttribute('x2', width - padX);
    goalLine.setAttribute('y2', yCentro);
    goalLine.setAttribute('stroke', '#111');
    goalLine.setAttribute('stroke-width', '1');
    goalLine.setAttribute('stroke-dasharray', '4 3');
    goalLine.setAttribute('opacity', '0.7');
    svg.appendChild(goalLine);

    // Control de división por cero si solo hay 1 semana seleccionada
    const xFor = (i) => weeks.length > 1 ? padX + (i / (weeks.length - 1)) * drawW : padX + drawW / 2;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = cumplimientos.map((c, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(c).toFixed(2)}`).join(' ');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('class', 'linea-cumplimiento-resultado'); // animación de "dibujado" (ver grafico_de_lineas.css)
    svg.appendChild(path);

    const RADIO_PUNTO_PX = 4;
    const radioPunto = RADIO_PUNTO_PX / scale;

    weeks.forEach((w, i) => {
      const cumplimiento = cumplimientos[i];
      const cx = xFor(i);
      const cy = yFor(cumplimiento);

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'grupo-puntos-grafico-linea');

      const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      core.setAttribute('cx', cx);
      core.setAttribute('cy', cy);
      core.setAttribute('r', radioPunto);
      core.setAttribute('class', 'punto-nucleo-grafico-linea');
      core.setAttribute('fill', color);
      group.appendChild(core);

      group.addEventListener('mouseenter', () => {
        tWeek.textContent = w.week;
        tValue.textContent = `${Math.round(cumplimiento)}% de cumplimiento`;
        tooltip.style.opacity = '1';
        positionTooltip(cx, cy);
      });
      group.addEventListener('mousemove', () => positionTooltip(cx, cy));
      group.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });

      svg.appendChild(group);
    });

    function positionTooltip(cx, cy) {
      const svgRect = svg.getBoundingClientRect();
      const scaleX = svgRect.width / width;
      const scaleY = svgRect.height / height;
      const px = cx * scaleX;
      const py = cy * scaleY;
      tooltip.style.left = `${px}px`;
      tooltip.style.top = `${py}px`;
    }
}

// ===========================================================================
// BASE DE DATOS DE KPIS
// ===========================================================================
const kpi1Data = {
    title: 'SELL OUT (SO)',
    subtitle: 'TM',
    goal: 110,
    format: 'toneladas',
    resultado:    { texto: '113 TM', colorValor: 100 },
    cumplimiento: { texto: '102%',   colorValor: 102 },
    weeks: [
      { week: 'Semana 1', value: 128 }, { week: 'Semana 2', value: 85 },
      { week: 'Semana 3', value: 130 }, { week: 'Semana 4', value: 123 },
      { week: 'Semana 5', value: 100 }, { week: 'Semana 6', value: 110 }
    ]
};

const kpi2Data = {
    title: 'BRECHA',
    subtitle: '%',
    goal: 20,
    format: 'porcentuales',
    resultado:    { texto: '18PP', colorValor: 18 },
    cumplimiento: { texto: '24%',  colorValor: 24 },
    weeks: [
      { week: 'Semana 1', value: 10 }, { week: 'Semana 2', value: 20 },
      { week: 'Semana 3', value: 15 }, { week: 'Semana 4', value: 12 },
      { week: 'Semana 5', value: 35 }, { week: 'Semana 6', value: 14 }
    ]
};

const kpi3Data = {
    title: 'EFICIENCIA DE INVERSIÓN (EI)',
    subtitle: '%',
    goal: 70,
    format: 'percent',
    resultado:    { texto: '73%', colorValor: 73 },
    cumplimiento: { texto: '73%', colorValor: 73 },
    weeks: [
      { week: 'Semana 1', value: 76 }, { week: 'Semana 2', value: 90 },
      { week: 'Semana 3', value: 72 }, { week: 'Semana 4', value: 72 },
      { week: 'Semana 5', value: 45 }, { week: 'Semana 6', value: 80 }
    ]
};

const kpi4Data = {
    title: 'PARTICIPACIÓN',
    subtitle: '%',
    goal: 100,
    format: 'percent',
    resultado:    { texto: '96%', colorValor: 96 },
    cumplimiento: { texto: '96%', colorValor: 96 },
    weeks: [
      { week: 'Semana 1', value: 95 }, { week: 'Semana 2', value: 100 },
      { week: 'Semana 3', value: 80 }, { week: 'Semana 4', value: 100 },
      { week: 'Semana 5', value: 90 }, { week: 'Semana 6', value: 113 }
    ]
};

const kpi5Data = {
    title: 'NPS',
    subtitle: 'Pts',
    goal: 85,
    format: 'puntos',
    resultado:    { texto: '85Pts', colorValor: 100 },
    cumplimiento: { texto: '100%',  colorValor: 100 },
    weeks: [
      { week: 'Semana 1', value: 78 }, { week: 'Semana 2', value: 82 },
      { week: 'Semana 3', value: 88 }, { week: 'Semana 4', value: 85 },
      { week: 'Semana 5', value: 90 }, { week: 'Semana 6', value: 87 }
    ]
};

const CONFIGURACION_KPIS_GRAFICO_LINEA = [
  { id: 'kpi1-grafico-linea', data: kpi1Data },
  { id: 'kpi2-grafico-linea', data: kpi2Data },
  { id: 'kpi3-grafico-linea', data: kpi3Data },
  { id: 'kpi4-grafico-linea', data: kpi4Data },
  { id: 'kpi5-grafico-linea', data: kpi5Data }
];

// ===========================================================================
// INICIALIZACIÓN Y EVENTOS DE INTERFAZ
// ===========================================================================
function renderTodosLosKPIs(modo) {
  CONFIGURACION_KPIS_GRAFICO_LINEA.forEach(({ id, data }) => {
    if (modo === 'cumplimiento') {
      renderLineaCumplimiento(id, data);
    } else {
      renderKPI(id, data);
    }
  });
}

// ===========================================================================
// TOGGLE: qué se muestra en modo "Resultado"
// ===========================================================================
// A partir de ahora, el modo "Resultado" muestra el GRÁFICO DE DOBLE LÍNEA
// (Objetivo vs. Resultado, ver grafico_doble_lineas.js/.css) en vez del
// gráfico de línea simple que tenía antes. El modo "% Cumplimiento"
// (renderLineaCumplimiento, arriba en este mismo archivo) NO CAMBIÓ EN
// NADA — sigue funcionando exactamente igual que siempre.
//
// La función renderKPI() (línea simple del modo "Resultado" original)
// se queda definida más arriba por si algún día quieres volver a usarla
// — simplemente ya no se llama desde acá.
function inicializarToggleModoVisualizacion() {
  const botones = document.querySelectorAll('.toggle-modo-btn');
  if (botones.length === 0) return;

  // Los 2 "tableros" que se alternan — nunca se muestran los dos a la vez.
  const tableroCumplimiento = document.querySelector('.tablero-grafico-linea');
  const tableroDobleLinea = document.getElementById('tableroDobleLinea');

  botones.forEach(boton => {
    boton.addEventListener('click', () => {
      const modo = boton.dataset.modo;
      botones.forEach(b => b.classList.remove('is-active'));
      boton.classList.add('is-active');

      if (modo === 'resultado') {
        // Modo "Resultado" -> gráfico de doble línea
        if (tableroCumplimiento) tableroCumplimiento.classList.add('oculto-grafico');
        if (tableroDobleLinea) tableroDobleLinea.classList.remove('oculto-grafico');
        if (typeof renderTodosLosKpisDobleLinea === 'function') renderTodosLosKpisDobleLinea();
      } else {
        // Modo "% Cumplimiento" -> intacto, tal como siempre funcionó
        if (tableroDobleLinea) tableroDobleLinea.classList.add('oculto-grafico');
        if (tableroCumplimiento) tableroCumplimiento.classList.remove('oculto-grafico');
        renderTodosLosKPIs(modo);
      }
    });
  });
}

// Arranque inicial
renderTodosLosKPIs('cumplimiento');
inicializarToggleModoVisualizacion();

// ===========================================================================
// ACTUALIZACIÓN EN TIEMPO REAL AL CAMBIAR LOS FILTROS
// ===========================================================================
// OJO: este listener solo se encarga del modo "% Cumplimiento". El modo
// "Resultado" (gráfico de doble línea) tiene su PROPIO listener del
// mismo evento dentro de grafico_doble_lineas.js — así cada archivo
// actualiza únicamente lo suyo, sin redibujar el mismo gráfico 2 veces.
document.addEventListener('filtrosCambiados', () => {
    const botonActivo = document.querySelector('.toggle-modo-btn.is-active');
    const modoActivo = botonActivo ? botonActivo.dataset.modo : 'cumplimiento';

    if (modoActivo !== 'resultado') {
        renderTodosLosKPIs(modoActivo);
    }
});