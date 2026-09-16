// ===========================================================================
// CARRUSEL DE EVIDENCIAS — LOOP INFINITO
// ===========================================================================
// Genérico: recorre TODOS los elementos .carousel de la página (podrías
// tener varios carruseles en el futuro) y arma solo, según cuántas
// .carousel-slide encuentre dentro, el loop infinito, los puntos de
// navegación (si corresponde) y el comportamiento de las flechas.
//
// ---------------------------------------------------------------------
// CÓMO AGREGAR / QUITAR / CAMBIAR UNA IMAGEN (no hay que tocar este
// archivo para nada de esto — todo se hace en index.html):
// ---------------------------------------------------------------------
//   AGREGAR una imagen nueva:
//     1. Ve a index.html, busca el carrusel de evidencias
//        (<ul class="carousel-track">).
//     2. Copia un bloque completo <li class="carousel-slide">...</li>
//        (con su <div class="carousel-item"><img></div> y su
//        <div class="carousel-caption">).
//     3. Pégalo dentro del mismo <ul>, cambia el "src" de la imagen y
//        el texto de la leyenda (nombre del PDV / ciudad · canal).
//     Este script detecta la nueva foto solo (recalcula el loop y las
//     posiciones automáticamente) — no hay que tocar nada más.
//
//   QUITAR una imagen: borra su <li class="carousel-slide">...</li>
//     completo de index.html. También automático.
//
//   CAMBIAR una imagen o su leyenda: dentro de su <li>, cambia el
//     "src"/"alt" del <img>, y el texto del <strong> y del <span> de
//     su <div class="carousel-caption">.
//
//   CUÁNTAS FOTOS SE VEN A LA VEZ: el atributo data-visible del
//     <div class="carousel"> en index.html (ej. data-visible="3").
//     En celular siempre se fuerza a 1, sin importar ese número (ver
//     más abajo, es más fácil de ver en pantalla angosta).
//
//   PUNTOS DE NAVEGACIÓN (opcionales): si el HTML de un carrusel no
//     tiene un <div class="carousel-dots"> adentro, este script
//     simplemente no genera puntos (el carrusel de evidencias solo usa
//     flechas). Si sí existe ese div, los genera automáticamente.
// ---------------------------------------------------------------------
//
// CÓMO FUNCIONA EL LOOP INFINITO (para quien mantenga este código):
// Antes, al llegar a la última foto, la flecha "siguiente" hacía un
// salto brusco de vuelta al principio — se sentía como un "corte".
// La solución (técnica estándar de carruseles infinitos) es CLONAR
// algunas fotos del principio y pegarlas al final (y viceversa), para
// que el carrusel pueda seguir deslizándose MÁS ALLÁ de la última foto
// real, entrando a un territorio de "fotos clonadas" idénticas a las
// primeras. En el instante en que termina esa animación (evento
// "transitionend"), saltamos SIN ANIMACIÓN a la posición real
// equivalente — el usuario nunca ve ese salto, porque ocurre cuando
// la foto ya está completamente quieta y visualmente es indistinguible
// de seguir donde estaba. Así, el carrusel "da toda la vuelta" sin
// cortes, en cualquier dirección, indefinidamente.
// ===========================================================================

const INTERVALO_AUTOPLAY_MS = 5000; // Cambia a null para desactivar el autoplay

function inicializarCarrusel(carousel) {
    const track = carousel.querySelector('.carousel-track');
    const slidesOriginales = Array.from(carousel.querySelectorAll('.carousel-slide'));
    const btnPrev = carousel.querySelector('.carousel-btn--prev');
    const btnNext = carousel.querySelector('.carousel-btn--next');
    const contenedorDots = carousel.querySelector('.carousel-dots');

    if (!track || slidesOriginales.length === 0) return;

    const numOriginales = slidesOriginales.length;

    // Cuántas fotos se ven al mismo tiempo (por defecto 1, si el HTML no
    // trae data-visible). Se lo pasamos también al CSS como variable,
    // para que .carousel-slide calcule su ancho automáticamente.
    //
    // En celular (mismo punto de quiebre 768px que el resto del proyecto,
    // ver styles.css) siempre se fuerza a 1 foto a la vez, sin importar
    // lo que diga data-visible — varias fotos chiquitas en una pantalla
    // angosta se ven demasiado pequeñas para distinguir bien la leyenda.
    const esCelular = window.innerWidth <= 768;
    const visibles = esCelular ? 1 : Math.max(parseInt(carousel.dataset.visible, 10) || 1, 1);
    carousel.style.setProperty('--carousel-visibles', visibles);

    // --- CLONADO PARA EL LOOP INFINITO ---
    // Solo tiene sentido clonar si hay MÁS fotos reales que fotos
    // visibles a la vez (si no, ya se ven todas juntas y no hay nada
    // que "recorrer"). "offset" es cuántos clones hay al principio del
    // track — sirve para traducir entre "posición en el track" (que
    // incluye clones) y "número de foto real".
    const hayLoop = numOriginales > visibles;
    const offset = hayLoop ? visibles : 0;

    if (hayLoop) {
        const clonesParaElFinal = slidesOriginales.slice(0, visibles).map(s => s.cloneNode(true));
        const clonesParaElPrincipio = slidesOriginales.slice(-visibles).map(s => s.cloneNode(true));

        clonesParaElFinal.forEach(clon => track.appendChild(clon));
        // Se insertan en orden inverso para que, tras insertarlos uno a
        // uno al PRINCIPIO, terminen en el orden original.
        clonesParaElPrincipio.reverse().forEach(clon => track.insertBefore(clon, track.firstChild));
    }

    // Arrancamos mostrando las fotos reales (después de los clones
    // iniciales, si los hay).
    let indiceActual = offset;
    let temporizador = null;
    let animando = false; // evita "atropellar" una animación en curso con otro clic

    // --- Puntos de navegación (opcionales) — uno por CADA FOTO REAL,
    // sin contar los clones. Solo se generan si el HTML trae un
    // contenedor .carousel-dots. ---
    const dots = contenedorDots ? slidesOriginales.map((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Ir a la imagen ${i + 1}`);
        dot.addEventListener('click', () => { irAIndiceReal(i); reiniciarAutoplay(); });
        contenedorDots.appendChild(dot);
        return dot;
    }) : [];

    function moverTrack(indice, conAnimacion) {
        // Si conAnimacion es false, quitamos momentáneamente la
        // transición del CSS para que el salto sea instantáneo e
        // invisible, y la reactivamos enseguida para el próximo
        // movimiento normal.
        track.style.transition = conAnimacion ? '' : 'none';
        track.style.transform = `translateX(-${indice * (100 / visibles)}%)`;
        if (!conAnimacion) {
            track.offsetHeight; // fuerza al navegador a aplicar el salto YA, antes de reactivar la animación
            track.style.transition = '';
        }
    }

    function actualizarDots() {
        if (dots.length === 0) return;
        // Traduce la posición actual del track (que incluye clones) al
        // número de foto real que corresponde, para saber qué punto
        // encender.
        const indiceReal = ((indiceActual - offset) % numOriginales + numOriginales) % numOriginales;
        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === indiceReal));
    }

    function moverPaso(direccion) {
        if (!hayLoop) return;    // no hay nada que recorrer: todas las fotos ya se ven a la vez
        if (animando) return;    // ignora clics mientras ya se está deslizando
        indiceActual += direccion;
        animando = true;
        moverTrack(indiceActual, true);
        actualizarDots();
    }

    // Al terminar cada deslizamiento: si nos "pasamos" al territorio de
    // los clones (antes del primero o después del último real), saltamos
    // sin animar a la posición real equivalente — invisible para el ojo.
    track.addEventListener('transitionend', () => {
        animando = false;
        if (!hayLoop) return;

        if (indiceActual >= offset + numOriginales) {
            indiceActual -= numOriginales;
            moverTrack(indiceActual, false);
        } else if (indiceActual < offset) {
            indiceActual += numOriginales;
            moverTrack(indiceActual, false);
        }
    });

    function siguiente() { moverPaso(1); }
    function anterior() { moverPaso(-1); }

    // Ir directo a una foto real puntual (usado por los puntos de
    // navegación, cuando existen).
    function irAIndiceReal(i) {
        if (!hayLoop) return; // no hay nada que recorrer: todas las fotos ya se ven a la vez
        if (animando) return;
        indiceActual = offset + i;
        animando = true;
        moverTrack(indiceActual, true);
        actualizarDots();
    }

    // --- Controles ---
    if (btnNext) btnNext.addEventListener('click', () => { siguiente(); reiniciarAutoplay(); });
    if (btnPrev) btnPrev.addEventListener('click', () => { anterior(); reiniciarAutoplay(); });

    // --- Autoplay (opcional, se pausa al pasar el mouse) ---
    function iniciarAutoplay() {
        if (INTERVALO_AUTOPLAY_MS && numOriginales > 1) {
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
    moverTrack(indiceActual, false); // sin animación: es la posición de arranque, no un movimiento del usuario
    actualizarDots();
    iniciarAutoplay();
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.carousel').forEach(inicializarCarrusel);
});
