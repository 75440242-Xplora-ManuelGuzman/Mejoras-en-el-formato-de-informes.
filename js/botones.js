// Seleccionamos TODOS los dropdowns de la página, sin importar cuántos haya
const dropdowns = document.querySelectorAll('.dropdown-wrapper');

dropdowns.forEach(wrapper => {
    // Dentro de cada wrapper buscamos SUS propios elementos
    const boton = wrapper.querySelector('.dropdown-btn');
    const valorActual = boton.querySelector('.value');
    const opciones = wrapper.querySelectorAll('.dropdown-item');

    // 1. Abrir/cerrar este menú al hacer clic en su botón
    boton.addEventListener('click', (evento) => {
        evento.stopPropagation(); // Evita que se cierre instantáneamente

        // Cierra los demás dropdowns abiertos (para que no queden 2 abiertos a la vez)
        dropdowns.forEach(otro => {
            if (otro !== wrapper) {
                otro.querySelector('.dropdown-btn').classList.remove('open');
            }
        });

        boton.classList.toggle('open');
    });

    // 2. Al seleccionar una opción, se actualiza el texto y se cierra el menú
    opciones.forEach(opcion => {
        opcion.addEventListener('click', () => {
            valorActual.textContent = opcion.textContent;
            boton.classList.remove('open');
        });
    });
});

// 3. Cerrar cualquier menú abierto si se hace clic fuera del componente
document.addEventListener('click', () => {
    dropdowns.forEach(wrapper => {
        wrapper.querySelector('.dropdown-btn').classList.remove('open');
    });
});