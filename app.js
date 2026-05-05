document.addEventListener('DOMContentLoaded', () => {

    // 1. LA ARENA - Filtros de Torneos Mágicos
    const filterBtns = document.querySelectorAll('#torneos .filter-btn');
    const torneoCards = document.querySelectorAll('.torneo-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Apagamos todos los botones
            filterBtns.forEach(b => b.classList.remove('active'));
            // Encendemos solo el que el usuario tocó
            btn.classList.add('active');

            // Leemos qué dice el botón (ej: "1v1", "5v5", "Todos")
            const filtro = btn.textContent.trim().toLowerCase();

            torneoCards.forEach(card => {
                // Leemos el formato que tiene cada tarjeta de torneo
                const formatoCard = card.querySelector('.torneo-formato').textContent.toLowerCase();
                
                // Si el botón dice "todos" o el texto coincide (ej: "1v1" con "1 VS 1") mostramos la tarjeta
                if (filtro === 'todos' || formatoCard.replace(/\s/g, '').includes(filtro)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none'; // Escondemos las que no coinciden
                }
            });
        });
    });

    // 2. FORMULARIOS - Libro Bingo y Archivos del Abismo
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Evitamos que la página se actualice y vuelva arriba
            alert('¡Pergamino enviado con éxito! El Kage evaluará tu solicitud.');
            form.reset(); // Vaciamos las casillas para que quede limpio
        });
    });

    // 3. PODERES DE ADMIN - Centro de Mando del Kage
    const adminAcciones = document.querySelectorAll('.btn-approve, .btn-reject, .btn-ban');
    adminAcciones.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Buscamos a qué jugador específico le diste clic (la fila de la tabla)
            const fila = e.target.closest('tr');
            if (!fila) return;

            if (btn.classList.contains('btn-approve')) {
                alert('¡Permiso Concedido! El ninja ha sido aprobado y el plan está activo.');
                fila.style.backgroundColor = 'rgba(0, 255, 163, 0.15)'; // Se pinta de verde
            } else if (btn.classList.contains('btn-reject')) {
                alert('Solicitud Rechazada o Permiso Revocado.');
                fila.style.opacity = '0.3'; // Se vuelve gris
            } else if (btn.classList.contains('btn-ban')) {
                alert('¡DESTERRADO! Has expulsado a este jugador de MBL Arg.');
                fila.style.backgroundColor = 'rgba(255, 0, 64, 0.2)'; // Se pinta de rojo Susanoo
                fila.style.opacity = '0.5';
            }
        });
    });

    // 4. STREAM HUB - Cambio de Botones de Plataforma
    const platBtns = document.querySelectorAll('.plat-btn');
    platBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Apaga todos
            platBtns.forEach(b => b.classList.remove('active'));
            // Enciende el tocado
            btn.classList.add('active');
            
            // Aquí a futuro le diremos al reproductor de video que cambie de enlace
        });
    });

    // 5. BOTÓN INGRESAR - Arriba en el menú
    const btnLogin = document.querySelector('.btn-login');
    if(btnLogin) {
        btnLogin.addEventListener('click', () => {
            alert('Próximamente: Sistema de inicio de sesión para Escuadrones.');
        });
    }

});
