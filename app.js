document.addEventListener('DOMContentLoaded', () => {
    
    // 1. FUNCIONALIDAD BOTONES STREAM (Visión del Byakugan)
    const platBtns = document.querySelectorAll('.plat-btn');
    const mainStream = document.getElementById('main-stream');

    // Aquí irían los links reales de tus transmisiones más adelante
    const streamLinks = {
        'twitch': 'https://player.twitch.tv/?channel=matias_mj7&parent=localhost', 
        'youtube': 'https://www.youtube.com/embed/live_stream?channel=UCUZHFZ9jIKrLroW8LcyJEQQ',
        'kick': 'https://player.kick.com/matias_mj7', 
        'tiktok': 'https://www.tiktok.com/embed/v2/6949015180630658309' 
    };

    platBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Quitamos la clase 'active' a todos los botones
            platBtns.forEach(b => b.classList.remove('active'));
            // Le agregamos la clase 'active' solo al botón que tocaste
            btn.classList.add('active');
            
            // Cambiamos el video dependiendo del botón
            if(btn.classList.contains('twitch')) mainStream.src = streamLinks.twitch;
            if(btn.classList.contains('youtube')) mainStream.src = streamLinks.youtube;
            if(btn.classList.contains('kick')) mainStream.src = streamLinks.kick;
            if(btn.classList.contains('tiktok')) mainStream.src = streamLinks.tiktok;
        });
    });

    // 2. SISTEMA DE FILTROS REPARADO (Para La Arena de Combate)
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
                    <button class="btn-submit btn-torneo" style="background: var(--success-green); color: black;" onclick="alert('Inscripción gratuita confirmada.')">Inscribirse Gratis</button>
                    <a href="#modal-bracket" class="btn-chidori btn-torneo" style="margin-top: 10px; display: block; text-align: center;"><i class="fas fa-sitemap"></i> Ver Llaves</a>
                </div>
            `;

            contenedorTorneos.insertAdjacentHTML('afterbegin', nuevaTarjetaHTML);
            formCrearTorneo.reset();
            alert(`¡Torneo "${nombre}" publicado!`);
            window.location.hash = '#torneos';
        });
    }
});

// 4. SISTEMA INTERACTIVO DE LLAVES (BRACKETS)
function avanzarJugador(elementoClickeado, idDestino) {
    const nombreJugador = elementoClickeado.innerText;
    if (nombreJugador === '-' || nombreJugador === '?') return;

    const cajaDestino = document.getElementById(idDestino);
    cajaDestino.innerText = nombreJugador;
    cajaDestino.classList.remove('empty');
    
    elementoClickeado.parentElement.querySelectorAll('.player').forEach(p => p.style.color = 'white');
    elementoClickeado.style.color = 'var(--success-green)';
}
