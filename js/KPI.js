// ===========================================================
// KPI CARDS — Lógica de estado y barra de progreso
//
// Este script es genérico: recorre TODAS las .kpi-card que
// existan en la página (sin importar cuántas sean) y, según
// el atributo data-compliance de cada una, decide:
//   - qué color de estado usar (verde / naranja / rojo)
//   - qué tan llena debe verse la barra de progreso
//
// Para agregar una tarjeta nueva en el futuro solo hace falta
// escribir el HTML con su propio data-compliance="XX".
// No hay que tocar este archivo.
// ===========================================================

// Umbrales de cumplimiento (ajústalos aquí si cambian las reglas de negocio)
const UMBRAL_EXITO = 80;      // >= 80%  -> verde
const UMBRAL_ADVERTENCIA = 50; // 50-79% -> naranja
                                // < 50%  -> rojo

function calcularEstado(porcentaje) {
    if (porcentaje >= UMBRAL_EXITO) return 'status-success';
    if (porcentaje >= UMBRAL_ADVERTENCIA) return 'status-warning';
    return 'status-danger';
}

function inicializarKpiCards() {
    const tarjetas = document.querySelectorAll('.kpi-card');

    tarjetas.forEach(tarjeta => {
        const porcentaje = parseFloat(tarjeta.dataset.compliance);

        // Si la tarjeta no trae un data-compliance válido, se ignora
        if (isNaN(porcentaje)) return;

        // 1. Aplicar la clase de color correspondiente
        const estado = calcularEstado(porcentaje);
        tarjeta.classList.add(estado);

        // 2. Rellenar la barra de progreso (tope visual en 100%,
        //    aunque el cumplimiento real sea mayor, ej. 103%)
        const barra = tarjeta.querySelector('.kpi-progress-bar');
        if (barra) {
            const anchoVisual = Math.min(porcentaje, 100);
            // Pequeño retraso para que la transición de CSS sea visible
            requestAnimationFrame(() => {
                barra.style.width = anchoVisual + '%';
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', inicializarKpiCards);