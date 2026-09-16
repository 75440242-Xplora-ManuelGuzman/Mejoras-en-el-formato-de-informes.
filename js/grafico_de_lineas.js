// ===========================================================================
// VIEWBOX ADAPTADO AL TAMAÑO REAL DEL CONTENEDOR
// ===========================================================================
// PROBLEMA QUE ESTO SOLUCIONA: el <svg> de cada gráfico usa
// preserveAspectRatio="none" (se estira libremente para llenar su caja),
// y antes usaba un sistema de coordenadas fijo de 600×32 unidades — una
// proporción MUY achatada (como una regla delgadita).
//
// Eso funcionaba bien en escritorio porque ahí .area-grafico-linea
// también es igual de achatada. Pero en celular esa misma caja mide
// mucho más alta en proporción a su ancho (ver el "MODO CELULAR" en
// grafico_de_lineas.css). Al estirar un círculo dibujado en un sistema
// de coordenadas achatado (600×32) para que llene una caja mucho menos
// achatada, el círculo se estira sin control en el eje vertical — y dejó
// de verse como un punto para verse como una raya vertical.
//
// LA SOLUCIÓN: en vez de un alto fijo (32), calculamos el alto "virtual"
// del viewBox EN EL MOMENTO de dibujar, tomando el tamaño REAL que el
// navegador ya le dio al <svg> (getBoundingClientRect). Así, la
// proporción del sistema de coordenadas SIEMPRE coincide con la
// proporción real en pantalla, sea celular, laptop o TV — y un círculo
// dibujado ahí siempre se ve como un círculo, nunca deformado.
function calcularViewBoxAdaptado(svg) {
    const width = 600; // ancho "virtual" de referencia — arbitrario, siempre igual
    const rect = svg.getBoundingClientRect();

    // Proporción real (alto/ancho) del contenedor en este momento. Si por
    // algún motivo todavía no tiene tamaño (ej. está oculto), usamos de
    // respaldo la proporción achatada original (32/600) para no dividir por 0.
    let proporcion = (rect.width > 0 && rect.height > 0) ? (rect.height / rect.width) : (32 / 600);

    // Red de seguridad extra: si por cualquier motivo la medición diera un
    // resultado disparatado (ej. un navegador raro, o el elemento medido
    // en un instante de layout inestable), esto evita que el gráfico se
    // vea absurdamente alto o absurdamente aplastado. 0.02 a 1.2 cubre
    // cómodamente tanto el escritorio (~0.05) como el celular (~0.35-0.4).
    proporcion = Math.min(Math.max(proporcion, 0.02), 1.2);

    const height = width * proporcion; // alto "virtual", ya con la proporción correcta
    const padX = width * 0.017;        // ~10 unidades cuando width=600 (igual que antes)
    const padY = height * 0.125;       // misma proporción que el padY=4 original (4/32)

    // scaleX y scaleY salen siempre IGUALES (por construcción, ya que
    // height = width * proporcion), así que cualquier círculo dibujado
    // con el mismo radio en X y en Y se renderiza siempre como un
    // círculo perfecto, nunca como una elipse.
    const scale = rect.width > 0 ? (rect.width / width) : 1;

    return { width, height, padX, padY, scale };
}

function renderKPI(cardId, config) {
    const card = document.getElementById(cardId);
    if (!card) return;

    const { title, subtitle, goal, weeks, format } = config;

    card.querySelector('[data-field="title"]').textContent = title;
    card.querySelector('[data-field="subtitle"]').textContent = subtitle;

    // ===========================================================
    // NÚMERO GRANDE FINAL (modo "Resultado")
    // ===========================================================
    // Este número YA NO SE CALCULA (antes era un promedio de las 6
    // semanas). Ahora es 100% manual: se escribe directamente en
    // config.resultado.texto (puede ser cualquier texto: "113 TM",
    // "18PP", "N/D", lo que sea).
    //
    // El COLOR sigue siendo automático (verde/naranja/rojo), pero ahora
    // se basa en config.resultado.colorValor: un número del 0 al 100+
    // que tú eliges para indicar "qué tan bien va" ese KPI. No tiene
    // que coincidir con el texto — es solo la "nota" que decide el color.
    // Umbrales (ver función colorSegunPorcentaje más abajo):
    //   >= 80 -> verde   |   50-79 -> naranja   |   < 50 -> rojo
    //
    // ESTE MISMO COLOR también se usa para pintar la línea y los puntos
    // del gráfico de abajo, así que sigue siendo un indicador visual
    // fuerte, tal como antes.
    // ===========================================================
    const color = colorSegunPorcentaje(config.resultado.colorValor);

    const avgEl = card.querySelector('[data-field="avg"]');
    avgEl.textContent = config.resultado.texto;
    avgEl.style.color = color;

    const svg = card.querySelector('.svg-grafico-linea');
    const tooltip = card.querySelector('.tooltip-grafico-linea');
    const tWeek = tooltip.querySelector('.semana-grafico-linea');
    const tValue = tooltip.querySelector('.valor-grafico-linea');

    // Limpia cualquier dibujo previo (necesario porque esta función se puede
    // volver a llamar al cambiar del modo "% Cumplimiento" de vuelta a "Resultado")
    svg.innerHTML = '';

    // Ver calcularViewBoxAdaptado() más arriba: el alto del viewBox ya NO
    // es un número fijo (antes: 32) — se calcula según la proporción REAL
    // del contenedor en este momento, para que los puntos no se deformen.
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

    const xFor = (i) => padX + (i / (weeks.length - 1)) * drawW;
    const yFor = (v) => padY + drawH - ((v - scaleMin) / (scaleMax - scaleMin)) * drawH;
    const yGoal = yFor(goal);

    const goalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    goalLine.setAttribute('x1', padX);
    goalLine.setAttribute('y1', yGoal);
    goalLine.setAttribute('x2', width - padX);
    goalLine.setAttribute('y2', yGoal);
    goalLine.setAttribute('stroke', '#111');
    goalLine.setAttribute('stroke-width', '1'); // Reducido de 1.2
    goalLine.setAttribute('stroke-dasharray', '4 3');
    goalLine.setAttribute('opacity', '0.7');
    svg.appendChild(goalLine);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = weeks.map((w, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(w.value).toFixed(2)}`).join(' ');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '1.5'); // Línea más delgada, reducida de 2
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);

    // Radio del punto: en vez de un número fijo en unidades "virtuales"
    // (que se vería más grande o más chico según la proporción/ancho real
    // de cada pantalla), lo calculamos para que el punto mida SIEMPRE
    // ~4px reales en cualquier dispositivo (celular, laptop, TV).
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
        let mostrarSubtitulo = true; // El subtítulo (ej. "%") solo se agrega si el valor no lo trae ya incluido
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

const kpi1Data = {
    title: 'SELL OUT (SO)',
    subtitle: 'TM',
    goal: 110,
    format: 'toneladas',

    // ===========================================================
    // NÚMERO GRANDE FINAL — 100% manual (ver explicación completa
    // arriba de la función renderKPI). Edita solo "texto" y "colorValor".
    //   resultado      -> se usa cuando el toggle está en "Resultado"
    //   cumplimiento   -> se usa cuando el toggle está en "% Cumplimiento"
    // colorValor es un número 0-100 (o más) que solo decide el color:
    //   >= 80 verde | 50-79 naranja | < 50 rojo
    // ===========================================================
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
    // metaEsTecho: true -> significa que la meta es un "techo" que NO se
    // quiere superar (a diferencia de la mayoría de KPIs, donde superar
    // la meta es bueno). Se usa en el modo "% Cumplimiento" para calcular
    // el % de cada semana correctamente (ver calcularCumplimientoSemana).
    //metaEsTecho: true,

    // NÚMERO GRANDE FINAL — 100% manual (ver kpi1Data para la explicación completa)
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

    // NÚMERO GRANDE FINAL — 100% manual (ver kpi1Data para la explicación completa)
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

    // NÚMERO GRANDE FINAL — 100% manual (ver kpi1Data para la explicación completa)
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

    // NÚMERO GRANDE FINAL — 100% manual (ver kpi1Data para la explicación completa)
    resultado:    { texto: '85Pts', colorValor: 100 },
    cumplimiento: { texto: '100%',  colorValor: 100 },

    weeks: [
      { week: 'Semana 1', value: 78 }, { week: 'Semana 2', value: 82 },
      { week: 'Semana 3', value: 88 }, { week: 'Semana 4', value: 85 },
      { week: 'Semana 5', value: 90 }, { week: 'Semana 6', value: 87 }
    ]
};

// ===========================================================================
// MODO "% CUMPLIMIENTO": gráfico de barras
// ===========================================================================
// Dibuja, para cada semana, una barra cuya altura representa el % de
// cumplimiento respecto a la meta de esa semana (0% a 100%+). El color de
// cada barra (verde/naranja/rojo) depende de ese mismo %, usando los mismos
// 3 umbrales que el resto del dashboard: >=80 verde, 50-79 naranja, <50 rojo.
//
// Reutiliza el MISMO <svg> y el MISMO tooltip que el modo "Resultado" (por
// eso primero limpia el svg con innerHTML = ''), así que no necesitó nada
// nuevo en el HTML: la tarjeta es la misma, solo cambia lo que hay adentro.
// ===========================================================================

function calcularCumplimientoSemana(valor, meta, config) {
    // Los KPIs cuyo "value" YA es un porcentaje (format: 'percent') usan
    // ese mismo valor como % de cumplimiento de la semana (ej. Eficiencia
    // de Inversión y Participación: si value=76, esa semana cumplió 76%).
    if (config.format === 'percent') return valor;

    // Los KPIs donde un valor MÁS BAJO es mejor (ej. BRECHA) deben marcar
    // config.metaEsTecho = true (ver kpi2Data más abajo). Ahí el
    // cumplimiento mide "qué tan por debajo de la meta-techo te quedaste".
    if (config.metaEsTecho) {
      return Math.max(0, ((meta - valor) / meta) * 100);
    }

    // Caso general (ej. SELL OUT, NPS): cumplimiento = valor logrado / meta.
    return (valor / meta) * 100;
}

// Convierte un número 0-100(+) en uno de los 3 colores del dashboard.
// Se usa en varios lugares: el color de cada punto/línea individual del
// modo "% Cumplimiento", Y el color del número grande final de ambos
// modos (ver config.resultado.colorValor / config.cumplimiento.colorValor
// en cada kpiXData más arriba).
//
// ⚠️ OJO: esta función SOLO controla los colores del gráfico de líneas
// grande (Resultado / % Cumplimiento). Las 5 tarjetas KPI de arriba
// (las que giran al hacer clic/hover) tienen su PROPIO sistema de color,
// independiente de este — ver UMBRAL_EXITO/UMBRAL_ADVERTENCIA en KPI.js.
//
// CÓMO CAMBIAR EL COLOR DE UN KPI ACÁ:
// Edita el número "colorValor" de su resultado/cumplimiento más arriba
// (ej. kpi1Data.resultado.colorValor). No tiene que coincidir con el
// texto mostrado — es solo la "nota" que decide el color.
//
// CÓMO CAMBIAR LOS UMBRALES (80 / 50) DE ESTE GRÁFICO:
// Cambia los números directamente acá abajo. Afecta a los 5 KPIs del
// gráfico de líneas a la vez (no afecta a las tarjetas de arriba).
function colorSegunPorcentaje(porcentaje) {
    if (porcentaje >= 80) return '#1e5c3a'; // Verde
    if (porcentaje >= 50) return '#eab308'; // Naranja
    return '#dc2626';                       // Rojo
}

// ===========================================================================
// MODO "% CUMPLIMIENTO": gráfico de LÍNEAS (igual estilo que "Resultado"),
// con la meta (100%) siempre EXACTAMENTE AL CENTRO de cada tarjeta
// ===========================================================================
// A diferencia del modo "Resultado" (donde la línea de meta va donde le
// corresponda según los valores reales), acá la meta representa un valor
// FIJO conceptual: 100% de cumplimiento. Por eso, en vez de calcular su
// posición como una más, la ANCLAMOS al centro vertical del gráfico
// (yCentro = mitad exacta del alto disponible) y luego calibramos la
// escala de los puntos ALREDEDOR de ese centro:
//   - Automático: la escala se recalcula CADA VEZ que se llama a esta
//     función, a partir del cumplimiento real de esa semana — si cambias
//     los datos de una semana, la próxima vez que se dibuje el gráfico
//     (ej. al togglear entre modos) la calibración se ajusta sola.
//   - Simétrico: si la semana con más desvío respecto al 100% se aleja,
//     por ejemplo, 30 puntos porcentuales (70% o 130%), esos 30 puntos
//     ocupan la misma distancia vertical hacia arriba que hacia abajo.
//     Así, cualquier semana >= 100% cae SIEMPRE por encima de la línea
//     de meta, y cualquier semana < 100% cae SIEMPRE por debajo — nunca
//     al revés, sin importar los valores.
// ===========================================================================

function renderLineaCumplimiento(cardId, config) {
    const card = document.getElementById(cardId);
    if (!card) return;

    const { title, subtitle, goal, weeks } = config;

    card.querySelector('[data-field="title"]').textContent = title;
    card.querySelector('[data-field="subtitle"]').textContent = subtitle;

    // El número grande final y su color siguen siendo 100% manuales
    // (ver config.cumplimiento.texto/colorValor — misma lógica que
    // renderKPI usa para el modo "Resultado", explicada más arriba).
    const color = colorSegunPorcentaje(config.cumplimiento.colorValor);
    const avgEl = card.querySelector('[data-field="avg"]');
    avgEl.textContent = config.cumplimiento.texto;
    avgEl.style.color = color;

    const svg = card.querySelector('.svg-grafico-linea');
    const tooltip = card.querySelector('.tooltip-grafico-linea');
    const tWeek = tooltip.querySelector('.semana-grafico-linea');
    const tValue = tooltip.querySelector('.valor-grafico-linea');

    svg.innerHTML = ''; // Limpia lo que haya dibujado el modo "Resultado"

    // Mismo viewBox adaptado al tamaño real que usa renderKPI (evita que
    // los puntos se deformen en pantallas con proporciones distintas).
    const { width, height, padX, padY, scale } = calcularViewBoxAdaptado(svg);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const drawW = width - padX * 2;
    const drawH = height - padY * 2;

    // % de cumplimiento de cada semana (misma función que usaba el modo
    // de barras — el CÁLCULO del cumplimiento no cambió, solo cómo se dibuja).
    const cumplimientos = weeks.map(w => calcularCumplimientoSemana(w.value, goal, config));

    // --- AQUÍ ESTÁ LA CALIBRACIÓN AUTOMÁTICA ---
    // yCentro: el 100% SIEMPRE va exactamente a la mitad del alto disponible.
    const yCentro = padY + drawH / 2;

    // Cuánto se aleja del 100% la semana MÁS extrema (en cualquier
    // dirección). Un mínimo de 10 evita una escala absurdamente
    // "amplificada" cuando todas las semanas están casi en el 100%.
    const desvioMaximo = Math.max(...cumplimientos.map(c => Math.abs(c - 100)), 10);

    // Buffer del 30% extra para que el punto más extremo no quede pegado
    // al borde superior/inferior de la tarjeta.
    const escalaDesvio = desvioMaximo * 1.3;

    // A más cumplimiento, MENOR "y" (más arriba en pantalla) — por eso se
    // resta. Con esto, >=100% cae arriba de yCentro y <100% cae debajo,
    // siempre, automáticamente.
    const yFor = (c) => yCentro - ((c - 100) / escalaDesvio) * (drawH / 2);

    // Línea de meta: SIEMPRE al centro exacto (ya no se calcula con yFor,
    // porque conceptualmente el 100% ESTÁ definido como el centro mismo).
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

    const xFor = (i) => padX + (i / (weeks.length - 1)) * drawW;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = cumplimientos.map((c, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(c).toFixed(2)}`).join(' ');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);

    // Mismo radio "adaptado" que el modo Resultado: ~4px reales siempre,
    // sin importar el tamaño de pantalla (ver calcularViewBoxAdaptado).
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
// REGISTRO DE KPIS + TOGGLE "Resultado" / "% Cumplimiento"
// ===========================================================================
// Este array es la única lista "maestra" de qué tarjeta (id) usa qué datos.
// PARA AGREGAR UN 6TO KPI EN EL FUTURO:
//   1. Agrega su bloque HTML en index.html (copiando una tarjeta existente)
//   2. Crea su "kpi6Data" más arriba, junto a los demás
//   3. Agrégalo aquí abajo: { id: 'kpi6-grafico-linea', data: kpi6Data }
// Con eso, el toggle Resultado/% Cumplimiento ya lo va a incluir solo.
// ===========================================================================
const CONFIGURACION_KPIS_GRAFICO_LINEA = [
  { id: 'kpi1-grafico-linea', data: kpi1Data },
  { id: 'kpi2-grafico-linea', data: kpi2Data },
  { id: 'kpi3-grafico-linea', data: kpi3Data },
  { id: 'kpi4-grafico-linea', data: kpi4Data },
  { id: 'kpi5-grafico-linea', data: kpi5Data }
];

// Dibuja las 5 tarjetas en el modo indicado ('resultado' o 'cumplimiento')
function renderTodosLosKPIs(modo) {
  CONFIGURACION_KPIS_GRAFICO_LINEA.forEach(({ id, data }) => {
    if (modo === 'cumplimiento') {
      renderLineaCumplimiento(id, data);
    } else {
      renderKPI(id, data);
    }
  });
}

// Conecta los botones .toggle-modo-btn (ver index.html) con renderTodosLosKPIs
function inicializarToggleModoVisualizacion() {
  const botones = document.querySelectorAll('.toggle-modo-btn');
  if (botones.length === 0) return; // Por si el toggle no existe en el HTML

  botones.forEach(boton => {
    boton.addEventListener('click', () => {
      const modo = boton.dataset.modo; // 'resultado' o 'cumplimiento'

      botones.forEach(b => b.classList.remove('is-active'));
      boton.classList.add('is-active');

      renderTodosLosKPIs(modo);
    });
  });
}

// --- Arranque inicial: se dibuja en modo "cumplimiento" (ahora es el
//     modo por defecto al cargar la página, ver el toggle en index.html) ---
renderTodosLosKPIs('cumplimiento');
inicializarToggleModoVisualizacion();