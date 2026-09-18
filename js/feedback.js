  (function () {
            const feedbacks = [
                {
                    tipo: 'positivo',
                    texto: 'Excelente cumplimiento en la actividad de reposición de góndolas. El equipo demostró compromiso y logró superar la meta semanal.',
                    autor: 'Supervisor Regional',
                    fecha: 'Semana 20 · 15/05/2025',
                    tag: 'Positivo'
                },
                {
                    tipo: 'negativo',
                    texto: 'Se detectaron inconsistencias en el registro de inventario durante la última visita. Es necesario reforzar el procedimiento de conteo.',
                    autor: 'Auditor de Campo',
                    fecha: 'Semana 19 · 08/05/2025',
                    tag: 'Negativo'
                },
                {
                    tipo: 'sugerencia',
                    texto: 'Sugerimos capacitar al equipo en técnicas de exhibición visual para mejorar el impacto en punto de venta y aumentar el sell out.',
                    autor: 'Coordinador de Trade',
                    fecha: 'Semana 18 · 01/05/2025',
                    tag: 'Sugerencia'
                },
                {
                    tipo: 'positivo',
                    texto: 'Muy buena ejecución en la activación de promociones. Los PDVs visitados reflejaron correctamente los materiales de campaña.',
                    autor: 'Jefe de Zona',
                    fecha: 'Semana 17 · 24/04/2025',
                    tag: 'Positivo'
                },
                {
                    tipo: 'info',
                    texto: 'Recordatorio: a partir de la próxima semana se implementará el nuevo formato de reporte de visitas. Revisar el manual actualizado.',
                    autor: 'Gerencia de Operaciones',
                    fecha: 'Semana 16 · 17/04/2025',
                    tag: 'Informativo'
                }
            ];

            const iconos = {
                positivo: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>',
                negativo: '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
                sugerencia: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"></path><line x1="9" y1="21" x2="15" y2="21"></line></svg>',
                info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
            };

            const track = document.getElementById('feedbackTrack');
            const dotsContainer = document.getElementById('feedbackDots');
            const btnPrev = document.querySelector('.feedback-btn-prev');
            const btnNext = document.querySelector('.feedback-btn-next');
            const card = document.getElementById('feedbackCard');

            let currentIndex = 0;
            let touchStartX = 0;
            let touchEndX = 0;

            function renderSlides() {
                track.innerHTML = feedbacks.map((f) => `
                    <div class="feedback-slide">
                        <div class="feedback-icon ${f.tipo}">
                            ${iconos[f.tipo] || iconos.info}
                        </div>
                        <div class="feedback-content">
                            <p class="feedback-text">${f.texto}</p>
                            <div class="feedback-meta">
                                <span class="feedback-author">${f.autor}</span>
                                <span class="feedback-tag ${f.tipo}">${f.tag}</span>
                                <span>${f.fecha}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            function renderDots() {
                dotsContainer.innerHTML = feedbacks.map((_, i) => `
                    <button class="feedback-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Ir al feedback ${i + 1}"></button>
                `).join('');

                dotsContainer.querySelectorAll('.feedback-dot').forEach((dot) => {
                    dot.addEventListener('click', () => {
                        goToSlide(parseInt(dot.dataset.index, 10));
                    });
                });
            }

            function updateView() {
                track.style.transform = `translateX(-${currentIndex * 100}%)`;

                dotsContainer.querySelectorAll('.feedback-dot').forEach((dot, i) => {
                    dot.classList.toggle('active', i === currentIndex);
                });

                // CARRUSEL INFINITO: Nunca deshabilitar los botones
                btnPrev.disabled = false;
                btnNext.disabled = false;
            }

            // CARRUSEL INFINITO: Navegación cíclica
            function goToSlide(index) {
                if (index < 0) {
                    // Si va antes del primero, ir al último
                    currentIndex = feedbacks.length - 1;
                } else if (index >= feedbacks.length) {
                    // Si va después del último, ir al primero
                    currentIndex = 0;
                } else {
                    currentIndex = index;
                }
                updateView();
            }

            btnPrev.addEventListener('click', () => {
                goToSlide(currentIndex - 1);
            });
            
            btnNext.addEventListener('click', () => {
                goToSlide(currentIndex + 1);
            });

            card.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            card.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const diff = touchStartX - touchEndX;
                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        goToSlide(currentIndex + 1); // Swipe izquierda: siguiente
                    } else {
                        goToSlide(currentIndex - 1); // Swipe derecha: anterior
                    }
                }
            }, { passive: true });

            card.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    goToSlide(currentIndex - 1);
                }
                if (e.key === 'ArrowRight') {
                    goToSlide(currentIndex + 1);
                }
            });
            card.setAttribute('tabindex', '0');

            renderSlides();
            renderDots();
            updateView();
        })();