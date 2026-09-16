// ===========================================================
// KPI CARDS — Lógica de estado, barra de progreso y animación
// ===========================================================

// Umbrales de cumplimiento
const UMBRAL_EXITO = 80;      // >= 80%  -> verde
const UMBRAL_ADVERTENCIA = 50; // 50-79% -> naranja
                                // < 50%  -> rojo

function calcularEstado(porcentaje) {
    if (porcentaje >= UMBRAL_EXITO) return 'status-success';
    if (porcentaje >= UMBRAL_ADVERTENCIA) return 'status-warning';
    return 'status-danger';
}

// Función para animar el número grande desde 0 hasta el valor final
function animarContador(elemento, valorFinal) {
    let inicio = 0;
    const duracion = 1500; // La animación dura 1.5 segundos
    const startTime = performance.now();

    function actualizar(currentTime) {
        const elapsed = currentTime - startTime;
        const progreso = Math.min(elapsed / duracion, 1);
        
        // Función matemática para que la animación desacelere suavemente al llegar al final (Ease Out)
        const easeOutQuart = 1 - Math.pow(1 - progreso, 4);
        const valorActual = Math.floor(easeOutQuart * valorFinal);

        elemento.textContent = valorActual + '%';

        if (progreso < 1) {
            requestAnimationFrame(actualizar);
        } else {
            elemento.textContent = valorFinal + '%'; // Asegura que quede exactamente en el número final
        }
    }

    requestAnimationFrame(actualizar);
}

function inicializarKpiCards() {
    const tarjetas = document.querySelectorAll('.kpi-card');

    tarjetas.forEach(tarjeta => {
        const porcentaje = parseFloat(tarjeta.dataset.compliance);

        // Si la tarjeta no trae un data-compliance válido, se ignora
        if (isNaN(porcentaje)) return;

        // 1. Aplicar la clase de color correspondiente a la tarjeta
        const estado = calcularEstado(porcentaje);
        tarjeta.classList.add(estado);

        // 2. Rellenar la barra de progreso
        const barra = tarjeta.querySelector('.kpi-progress-bar');
        if (barra) {
            const anchoVisual = Math.min(porcentaje, 100);
            requestAnimationFrame(() => {
                barra.style.width = anchoVisual + '%';
            });
        }

        // 3. Iniciar la animación del número grande
        const valorElemento = tarjeta.querySelector('.kpi-value');
        if (valorElemento) {
            animarContador(valorElemento, porcentaje);
        }
    });
}

document.addEventListener('DOMContentLoaded', inicializarKpiCards);

// ===========================================================
// TAP PARA VOLTEAR (necesario para celular/touch)
// ===========================================================
function inicializarFlipTactil() {
    document.querySelectorAll('.kpi-card').forEach(tarjeta => {
        tarjeta.addEventListener('click', () => {
            tarjeta.classList.toggle('is-flipped');
        });
    });
}

document.addEventListener('DOMContentLoaded', inicializarFlipTactil);