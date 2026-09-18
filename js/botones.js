const dropdowns = document.querySelectorAll('.dropdown-wrapper');

dropdowns.forEach(wrapper => {
    const boton = wrapper.querySelector('.dropdown-btn');
    const valorActual = boton.querySelector('.value');
    const opciones = wrapper.querySelectorAll('.dropdown-item');

    // 1. Abrir/cerrar este menú al hacer clic en su botón
    boton.addEventListener('click', (evento) => {
        evento.stopPropagation();
        dropdowns.forEach(otro => {
            if (otro !== wrapper) {
                otro.querySelector('.dropdown-btn').classList.remove('open');
            }
        });
        boton.classList.toggle('open');
    });

    // 2. Manejo de clics en las opciones
    opciones.forEach(opcion => {
        const checkbox = opcion.querySelector('input[type="checkbox"]');

        if (checkbox) {
            // Si es un filtro múltiple (checkbox), evitamos que se cierre el menú
            opcion.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // Escuchamos el cambio real de la casilla
            checkbox.addEventListener('change', () => {
                actualizarTextoMultiSelect(wrapper);
                // Disparamos una señal global para que los gráficos se enteren
                document.dispatchEvent(new Event('filtrosCambiados'));
            });
        } else {
            // Comportamiento normal para dropdowns simples
            opcion.addEventListener('click', () => {
                valorActual.textContent = opcion.textContent.trim();
                boton.classList.remove('open');
            });
        }
    });
});

// Función para actualizar el subtítulo del botón ("Todas", "Semana 1", "3 selec.")
function actualizarTextoMultiSelect(wrapper) {
    const checkboxes = wrapper.querySelectorAll('input[type="checkbox"]');
    const marcados = Array.from(checkboxes).filter(cb => cb.checked);
    const valorActual = wrapper.querySelector('.value');

    if (marcados.length === checkboxes.length) {
        valorActual.textContent = 'Todas';
    } else if (marcados.length === 0) {
        valorActual.textContent = 'Ninguna';
    } else if (marcados.length === 1) {
        valorActual.textContent = marcados[0].value;
    } else {
        valorActual.textContent = `${marcados.length} selec.`;
    }
}

// 3. Cerrar menús al hacer clic fuera
document.addEventListener('click', () => {
    dropdowns.forEach(wrapper => {
        wrapper.querySelector('.dropdown-btn').classList.remove('open');
    });
});