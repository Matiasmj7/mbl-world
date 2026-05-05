document.addEventListener('DOMContentLoaded', () => {
    
    // STREAM
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

    // FILTROS DE TORNEOS 
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

    // CREADOR DE TORNEOS ADMIN (AHORA INCLUYE EL PREMIO Y LOS 2 BOTONES)
    const formCrearTorneo = document.getElementById('form-crear-torneo');
    const contenedorTorneos = document.getElementById('contenedor-torneos');

    if (formCrearTorneo) {
        formCrearTorneo.addEventListener('submit', function(e) {
            e.preventDefault();
            const nombre = document.getElementById('admin-torneo-nombre').value;
            const formato = document.getElementById('admin-torneo-formato').value;
            const fecha = document.getElementById('admin-torneo-fecha').value;
            const cupos = document.getElementById('admin-torneo-cupos').value;
            
            // Si el admin no escribe premio, le ponemos "A definir" por defecto
            let premioIngresado = document.getElementById('admin-torneo-premio').value;
            const premio = premioIngresado.trim() === '' ? 'A definir' : premioIngresado;

            const nuevaTarjetaHTML = `
                <div class="torneo-card" data-formato="${formato}" style="border-color: var(--success-green);">
                    <div class="torneo-badge oficial">Oficial / Gratis</div>
                    <div class="torneo-formato format-${formato}">${formato.toUpperCase()}</div>
                    <h3>${nombre}</h3>
                    <div class="torneo-info">
                        <p><i class="fas fa-calendar-alt"></i> ${fecha}</p>
                        <p><i class="fas fa-users"></i> Cupos: 0/${cupos} Inscriptos</p>
                        <p><i class="fas fa-trophy"></i> Premio: ${premio}</p>
                    </div>
                    <button class="btn-submit btn-torneo" style="background: var(--success-green); color: black;" onclick="alert('¡Inscripción exitosa! Preparate para la batalla.')">Inscribirse Gratis</button>
                    <a href="#modal-bracket" class="btn-chidori btn-torneo" style="margin-top: 10px; display: block; text-align: center;"><i class="fas fa-sitemap"></i> Ver Llaves</a>
                </div>
            `;

            contenedorTorneos.insertAdjacentHTML('afterbegin', nuevaTarjetaHTML);
            formCrearTorneo.reset();
            alert(`¡Torneo "${nombre}" publicado en la Arena!`);
            window.location.hash = '#torneos';
        });
    }

    // CHAT DE LA TABERNA
    const chatInput = document.getElementById('chat-input-text');
    const btnSendChat = document.getElementById('btn-send-chat');
    const chatContainer = document.getElementById('chat-messages-container');

    if (btnSendChat && chatInput && chatContainer) {
        const enviarMensaje = () => {
            const mensaje = chatInput.value.trim();
            if (mensaje !== '') {
                const ahora = new Date();
                const hora = ahora.getHours().toString().padStart(2, '0');
                const minutos = ahora.getMinutes().toString().padStart(2, '0');
                const tiempoStr = `[${hora}:${minutos}]`;

                const nuevoMensajeHTML = `<div class="msg"><span class="msg-time">${tiempoStr}</span> <strong class="user tank">Tú:</strong> ${mensaje}</div>`;

                chatContainer.insertAdjacentHTML('beforeend', nuevoMensajeHTML);
                chatInput.value = '';
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        };

        btnSendChat.addEventListener('click', enviarMensaje);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                enviarMensaje();
            }
        });
    }
});

// --- FUNCIONES BRACKET (LLAVES) ---
function avanzarJugador(elementoClickeado, idDestino) {
    const nombreJugador = elementoClickeado.innerText;
    if (nombreJugador === '-' || nombreJugador === '?') return;

    const cajaDestino = document.getElementById(idDestino);
    cajaDestino.innerText = nombreJugador;
    cajaDestino.classList.remove('empty');
    
    // Restablecer color de los dos competidores de la celda y pintar de verde al ganador
    elementoClickeado.parentElement.querySelectorAll('.player').forEach(p => p.style.color = 'white');
    elementoClickeado.style.color = 'var(--success-green)';
}

// --- TABLA ADMIN (SUSCRIPCIONES) ---
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
    if(confirm(`¿Estás seguro de REVOCAR el plan activo de ${nick}?`)) {
        const row = btn.closest('tr');
        row.querySelector('.status-col').innerHTML = '<span class="rank-tag jonin" style="background: #444;">PENDIENTE</span>';
        row.querySelector('.actions-col').innerHTML = `
            <button class="btn-approve" onclick="aprobarSuscripcion(this, '${nick}')"><i class="fas fa-check"></i> Aprobar</button>
            <button class="btn-reject" onclick="rechazarSuscripcion(this, '${nick}')"><i class="fas fa-times"></i> Rechazar</button>
        `;
        alert(`Plan de ${nick} revocado.`);
    }
}
