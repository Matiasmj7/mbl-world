document.addEventListener('DOMContentLoaded', () => {
    
    // 1. FUNCIONALIDAD DE LOS BOTONES DE FILTRO EN TORNEOS
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Quitar clase active a todos
            filterBtns.forEach(b => b.classList.remove('active'));
            // Agregar clase active al clickeado
            btn.classList.add('active');
        });
    });

    // 2. SISTEMA PARA CREAR TORNEOS DESDE EL PANEL ADMIN
    const formCrearTorneo = document.getElementById('form-crear-torneo');
    const contenedorTorneos = document.getElementById('contenedor-torneos');

    if (formCrearTorneo) {
        formCrearTorneo.addEventListener('submit', function(e) {
            e.preventDefault(); // Evita que la página recargue

            // Obtenemos los valores que escribiste
            const nombre = document.getElementById('admin-torneo-nombre').value;
            const formato = document.getElementById('admin-torneo-formato').value;
            const fecha = document.getElementById('admin-torneo-fecha').value;
            const cupos = document.getElementById('admin-torneo-cupos').value;

            // Creamos la nueva tarjeta (HTML)
            const nuevaTarjetaHTML = `
                <div class="torneo-card" style="border-color: var(--success-green);">
                    <div class="torneo-badge oficial">Oficial y Gratuito</div>
                    <div class="torneo-formato">Formato ${formato}</div>
                    <h3>${nombre}</h3>
                    <div class="torneo-info">
                        <p><i class="fas fa-calendar-alt"></i> ${fecha}</p>
                        <p><i class="fas fa-users"></i> Cupos: 0/${cupos}</p>
                        <p><i class="fas fa-trophy"></i> Premio: Sorpresa Kage</p>
                    </div>
                    <button class="btn-submit btn-torneo" onclick="alert('Inscripción gratuita confirmada.')">Inscribirse Gratis</button>
                </div>
            `;

            // La inyectamos al principio de la sección Torneos
            contenedorTorneos.insertAdjacentHTML('afterbegin', nuevaTarjetaHTML);

            // Limpiamos el formulario y avisamos
            formCrearTorneo.reset();
            alert(`¡El torneo oficial "${nombre}" ha sido publicado en La Arena exitosamente!`);
            
            // Llevamos la pantalla hacia arriba para que veas el torneo creado
            window.location.hash = '#torneos';
        });
    }
});
