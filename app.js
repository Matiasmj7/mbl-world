// --- 1. CONFIGURACIÓN DE FIREBASE (Con tus datos) ---
const firebaseConfig = {
  apiKey: "AIzaSyBEsnLlMgiQVie9MXrKL4dhQ2m23tv34kg",
  authDomain: "mblarg-94390.firebaseapp.com",
  projectId: "mblarg-94390",
  storageBucket: "mblarg-94390.firebasestorage.app",
  messagingSenderId: "308094247977",
  appId: "1:308094247977:web:cef31ccf807f732f5ce838"
};

// Inicializamos Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Variable para guardar el nombre de quién está logueado
let usuarioActual = "Ninja Anónimo";

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 2. SISTEMA DE LOGIN Y USUARIOS ---
    
    // Escuchar si alguien inicia sesión
    auth.onAuthStateChanged(user => {
        const btnLoginSuperior = document.querySelector('.btn-login');
        if(user) {
            // Si tiene nombre en Google lo usa, si no, usa la primera parte de su email
            usuarioActual = user.displayName || user.email.split('@')[0];
            btnLoginSuperior.innerText = usuarioActual; // Cambia "Ingresar" por su nombre
            btnLoginSuperior.href = "#"; // Evita que se abra el modal si ya está logueado
        } else {
            usuarioActual = "Ninja Anónimo";
            btnLoginSuperior.innerText = "Ingresar";
            btnLoginSuperior.href = "#modal-login";
        }
    });

    // Login con Google
    const btnGoogle = document.getElementById('btn-login-google');
    if(btnGoogle) {
        btnGoogle.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).then(res => {
                alert(`¡Bienvenido a la aldea, ${res.user.displayName || res.user.email}!`);
                window.location.hash = '#'; // Cierra la ventana emergente
            }).catch(err => alert("Error al entrar con Google: " + err.message));
        });
    }

    // Login / Registro con Correo y Contraseña
    const formLoginEmail = document.getElementById('form-login-email');
    if(formLoginEmail) {
        formLoginEmail.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;
            
            // Intenta loguear. Si no existe la cuenta, la crea.
            auth.signInWithEmailAndPassword(email, pass)
                .then(res => {
                    alert(`¡Bienvenido de vuelta ninja!`);
                    window.location.hash = '#';
                })
                .catch(err => {
                    // Si el error es que no existe (user-not-found), creamos la cuenta automáticamente
                    auth.createUserWithEmailAndPassword(email, pass)
                        .then(res => {
                            alert(`¡Cuenta creada con éxito! Bienvenido a la arena.`);
                            window.location.hash = '#';
                        })
                        .catch(errorRegistro => alert("Error: La contraseña debe tener al menos 6 caracteres."));
                });
        });
    }


    // --- 3. STREAM HUB ---
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


    // --- 4. FILTROS DE TORNEOS ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filtroSeleccionado = btn.getAttribute('data-filter');
            const torneosCards = document.querySelectorAll('.torneo-card'); // Buscamos todas las tarjetas actuales

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


    // --- 5. CREADOR DE TORNEOS (CONECTADO A LA NUBE) ---
    const formCrearTorneo = document.getElementById('form-crear-torneo');
    if (formCrearTorneo) {
        formCrearTorneo.addEventListener('submit', function(e) {
            e.preventDefault();
            const nombre = document.getElementById('admin-torneo-nombre').value;
            const formato = document.getElementById('admin-torneo-formato').value;
            const fecha = document.getElementById('admin-torneo-fecha').value;
            const cupos = document.getElementById('admin-torneo-cupos').value;
            
            let premioIngresado = document.getElementById('admin-torneo-premio').value;
            const premio = premioIngresado.trim() === '' ? 'A definir' : premioIngresado;

            // Guardamos en la base de datos de Firebase
            db.collection('torneos').add({
                nombre: nombre,
                formato: formato,
                fecha: fecha,
                cuposTotales: cupos,
                premio: premio,
                timestamp: firebase.firestore.FieldValue.serverTimestamp() // Guarda la hora exacta de creación
            }).then(() => {
                formCrearTorneo.reset();
                alert(`¡El Torneo "${nombre}" se ha subido a la nube y ya es público en la Arena!`);
                window.location.hash = '#torneos';
            }).catch(error => alert("Error al crear el torneo: " + error.message));
        });
    }

    // LECTOR DE TORNEOS EN LA NUBE (Muestra los torneos que creaste en Firebase)
    const contenedorTorneos = document.getElementById('contenedor-torneos');
    if(contenedorTorneos) {
        db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
            // Este código se ejecuta cada vez que creas un torneo nuevo
            snapshot.docChanges().forEach(change => {
                if (change.type === "added") {
                    const data = change.doc.data();
                    const nuevaTarjetaHTML = `
                        <div class="torneo-card" data-formato="${data.formato}" style="border-color: var(--success-green);">
                            <div class="torneo-badge oficial">Oficial / Gratis</div>
                            <div class="torneo-formato format-${data.formato}">${data.formato.toUpperCase()}</div>
                            <h3>${data.nombre}</h3>
                            <div class="torneo-info">
                                <p><i class="fas fa-calendar-alt"></i> ${data.fecha}</p>
                                <p><i class="fas fa-users"></i> Cupos: 0/${data.cuposTotales} Inscriptos</p>
                                <p><i class="fas fa-trophy"></i> Premio: ${data.premio}</p>
                            </div>
                            <button class="btn-submit btn-torneo" style="background: var(--success-green); color: black;" onclick="alert('¡Inscripción exitosa! Preparate para la batalla.')">Inscribirse Gratis</button>
                            <a href="#modal-bracket" class="btn-chidori btn-torneo" style="margin-top: 10px; display: block; text-align: center;"><i class="fas fa-sitemap"></i> Ver Llaves</a>
                        </div>
                    `;
                    // Inyecta el torneo nuevo al principio de la lista
                    contenedorTorneos.insertAdjacentHTML('afterbegin', nuevaTarjetaHTML);
                }
            });
        });
    }


    // --- 6. CHAT DE LA TABERNA (CONECTADO A LA NUBE) ---
    const chatInput = document.getElementById('chat-input-text');
    const btnSendChat = document.getElementById('btn-send-chat');
    const chatContainer = document.getElementById('chat-messages-container');

    if (btnSendChat && chatInput && chatContainer) {
        
        // Guardar mensaje en la base de datos
        const enviarMensaje = () => {
            const mensaje = chatInput.value.trim();
            if (mensaje !== '') {
                db.collection('taberna').add({
                    usuario: usuarioActual,
                    texto: mensaje,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                chatInput.value = ''; // Limpiar barra
            }
        };

        btnSendChat.addEventListener('click', enviarMensaje);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') enviarMensaje();
        });

        // Leer mensajes de la base de datos EN VIVO
        db.collection('taberna').orderBy('timestamp').onSnapshot(snapshot => {
            // Limpiamos los mensajes viejos y dejamos el de bienvenida
            chatContainer.innerHTML = '<div class="msg"><span class="msg-time">[Sistema]</span> <strong class="user kage">Admin Matías:</strong> ¡La base de datos está conectada! Ya pueden hablar.</div>';
            
            snapshot.forEach(doc => {
                const data = doc.data();
                // Calcular la hora
                let tiempoStr = "...";
                if(data.timestamp) {
                    const date = data.timestamp.toDate();
                    tiempoStr = `[${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}]`;
                }

                // Definir color del nombre si sos vos el que habla
                let colorClase = (data.usuario === "Ninja Anónimo") ? "user" : "user tank";
                
                const mensajeHTML = `<div class="msg"><span class="msg-time">${tiempoStr}</span> <strong class="${colorClase}">${data.usuario}:</strong> ${data.texto}</div>`;
                chatContainer.innerHTML += mensajeHTML;
            });

            // Bajar la barra de scroll al último mensaje
            chatContainer.scrollTop = chatContainer.scrollHeight;
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
    
    elementoClickeado.parentElement.querySelectorAll('.player').forEach(p => p.style.color = 'white');
    elementoClickeado.style.color = 'var(--success-green)';
}

// --- TABLA ADMIN (SUSCRIPCIONES) VISUALES ---
function aprobarSuscripcion(btn, nick) {
    if(confirm(`¿Estás seguro de APROBAR la suscripción de ${nick}?`)) {
        const row = btn.closest('tr');
        row.querySelector('.status-col').innerHTML = '<span class="rank-tag jonin" style="background: var(--rasengan-blue);">ACTIVO</span>';
        row.querySelector('.actions-col').innerHTML = '<button class="btn-reject" onclick="revocarSuscripcion(this, \''+nick+'\')"><i class="fas fa-stop-circle"></i> Revocar</button>';
    }
}

function rechazarSuscripcion(btn, nick) {
    if(confirm(`¿Estás seguro de RECHAZAR la solicitud de ${nick}?`)) {
        btn.closest('tr').remove(); 
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
    }
}
