document.addEventListener('DOMContentLoaded', () => {
    
    // 1. FUNCIONALIDAD BOTONES STREAM
    const platBtns = document.querySelectorAll('.plat-btn');
    const mainStream = document.getElementById('main-stream');

    const streamLinks = {
        'twitch': 'https://player.twitch.tv/?channel=matias_mj7&parent=matiasmj7.github.io', 
        'youtube': 'https://www.youtube.com/embed/live_stream?channel=UCUZHFZ9jIKrLroW8LcyJEQQ',
        'kick': 'https://player.kick.com/matias_mj7', 
        'tiktok': 'https://www.tiktok.com/embed/v2/6949015180630658309' 
    };

    platBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            platBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if(btn.classList.contains('twitch')) mainStream.src = streamLinks.twitch;
            if(btn.classList.contains('youtube')) mainStream.src = streamLinks.youtube;
            if(btn.classList.contains('kick')) mainStream.src = streamLinks.kick;
            if(btn.classList.contains('tiktok')) mainStream.src = streamLinks.tiktok;
        });
    });

    // 2. SISTEMA DE FILTROS 
    const filterBtns = document.querySelectorAll('.filter-btn');
    const torneosCards = document.querySelectorAll('.torneo-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filtroSeleccionado = btn.getAttribute('data-filter');

            torneosCards.forEach(card => {
                const formatoTarjeta = card.getAttribute('data-formato');
                if (filtroSeleccionado === 'todos' || formatoTarjeta === filtroSeleccionado) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // 3. CREADOR DE TORNEOS ADMIN 
    const formCrearTorneo = document.getElementById('form-crear-torneo');
    const contenedorTorneos = document.getElementById('contenedor-torneos');

    if (formCrearTorneo) {
        formCrearTorneo.addEventListener('submit', function(e) {
            e.preventDefault();
            const nombre = document.getElementById('admin-torneo-nombre').value;
            const formato = document.getElementById('admin-torneo-formato').value;

            const nuevaTarjetaHTML = `
                <div class="torneo-card" data-formato="${formato}" style="border-color: var(--success-green);">
                    <div class="torneo-badge oficial">Oficial / Gratis</div>
                    <div class="torneo-formato format-${formato}">${formato.toUpperCase()}</div>
                    <h3>${nombre}</h3>
                    <div class="torneo-info">
                        <p><i class="fas fa-calendar-alt"></i> Próximamente</p>
                        <p><i class="fas fa-users"></i> Inscripción Abierta</p>
                    </div>
                    <button class="btn-submit btn-torneo" style="background: var(--success-green); color: black;">Inscribirse Gratis</button>
                </div>
            `;

            contenedorTorneos.insertAdjacentHTML('afterbegin', nuevaTarjetaHTML);
            formCrearTorneo.reset();
            alert(`¡Torneo "${nombre}" publicado!`);
            window.location.hash = '#torneos';
        });
    }

    // --- NUEVO: FUNCIONALIDAD DEL CHAT DE LA TABERNA ---
    const chatInput = document.getElementById('chat-input-text');
    const btnSendChat = document.getElementById('btn-send-chat');
    const chatContainer = document.getElementById('chat-messages-container');

    if (btnSendChat && chatInput && chatContainer) {
        // Función para agregar mensaje
        const enviarMensaje = () => {
            const mensaje = chatInput.value.trim();
            if (mensaje !== '') {
                // Obtener hora actual
                const ahora = new Date();
                const hora = ahora.getHours().toString().padStart(2, '0');
                const minutos = ahora.getMinutes().toString().padStart(2, '0');
                const tiempoStr = `[${hora}:${minutos}]`;

                // Crear el elemento HTML del mensaje (te ponemos como usuario para que pruebes)
                const nuevoMensajeHTML = `<div class="msg"><span class="msg-time">${tiempoStr}</span> <strong class="user tank">Tú:</strong> ${mensaje}</div>`;

                // Insertarlo al final de la caja de chat
                chatContainer.insertAdjacentHTML('beforeend', nuevoMensajeHTML);

                // Limpiar la barra de texto
                chatInput.value = '';

                // Hacer que la caja baje automáticamente al último mensaje
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        };

        // Al hacer clic en el botón de enviar
        btnSendChat.addEventListener('click', enviarMensaje);

        // Al presionar la tecla Enter
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                enviarMensaje();
            }
        });
    }
});

// --- FUNCIONES DE TABLA ADMIN ---

function aprobarSuscripcion(btn, nick) {
    if(confirm(`¿Estás seguro de APROBAR la suscripción de ${nick}?`)) {
        const row = btn.closest('tr');
        row.querySelector('.status-col').innerHTML = '<span class="rank-tag jonin" style="background: var(--rasengan-blue);">ACTIVO</span>';
        row.querySelector('.actions-col').innerHTML = '<button class="btn-reject" onclick="revocarSuscripcion(this, \''+nick+'\')"><i class="fas fa-stop-circle"></i> Revocar</button>';
        alert(`Suscripción de ${nick} activada.`);
    }
}

function rechazarSuscripcion(btn, nick) {
    if(confirm(`¿Estás seguro de RECHAZAR la solicitud de ${nick}?`)) {
        const row = btn.closest('tr');
        row.remove(); 
        alert(`Solicitud de ${nick} rechazada.`);
    }
}

function revocarSuscripcion(btn, nick) {
    if(confirm(`¿ATENCIÓN: Estás seguro de REVOCAR el plan activo de ${nick}? Volverá a estar pendiente.`)) {
        const row = btn.closest('tr');
        row.querySelector('.status-col').innerHTML = '<span class="rank-tag jonin" style="background: #444;">PENDIENTE</span>';
        row.querySelector('.actions-col').innerHTML = `
            <button class="btn-approve" onclick="aprobarSuscripcion(this, '${nick}')"><i class="fas fa-check"></i> Aprobar</button>
            <button class="btn-reject" onclick="rechazarSuscripcion(this, '${nick}')"><i class="fas fa-times"></i> Rechazar</button>
        `;
        alert(`Plan de ${nick} revocado.`);
    }
}
