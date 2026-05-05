// ==========================================
// MBL ARG - CEREBRO DE LA ALDEA (LÓGICA)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

    // 1. NAVEGACIÓN SUAVE (SCROLL)
    const links = document.querySelectorAll('.nav-links a, .cta-buttons a, .close-modal');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            // Solo actuar si el enlace es a una sección de esta misma página (empieza con #)
            if (link.getAttribute('href').startsWith('#')) {
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    e.preventDefault();
                    window.scrollTo({
                        top: targetSection.offsetTop - 70, // Ajuste por la barra de navegación fija
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // 2. FILTROS DE LA ARENA (TORNEOS)
    const torneoFilters = document.querySelectorAll('#torneos .filter-btn');
    const torneoCards = document.querySelectorAll('.torneo-card');

    torneoFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            // Cambiar botón activo
            torneoFilters.forEach(f => f.classList.remove('active'));
            btn.classList.add('active');

            const filtro = btn.textContent.trim(); // "Todos", "1v1", "2v2", "5v5"

            // Mostrar u ocultar tarjetas
            torneoCards.forEach(card => {
                const formato = card.querySelector('.torneo-formato').textContent.trim();
                
                if (filtro === 'Todos') {
                    card.style.display = 'block';
                } else {
                    // Si el texto del formato (ej: "1 VS 1") contiene el número del filtro (ej: "1")
                    if (formato.includes(filtro.charAt(0))) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        });
    });

    // 3. STREAM HUB (VISIÓN DEL BYAKUGAN) - CAMBIO DE PLATAFORMAS
    const platBtns = document.querySelectorAll('.plat-btn');
    const mainStream = document.getElementById('main-stream');

    // Enlaces de prueba (Aquí luego pondrás los tuyos reales)
    const streamLinks = {
        twitch: "https://player.twitch.tv/?channel=mobilelegendses&parent=" + window.location.hostname,
        youtube: "https://www.youtube.com/embed/live_stream?channel=UCUZHFZ9jIKrLroW8LcyJEQQ",
        kick: "https://player.kick.com/mobilelegends",
        tiktok: "https://www.tiktok.com/embed", // TikTok requiere configuración extra usualmente
        facebook: "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fmobilelegendsgame%2Fvideos"
    };

    platBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            platBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Cambiar el video según la clase del botón
            if (btn.classList.contains('twitch')) mainStream.src = streamLinks.twitch;
            if (btn.classList.contains('youtube')) mainStream.src = streamLinks.youtube;
            if (btn.classList.contains('kick')) mainStream.src = streamLinks.kick;
            if (btn.classList.contains('tiktok')) mainStream.src = streamLinks.tiktok;
            if (btn.classList.contains('facebook')) mainStream.src = streamLinks.facebook;
        });
    });

    // 4. FORMULARIOS (BINGO Y ABISMO) - SIMULADOR DE ENVÍO
    const bingoForm = document.getElementById('bingo-form');
    const uploadForm = document.getElementById('upload-media');

    if(bingoForm) {
        bingoForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Evita que la página se recargue
            alert('¡Pergamino enviado! El Kage revisará tu solicitud para el Libro Bingo en breve.');
            bingoForm.reset(); // Limpia los campos
        });
    }

    if(uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('¡Archivo subido al Abismo! Tu jugada será compartida con la aldea pronto.');
            uploadForm.reset();
        });
    }

    // 5. CHAT GLOBAL (TABERNA) - SIMULADOR EN TIEMPO REAL
    const chatInput = document.querySelector('.chat-input input');
    const btnSend = document.querySelector('.btn-send');
    const chatMessages = document.querySelector('.chat-messages');

    function sendMessage() {
        const text = chatInput.value.trim();
        if (text !== '') {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Crear el nuevo mensaje
            const newMsg = document.createElement('div');
            newMsg.className = 'msg';
            newMsg.innerHTML = `<span class="msg-time">[${time}]</span> <strong class="user kage">Matías:</strong> ${text}`;
            
            // Agregarlo a la caja y hacer scroll hacia abajo
            chatMessages.appendChild(newMsg);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Limpiar input
            chatInput.value = '';
        }
    }

    if(btnSend && chatInput) {
        btnSend.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // 6. PANEL DE CONTROL (KAGE ADMIN) - ACCIONES DE TABLAS
    // Botones de Aprobar (Check verde o Activar Plan)
    const btnApprove = document.querySelectorAll('.btn-approve');
    btnApprove.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            alert('¡Acción aprobada exitosamente! Permisos concedidos.');
            if(row) row.remove(); // Elimina la fila de la tabla
            actualizarContadores();
        });
    });

    // Botones de Rechazar / Revocar (Cruz gris o Stop)
    const btnReject = document.querySelectorAll('.btn-reject');
    btnReject.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const confirmacion = confirm('¿Estás seguro de revocar/rechazar esta solicitud?');
            if (confirmacion && row) {
                row.remove();
                actualizarContadores();
            }
        });
    });

    // Botón de Desterrar (BAN rojo)
    const btnBan = document.querySelectorAll('.btn-ban');
    btnBan.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const nick = row.querySelector('td:first-child').textContent;
            const confirmacion = confirm(`¡ATENCIÓN! ¿Estás seguro de desterrar definitivamente al jugador ${nick}?`);
            if (confirmacion && row) {
                alert(`El ninja ${nick} ha sido desterrado de la aldea.`);
                row.remove();
                actualizarContadores();
            }
        });
    });

    // Función para simular el cambio de números en el Admin
    function actualizarContadores() {
        const pendingCard = document.querySelector('.stat-card.pending p');
        if(pendingCard) {
            let currentNum = parseInt(pendingCard.textContent);
            if(currentNum > 0) pendingCard.textContent = currentNum - 1;
        }
    }

    // 7. BOTONES DE "ME GUSTA" EN LA GALERÍA
    const btnLikes = document.querySelectorAll('.btn-like');
    btnLikes.forEach(btn => {
        btn.addEventListener('click', () => {
            let currentLikes = parseInt(btn.textContent.trim());
            
            // Si ya le dio like (si tiene color invertido), se lo sacamos. Si no, le sumamos.
            if (btn.style.backgroundColor === 'var(--susanoo-red)') {
                btn.style.backgroundColor = 'transparent';
                btn.style.color = 'var(--susanoo-red)';
                btn.innerHTML = `<i class="fas fa-fire"></i> ${currentLikes - 1}`;
            } else {
                btn.style.backgroundColor = 'var(--susanoo-red)';
                btn.style.color = 'white';
                btn.innerHTML = `<i class="fas fa-fire"></i> ${currentLikes + 1}`;
            }
        });
    });

});
