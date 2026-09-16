// ===========================================================
// INSIGHTS DE LA SEMANA
//
// Cada insight vive en este objeto de datos. Para agregar,
// quitar o editar un insight en el futuro, solo modifica
// este objeto — no hace falta tocar el HTML ni el CSS.
//
// Estructura de cada insight:
//   tono:   'danger' | 'warning' | 'success'  (define el color)
//   icono:  el símbolo que se muestra en el círculo del detalle
//   titulo: nombre corto del insight
//   cifras: la(s) cifra(s) clave, ya formateadas como texto
//   texto:  la explicación / recomendación
// ===========================================================

/*
const DATOS_INSIGHTS = {
    brecha: {
        tono: 'danger',
        icono: '!',
        titulo: 'Brecha requiere atención',
        cifras: '48% de cumplimiento · -12 pp vs meta',
        texto: 'Priorizar ejecución en las principales categorías.'
    },
    eficiencia: {
        tono: 'warning',
        icono: '!',
        titulo: 'Eficiencia de inversión aún bajo meta',
        cifras: '78% de cumplimiento · +4 pp vs semana anterior',
        texto: 'Revisar mix de promociones y activaciones.'
    },
    sellout: {
        tono: 'success',
        icono: '↑',
        titulo: 'Sell Out en mejora',
        cifras: '+5 pp vs semana anterior',
        texto: 'Buen desempeño impulsado por activaciones en PDV.'
    },
    nps: {
        tono: 'success',
        icono: '↑',
        titulo: 'NPS supera la meta',
        cifras: '72 pts · +2 pts sobre meta',
        texto: 'Mantener calidad de servicio y experiencia de compra.'
    }
};

function renderizarInsight(clave, contenedorDetalle) {
    const datos = DATOS_INSIGHTS[clave];
    if (!datos) return;

    contenedorDetalle.innerHTML = `
        <div class="insight-detail-content" data-tone="${datos.tono}">
            <div class="insight-detail-icon">${datos.icono}</div>
            <div class="insight-detail-body">
                <h3>${datos.titulo}</h3>
                <div class="insight-detail-stats">${datos.cifras}</div>
                <p>${datos.texto}</p>
            </div>
        </div>
    `;
}

function inicializarInsights() {
    const seccion = document.getElementById('insightsSection');
    if (!seccion) return;

    const botones = seccion.querySelectorAll('.insight-icon-btn');
    const contenedorDetalle = document.getElementById('insightDetail');

    botones.forEach(boton => {
        boton.addEventListener('click', () => {
            const clave = boton.dataset.insight;

            // Marcar visualmente cuál ícono está activo
            botones.forEach(b => b.classList.remove('is-active'));
            boton.classList.add('is-active');

            renderizarInsight(clave, contenedorDetalle);
        });
    });

    // Muestra el primer insight por defecto para que el panel no se vea vacío
    const primerBoton = botones[0];
    if (primerBoton) {
        primerBoton.classList.add('is-active');
        renderizarInsight(primerBoton.dataset.insight, contenedorDetalle);
    }
}

document.addEventListener('DOMContentLoaded', inicializarInsights);
*/

document.addEventListener('DOMContentLoaded', () => {
    const DATOS_INSIGHTS_NUEVO = [
        { tono: 'danger', icono: '!', titulo: 'Brecha requiere atención', cifras: '48% de cumplimiento · -12 pp vs meta', texto: 'Priorizar ejecución en las principales categorías.' },
        { tono: 'warning', icono: '!', titulo: 'Eficiencia de inversión aún bajo meta', cifras: '78% de cumplimiento · +4 pp vs semana anterior', texto: 'Revisar mix de promociones y activaciones.' },
        { tono: 'success', icono: '↑', titulo: 'Sell Out en mejora', cifras: '+5 pp vs semana anterior', texto: 'Buen desempeño impulsado por activaciones en PDV.' },
        { tono: 'success', icono: '↑', titulo: 'NPS supera la meta', cifras: '72 pts · +2 pts sobre meta', texto: 'Mantener calidad de servicio y experiencia de compra.' }
    ];

    let indiceInsight = 0;
    let intervaloInsight;
    const contenedorDetalle = document.getElementById('insightDetail');
            
    function renderizarInsight() {
        if (!contenedorDetalle) return;
        const datos = DATOS_INSIGHTS_NUEVO[indiceInsight];
                
        // Reiniciamos el contenedor brevemente para disparar la animación CSS fluida
        contenedorDetalle.innerHTML = ''; 
        setTimeout(() => {
            contenedorDetalle.innerHTML = `
                <div class="insight-detail-content" data-tone="${datos.tono}">
                    <div class="insight-detail-icon">${datos.icono}</div>
                    <div class="insight-detail-body">
                        <h3>${datos.titulo}</h3>
                        <div class="insight-detail-stats">${datos.cifras}</div>
                        <p>${datos.texto}</p>
                    </div>
                </div>
                `;
            }, 10);
        }

        function rotarSiguiente() {
            indiceInsight = (indiceInsight + 1) % DATOS_INSIGHTS_NUEVO.length;
            renderizarInsight();
        }

        function rotarAnterior() {
            indiceInsight = (indiceInsight - 1 + DATOS_INSIGHTS_NUEVO.length) % DATOS_INSIGHTS_NUEVO.length;
            renderizarInsight();
        }

        function reiniciarIntervalo() {
            clearInterval(intervaloInsight);
            intervaloInsight = setInterval(rotarSiguiente, 4500); // Rota automáticamente cada 4.5 segundos
        }

        document.getElementById('insightNext')?.addEventListener('click', () => {
            rotarSiguiente();
            reiniciarIntervalo(); // Al hacer clic manual, se reinicia el contador de tiempo
        });

        document.getElementById('insightPrev')?.addEventListener('click', () => {
            rotarAnterior();
            reiniciarIntervalo();
        });

        // Arranque inicial
        renderizarInsight();
        reiniciarIntervalo();
    });