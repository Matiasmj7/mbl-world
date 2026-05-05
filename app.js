document.addEventListener('DOMContentLoaded', () => {
    
    // 1. FUNCIONALIDAD BOTONES STREAM (YA ARREGLADO)
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

    // 2. SISTEMA DE FILTROS (YA ARREGLADO)
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

    // 3. CREADOR DE TORNEOS ADMIN (YA ARREGLADO)
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
});

// --- NUEVAS FUNCIONES PARA GESTIÓN DE SUSCRIPCIONES (ADMIN) ---

// Función para APROBAR una solicitud pendiente
function aprobarSuscripcion(btn, nick) {
    if(confirm(`¿Estás seguro de APROBAR la suscripción de ${nick}?`)) {
        // Buscamos la fila de la tabla
        const row = btn.closest('tr');
        // Cambiamos la columna de estado
        row.querySelector('.status-col').innerHTML = '<span class="rank-tag jonin" style="background: var(--rasengan-blue);">ACTIVO</span>';
        // Cambiamos los botones de acción
        row.querySelector('.actions-col').innerHTML = '<button class="btn-reject" onclick="revocarSuscripcion(this, \''+nick+'\')"><i class="fas fa-stop-circle"></i> Revocar</button>';
        alert(`Suscripción de ${nick} activada.`);
    }
}

// Función para RECHAZAR una solicitud pendiente (borra la fila)
function rechazarSuscripcion(btn, nick) {
    if(confirm(`¿Estás seguro de RECHAZAR la solicitud de ${nick}?`)) {
        const row = btn.closest('tr');
        row.remove(); // Borramos la fila de la tabla
        alert(`Solicitud de ${nick} rechazada.`);
    }
}

// Función para REVOCAR un plan ya activo
function revocarSuscripcion(btn, nick) {
    if(confirm(`¿ATENCIÓN: Estás seguro de REVOCAR el plan activo de ${nick}? Volverá a estar pendiente.`)) {
        const row = btn.closest('tr');
        // Volvemos el estado a PENDIENTE
        row.querySelector('.status-col').innerHTML = '<span class="rank-tag jonin" style="background: #444;">PENDIENTE</span>';
        // Volvemos a poner los botones de Aprobar/Rechazar
        row.querySelector('.actions-col').innerHTML = `
            <button class="btn-approve" onclick="aprobarSuscripcion(this, '${nick}')"><i class="fas fa-check"></i> Aprobar</button>
            <button class="btn-reject" onclick="rechazarSuscripcion(this, '${nick}')"><i class="fas fa-times"></i> Rechazar</button>
        `;
        alert(`Plan de ${nick} revocado.`);
    }
}
