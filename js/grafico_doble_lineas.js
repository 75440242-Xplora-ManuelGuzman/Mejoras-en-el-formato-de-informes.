// ===========================================================================
// GRÁFICO DE DOBLE LÍNEA (Objetivo vs. Resultado) — modo "Resultado"
// ===========================================================================
// Este archivo es 100% independiente del gráfico de "% Cumplimiento"
// (grafico_de_lineas.js) — no lo modifica ni depende de sus datos. Sí
// REUTILIZA 2 funciones genéricas que ya existían en ese archivo (por
// eso grafico_de_lineas.js debe cargarse ANTES que este en index.html):
//   - calcularViewBoxAdaptado(svg)   -> evita que los puntos se deformen
//   - obtenerSemanasSeleccionadas()  -> lee qué semanas están marcadas
//     en el filtro del header, para que este gráfico también reaccione
//     a él (igual que el gráfico de % Cumplimiento).
//
// ---------------------------------------------------------------------
// CÓMO CONFIGURAR CADA KPI (edita el array KPIS_DOBLE_LINEA más abajo):
// ---------------------------------------------------------------------
//   titulo / subtitulo: nombre y unidad del KPI (TM, %, Pts, etc.)
//
//   color: 'green' | 'yellow' | 'red' | o un color hexadecimal propio
//     (ej. '#3b82f6'). Es 100% MANUAL — tú decides el color, no se
//     calcula solo a partir de los datos.
//
//   texto: el NÚMERO GRANDE que se muestra a la derecha de cada fila.
//     También 100% MANUAL — escribe lo que quieras (ej. "113 TM"),
//     no se calcula como promedio ni nada automático. Se pinta con el
//     mismo "color" de arriba.
//
//   weeks: un array con una fila por semana:
//     { week: 'Semana 1', objetivo: 100, resultado: 105 }
//     - "week" debe llamarse IGUAL que las opciones del filtro de
//       Semanas del header (ej. "Semana 1", "Semana 2"...), si no,
//       el filtrado por semana no va a poder encontrarla.
//     - "objetivo" es el valor de la línea punteada (meta de esa semana).
//     - "resultado" es el valor de la línea sólida (lo realmente logrado).
//
//   PARA AGREGAR/QUITAR UNA SEMANA: agrega/quita su objeto dentro de
//   "weeks". Para agregar un 6to KPI: copia un bloque completo del
//   array KPIS_DOBLE_LINEA y agrega su tarjeta en index.html (copiando
//   un bloque <div class="tarjeta-kpi-doble-linea">...</div> existente).
// ===========================================================================

// Mapa de colores con nombre — igual paleta que el resto del dashboard.
const MAPA_COLORES_DOBLE_LINEA = {
    green: '#1e5c3a',
    yellow: '#eab308',
    red: '#dc2626'
};

// Convierte 'green'/'yellow'/'red' a su hex, o deja pasar un hex propio
// tal cual si el usuario escribió uno directamente en "color".
function resolverColorDobleLinea(color) {
    return MAPA_COLORES_DOBLE_LINEA[color] || color;
}

const KPIS_DOBLE_LINEA = [
    {
        cardId: 'kpi1-doble-linea',
        titulo: 'SELL OUT (SO)',
        subtitulo: 'TM',
        color: 'green',   // ← CAMBIA EL COLOR AQUÍ: 'green', 'yellow', 'red' o un hex
        texto: '113 TM',  // ← EL NÚMERO GRANDE — 100% manual, escribe lo que quieras
        weeks: [
            { week: 'Semana 1', objetivo: 100, resultado: 105 },
            { week: 'Semana 2', objetivo: 110, resultado: 95 },
            { week: 'Semana 3', objetivo: 105, resultado: 115 },
            { week: 'Semana 4', objetivo: 115, resultado: 110 },
            { week: 'Semana 5', objetivo: 108, resultado: 100 },
            { week: 'Semana 6', objetivo: 112, resultado: 113 }
        ]
    },
    {
        cardId: 'kpi2-doble-linea',
        titulo: 'BRECHA',
        subtitulo: '%',
        color: 'red',
        texto: '21%',
        weeks: [
            { week: 'Semana 1', objetivo: 20, resultado: 18 },
            { week: 'Semana 2', objetivo: 22, resultado: 25 },
            { week: 'Semana 3', objetivo: 18, resultado: 17 },
            { week: 'Semana 4', objetivo: 25, resultado: 28 },
            { week: 'Semana 5', objetivo: 20, resultado: 19 },
            { week: 'Semana 6', objetivo: 23, resultado: 21 }
        ]
    },
    {
        cardId: 'kpi3-doble-linea',
        titulo: 'EFICIENCIA DE INVERSIÓN (EI)',
        subtitulo: '%',
        color: 'yellow',
        texto: '75%',
        weeks: [
            { week: 'Semana 1', objetivo: 75, resultado: 73 },
            { week: 'Semana 2', objetivo: 78, resultado: 80 },
            { week: 'Semana 3', objetivo: 72, resultado: 70 },
            { week: 'Semana 4', objetivo: 80, resultado: 78 },
            { week: 'Semana 5', objetivo: 76, resultado: 77 },
            { week: 'Semana 6', objetivo: 79, resultado: 75 }
        ]
    },
    {
        cardId: 'kpi4-doble-linea',
        titulo: 'PARTICIPACIÓN',
        subtitulo: '%',
        color: 'green',
        texto: '96%',
        weeks: [
            { week: 'Semana 1', objetivo: 90, resultado: 92 },
            { week: 'Semana 2', objetivo: 92, resultado: 91 },
            { week: 'Semana 3', objetivo: 88, resultado: 85 },
            { week: 'Semana 4', objetivo: 95, resultado: 96 },
            { week: 'Semana 5', objetivo: 93, resultado: 94 },
            { week: 'Semana 6', objetivo: 94, resultado: 96 }
        ]
    },
    {
        cardId: 'kpi5-doble-linea',
        titulo: 'NPS',
        subtitulo: 'Pts',
        color: 'green',
        texto: '85 Pts',
        weeks: [
            { week: 'Semana 1', objetivo: 80, resultado: 75 },
            { week: 'Semana 2', objetivo: 82, resultado: 80 },
            { week: 'Semana 3', objetivo: 78, resultado: 88 },
            { week: 'Semana 4', objetivo: 85, resultado: 82 },
            { week: 'Semana 5', objetivo: 83, resultado: 85 },
            { week: 'Semana 6', objetivo: 86, resultado: 85 }
        ]
    }
];

// ===========================================================================
// RENDERIZADO DE UN KPI
// ===========================================================================
function renderGraficoDobleLinea(kpi) {
    const card = document.getElementById(kpi.cardId);
    if (!card) return;

    // --- Filtro por semana (igual mecánica que grafico_de_lineas.js) ---
    let weeks = kpi.weeks;
    if (typeof obtenerSemanasSeleccionadas === 'function') {
        const semanasSeleccionadas = obtenerSemanasSeleccionadas();
        if (semanasSeleccionadas) {
            weeks = kpi.weeks.filter(w => semanasSeleccionadas.includes(w.week));
        }
    }

    card.querySelector('[data-field="title"]').textContent = kpi.titulo;
    card.querySelector('[data-field="subtitle"]').textContent = kpi.subtitulo;

    // --- Número grande y color: 100% manuales (ver KPIS_DOBLE_LINEA arriba) ---
    const color = resolverColorDobleLinea(kpi.color);
    const valorEl = card.querySelector('[data-field="valor"]');
    valorEl.textContent = kpi.texto;
    valorEl.style.color = color;

    const svg = card.querySelector('.svg-doble-linea');
    const tooltip = card.querySelector('.tooltip-doble-linea');
    const tSemana = tooltip.querySelector('.semana-doble-linea');
    const tObjetivo = tooltip.querySelector('.valor-objetivo-doble-linea');
    const tResultado = tooltip.querySelector('.valor-resultado-doble-linea');

    svg.innerHTML = '';

    // Si desmarcan todas las semanas, avisamos y no dibujamos nada más
    if (weeks.length === 0) {
        svg.innerHTML = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#80868B" font-size="11" font-weight="600">Seleccione al menos una semana</text>`;
        return;
    }

    // --- ViewBox adaptado al tamaño real (evita que los puntos se
    //     deformen — misma función que usa el gráfico de % Cumplimiento) ---
    const { width, height, padX, padY, scale } = calcularViewBoxAdaptado(svg);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const drawW = width - padX * 2;
    const drawH = height - padY * 2;

    const todosLosValores = weeks.flatMap(w => [w.objetivo, w.resultado]);
    const minVal = Math.min(...todosLosValores) * 0.95;
    const maxVal = Math.max(...todosLosValores) * 1.05;

    // Control de división por cero si solo hay 1 semana seleccionada
    const xFor = (i) => weeks.length > 1 ? padX + (i / (weeks.length - 1)) * drawW : padX + drawW / 2;
    const yFor = (v) => padY + drawH - ((v - minVal) / (maxVal - minVal)) * drawH;

    // --- Grilla horizontal (2 líneas de referencia, igual que tu original) ---
    for (let i = 0; i <= 2; i++) {
        const y = padY + (drawH / 2) * i;
        const val = maxVal - ((maxVal - minVal) / 2) * i;
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gridLine.setAttribute('x1', padX);
        gridLine.setAttribute('y1', y);
        gridLine.setAttribute('x2', width - padX);
        gridLine.setAttribute('y2', y);
        gridLine.setAttribute('class', 'linea-doble-grid');
        svg.appendChild(gridLine);

        const gridLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        gridLabel.setAttribute('x', padX - 4);
        gridLabel.setAttribute('y', y + 3);
        gridLabel.setAttribute('text-anchor', 'end');
        gridLabel.setAttribute('class', 'linea-doble-axis-label');
        gridLabel.textContent = Math.round(val);
        svg.appendChild(gridLabel);
    }

    // --- Línea de OBJETIVO: punteada, gris, sin interacción ---
    const pathObjetivo = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const dObjetivo = weeks.map((w, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(w.objetivo).toFixed(2)}`).join(' ');
    pathObjetivo.setAttribute('d', dObjetivo);
    pathObjetivo.setAttribute('class', 'linea-doble-objetivo');
    svg.appendChild(pathObjetivo);

    weeks.forEach((w, i) => {
        const puntoObjetivo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        puntoObjetivo.setAttribute('cx', xFor(i));
        puntoObjetivo.setAttribute('cy', yFor(w.objetivo));
        puntoObjetivo.setAttribute('r', 3);
        puntoObjetivo.setAttribute('class', 'punto-doble-objetivo');
        svg.appendChild(puntoObjetivo);
    });

    // --- Línea de RESULTADO: sólida, coloreada, con animación de dibujado ---
    const pathResultado = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const dResultado = weeks.map((w, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(w.resultado).toFixed(2)}`).join(' ');
    pathResultado.setAttribute('d', dResultado);
    pathResultado.setAttribute('class', 'linea-doble-resultado');
    pathResultado.setAttribute('stroke', color);
    svg.appendChild(pathResultado);

    // Radio del punto adaptado al tamaño real (~4px reales siempre),
    // misma técnica que el gráfico de % Cumplimiento.
    const RADIO_PUNTO_PX = 4;
    const radioPunto = RADIO_PUNTO_PX / scale;

    weeks.forEach((w, i) => {
        const cx = xFor(i);
        const cy = yFor(w.resultado);

        const puntoResultado = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        puntoResultado.setAttribute('cx', cx);
        puntoResultado.setAttribute('cy', cy);
        puntoResultado.setAttribute('r', radioPunto);
        puntoResultado.setAttribute('class', 'punto-doble-resultado');
        puntoResultado.setAttribute('fill', color);

        puntoResultado.addEventListener('mouseenter', () => {
            tSemana.textContent = w.week;
            tObjetivo.textContent = `${w.objetivo} ${kpi.subtitulo}`;
            tResultado.textContent = `${w.resultado} ${kpi.subtitulo}`;
            tooltip.style.opacity = '1';
            posicionarTooltip(cx, cy);
        });
        puntoResultado.addEventListener('mousemove', () => posicionarTooltip(cx, cy));
        puntoResultado.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });

        svg.appendChild(puntoResultado);
    });

    // --- Etiquetas de semana en el eje horizontal ---
    weeks.forEach((w, i) => {
        const etiqueta = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        etiqueta.setAttribute('x', xFor(i));
        etiqueta.setAttribute('y', height - 2);
        etiqueta.setAttribute('text-anchor', 'middle');
        etiqueta.setAttribute('class', 'linea-doble-week-label');
        etiqueta.textContent = w.week.replace('Semana ', 'S');
        svg.appendChild(etiqueta);
    });

    function posicionarTooltip(cx, cy) {
        const svgRect = svg.getBoundingClientRect();
        const scaleX = svgRect.width / width;
        const scaleY = svgRect.height / height;
        tooltip.style.left = `${cx * scaleX}px`;
        tooltip.style.top = `${cy * scaleY}px`;
    }
}

// Dibuja los 5 KPIs del gráfico de doble línea. Se llama desde
// grafico_de_lineas.js al hacer clic en el botón "Resultado" del toggle,
// y también cada vez que cambian los filtros (ver más abajo).
function renderTodosLosKpisDobleLinea() {
    KPIS_DOBLE_LINEA.forEach(renderGraficoDobleLinea);
}

// ===========================================================================
// FILTRO POR SEMANA EN TIEMPO REAL
// ===========================================================================
// Igual que hace grafico_de_lineas.js: si cambian los filtros Y el modo
// "Resultado" es el que está activo en este momento, volvemos a dibujar.
// (Si el modo activo fuera "% Cumplimiento", este archivo no necesita
// hacer nada — ese gráfico lo maneja por su cuenta grafico_de_lineas.js).
document.addEventListener('filtrosCambiados', () => {
    const botonActivo = document.querySelector('.toggle-modo-btn.is-active');
    const modoActivo = botonActivo ? botonActivo.dataset.modo : 'cumplimiento';
    if (modoActivo === 'resultado') {
        renderTodosLosKpisDobleLinea();
    }
});
