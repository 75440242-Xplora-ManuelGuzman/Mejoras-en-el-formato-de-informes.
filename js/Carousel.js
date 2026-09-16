// ===========================================================
// CARRUSEL DE EVIDENCIAS
//
// Genérico: recorre TODOS los elementos .carousel de la página
// (podrías tener varios carruseles en el futuro) y arma
// solo, según cuántos .carousel-slide encuentre dentro,
// los puntos de navegación y el comportamiento de las flechas.
//
// Para agregar/quitar imágenes en el futuro: solo agrega o
// quita <li class="carousel-slide"><img ...></li> del HTML.
// No hay que tocar este archivo.
// ===========================================================

const INTERVALO_AUTOPLAY_MS = 5000; // Cambia a null para desactivar el autoplay

function inicializarCarrusel(carousel) {
    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    const btnPrev = carousel.querySelector('.carousel-btn--prev');
    const btnNext = carousel.querySelector('.carousel-btn--next');
    const contenedorDots = carousel.querySelector('.carousel-dots');

    if (!track || slides.length === 0) return;

    let indiceActual = 0;
    let temporizador = null;

    // --- Generar los puntos dinámicamente según el número de slides ---
    const dots = slides.map((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Ir a la imagen ${i + 1}`);
        dot.addEventListener('click', () => irASlide(i));
        contenedorDots.appendChild(dot);
        return dot;
    });

    function actualizarVista() {
        track.style.transform = `translateX(-${indiceActual * 100}%)`;
        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === indiceActual));
    }

    function irASlide(indice) {
        // Circular: si te pasas del final, vuelve al inicio (y viceversa)
        indiceActual = (indice + slides.length) % slides.length;
        actualizarVista();
    }

    function siguiente() { irASlide(indiceActual + 1); }
    function anterior() { irASlide(indiceActual - 1); }

    // --- Controles ---
    if (btnNext) btnNext.addEventListener('click', () => { siguiente(); reiniciarAutoplay(); });
    if (btnPrev) btnPrev.addEventListener('click', () => { anterior(); reiniciarAutoplay(); });

    // --- Autoplay (opcional, se pausa al pasar el mouse) ---
    function iniciarAutoplay() {
        if (INTERVALO_AUTOPLAY_MS && slides.length > 1) {
            temporizador = setInterval(siguiente, INTERVALO_AUTOPLAY_MS);
        }
    }

    function detenerAutoplay() {
        if (temporizador) clearInterval(temporizador);
    }

    function reiniciarAutoplay() {
        detenerAutoplay();
        iniciarAutoplay();
    }

    carousel.addEventListener('mouseenter', detenerAutoplay);
    carousel.addEventListener('mouseleave', iniciarAutoplay);

    // --- Estado inicial ---
    actualizarVista();
    iniciarAutoplay();
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.carousel').forEach(inicializarCarrusel);
});