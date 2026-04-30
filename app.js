// Lógica de MBL Arg - V. 1.0

const config = {
    officialStream: "https://www.twitch.tv/mblarg_oficial",
    planAliadoTime: 2 * 60 * 60 * 1000, // 2 horas
    planKageTime: 4 * 60 * 60 * 1000,   // 4 horas
};

// Función para inyectar Stream dinámicamente
function injectMedia(url) {
    const container = document.getElementById('live-stream-container');
    if(url) {
        container.innerHTML = `<iframe src="${url}" frameborder="0" allowfullscreen></iframe>`;
    } else {
        container.innerHTML = `<iframe src="${config.officialStream}" frameborder="0" allowfullscreen></iframe>`;
    }
}

// Simulación de verificación de tiempo de reserva
function checkReservationSession() {
    const activeSession = JSON.parse(localStorage.getItem('active_session'));
    
    if (activeSession) {
        const now = new Date().getTime();
        if (now < activeSession.endTime) {
            console.log("Sesión de Organizador Activa");
            injectMedia(activeSession.streamUrl);
        } else {
            console.log("Sesión Expirada - Volviendo a oficial");
            localStorage.removeItem('active_session');
            injectMedia(null);
        }
    } else {
        injectMedia(null);
    }
}

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
    checkReservationSession();
    // Chequeo cada 1 minuto para revertir si el tiempo acaba
    setInterval(checkReservationSession, 60000);
});

function requestSong() {
    const link = document.getElementById('yt-link').value;
    if(link.includes('youtube.com')) {
        alert("Redirigiendo a Mercado Pago para confirmar tu Battle Beat...");
        // Aquí iría el link de checkout de Mercado Pago
    } else {
        alert("Por favor ingresa un link válido de YouTube.");
    }
}
