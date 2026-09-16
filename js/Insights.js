document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================================================
    // GUÍA PARA AGREGAR, MODIFICAR O ELIMINAR INSIGHTS
    // =========================================================================
    // Todo funciona de manera automática. Para modificar los insights Y que se 
    // generen sus botones correspondientes (con su color y símbolo automático),
    // SOLO debes alterar el arreglo llamado `DATOS_INSIGHTS_NUEVO`.
    // No necesitas tocar HTML ni CSS. El sistema leerá este arreglo y fabricará 
    // la cantidad exacta de botones necesarios.
    //
    // PASOS PARA AGREGAR UN NUEVO INSIGHT:
    // 1. Ve al final de la lista (antes del corchete de cierre ']').
    // 2. Añade una coma `,` al final de la última llave `}`.
    // 3. Pega una nueva línea con la siguiente estructura:
    //    { tono: 'success', icono: '↑', titulo: 'Tu Título', cifras: 'Tus cifras', texto: 'Tu texto' }
    //
    // PASOS PARA ELIMINAR UN INSIGHT:
    // 1. Simplemente borra la línea completa que ya no desees del arreglo.
    //
    // DICCIONARIO DE TONOS (Colores automáticos):
    // - 'danger'  (Rojo - Para problemas, brechas o alertas)
    // - 'warning' (Amarillo/Naranja - Para precauciones o métricas por debajo de meta)
    // - 'success' (Verde - Para metas cumplidas o crecimientos)
    // =========================================================================

    const DATOS_INSIGHTS_NUEVO = [
        { tono: 'danger', icono: '!', titulo: 'Brecha requiere atención', cifras: '48% de cumplimiento · -12 pp vs meta', texto: 'Priorizar ejecución en las principales categorías.' },
        { tono: 'warning', icono: '!', titulo: 'Eficiencia de inversión aún bajo meta', cifras: '78% de cumplimiento · +4 pp vs semana anterior', texto: 'Revisar mix de promociones y activaciones.' },
        { tono: 'success', icono: '↑', titulo: 'Sell Out en mejora', cifras: '+5 pp vs semana anterior', texto: 'Buen desempeño impulsado por activaciones en PDV.' },
        { tono: 'success', icono: '↑', titulo: 'NPS supera la meta', cifras: '72 pts · +2 pts sobre meta', texto: 'Mantener calidad de servicio y experiencia de compra.' }
    ];

    let indiceInsight = 0;
    let intervaloInsight;
    const contenedorDetalle = document.getElementById('insightDetail');
    const contenedorIndicadores = document.getElementById('insightIndicators'); // Div de los botones pequeños
    let botonesIndicadores = []; // Array para guardar las referencias a los botones generados
            
    // 1. GENERAR BOTONES DINÁMICAMENTE BASADOS EN LOS DATOS
    if (contenedorIndicadores) {
        DATOS_INSIGHTS_NUEVO.forEach((datos, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'insight-dot-btn';
            btn.setAttribute('data-tone', datos.tono); // Inyecta el atributo para que CSS le dé el color exacto
            btn.textContent = datos.icono; // Inyecta el ícono (! o ↑)

            // Asignar el evento Click al botón pequeño para viajar a ese insight específico
            btn.addEventListener('click', () => {
                indiceInsight = index;
                renderizarInsight();
                reiniciarIntervalo(); // Resetea el tiempo automático al intervenir manualmente
            });

            contenedorIndicadores.appendChild(btn);
            botonesIndicadores.push(btn);
        });
    }

    // 2. FUNCIÓN PARA DIBUJAR EL INSIGHT EN PANTALLA
    function renderizarInsight() {
        if (!contenedorDetalle) return;
        const datos = DATOS_INSIGHTS_NUEVO[indiceInsight];
                
        // Actualizar el estado visual de los botones pequeños (cuál está iluminado)
        botonesIndicadores.forEach((btn, i) => {
            if (i === indiceInsight) {
                btn.classList.add('is-active');
            } else {
                btn.classList.remove('is-active');
            }
        });

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

    // Funciones de navegación para las flechas laterales (< >)
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
        reiniciarIntervalo(); 
    });

    document.getElementById('insightPrev')?.addEventListener('click', () => {
        rotarAnterior();
        reiniciarIntervalo();
    });

    // Arranque inicial al cargar la web
    renderizarInsight();
    reiniciarIntervalo();
});