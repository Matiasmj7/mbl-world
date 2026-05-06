// CONFIGURACIÓN FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBEsnLlMgiQVie9MXrKL4dhQ2m23tv34kg",
  authDomain: "mblarg-94390.firebaseapp.com",
  projectId: "mblarg-94390",
  storageBucket: "mblarg-94390.firebasestorage.app",
  messagingSenderId: "308094247977",
  appId: "1:308094247977:web:cef31ccf807f732f5ce838"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ACCESO KAGE
const ADMIN_EMAIL = "matias.moto7@gmail.com";
let currentUserName = "Ninja Anónimo";
let currentFilter = 'todos'; 
// Variable para recordar qué plataforma forzó el admin
let kageStreamPlat = 'twitch'; 
let kageStreamUser = 'matias_mj7';

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. ESTADO DE SESIÓN
    auth.onAuthStateChanged(user => {
        const adminNav = document.getElementById('admin-nav');
        const adminSection = document.getElementById('admin');
        const userDisplay = document.getElementById('user-display');
        const userGreeting = document.getElementById('user-greeting');

        if(user) {
            currentUserName = user.displayName || user.email.split('@')[0];
            if(userDisplay) { userDisplay.innerText = currentUserName; userDisplay.href = "#"; }
            if(userGreeting) userGreeting.innerText = currentUserName;

            if(user.email === ADMIN_EMAIL) {
                if(adminNav) adminNav.style.display = 'block';
                if(adminSection) adminSection.style.display = 'block';
            }
        } else {
            currentUserName = "Ninja Anónimo";
            if(userDisplay) { userDisplay.innerText = "Ingresar"; userDisplay.href = "#modal-login"; }
            if(userGreeting) userGreeting.innerText = "Ninja";
            if(adminNav) adminNav.style.display = 'none';
            if(adminSection) adminSection.style.display = 'none';
        }
    });

    // 2. LOGIN GOOGLE
    const loginBtn = document.getElementById('login-google');
    if(loginBtn) {
        loginBtn.addEventListener('click', () => {
            auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(() => window.location.hash = '#');
        });
    }

    // 3. --- LÓGICA DINÁMICA DEL BYAKUGAN (CORREGIDO ERROR TWITCH) ---
    db.collection('configuracion').doc('stream').onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            kageStreamUser = data.usuario;
            kageStreamPlat = data.plataforma;

            // Extraer solo ID/Usuario si pegaron la URL completa
            if (kageStreamUser.includes('twitch.tv/')) kageStreamUser = kageStreamUser.split('twitch.tv/')[1].split('?')[0];
            if (kageStreamUser.includes('kick.com/')) kageStreamUser = kageStreamUser.split('kick.com/')[1].split('?')[0];
            if (kageStreamUser.includes('tiktok.com/@')) kageStreamUser = kageStreamUser.split('@')[1].split('/')[0];
            if (kageStreamUser.includes('youtube.com/watch?v=')) kageStreamUser = kageStreamUser.split('v=')[1].split('&')[0];

            document.getElementById('status-stream').innerText = `SEÑAL ACTUALIZADA POR EL KAGE: ${kageStreamPlat.toUpperCase()}`;
            
            // Forzar carga de la plataforma dictada por el Kage
            cambiarStreamLocal(kageStreamPlat, kageStreamUser);
        } else {
            document.getElementById('status-stream').innerText = "ESPERANDO ÓRDENES DEL KAGE...";
        }
    });

    // GUARDAR NUEVA CONFIGURACIÓN DE STREAM (ADMIN)
    const formConfigStream = document.getElementById('form-config-stream');
    if(formConfigStream) {
        formConfigStream.addEventListener('submit', (e) => {
            e.preventDefault();
            db.collection('configuracion').doc('stream').set({
                plataforma: document.getElementById('stream-plataforma').value,
                usuario: document.getElementById('stream-usuario').value.trim(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => alert("¡Visión del Byakugan Actualizada para toda la aldea!"));
        });
    }

    // 3B. NUEVA PESTAÑA: ASCENDER NINJAS (PAGOS)
    const formAscenso = document.getElementById('form-ascenso');
    if(formAscenso) {
        formAscenso.addEventListener('submit', (e) => {
            e.preventDefault();
            const userAscenso = document.getElementById('p-usuario').value.trim();
            const rangoAscenso = document.getElementById('p-rango').value;
            
            db.collection('usuarios_rango').doc(userAscenso).set({
                rango: rangoAscenso,
                fecha_ascenso: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                formAscenso.reset();
                alert(`¡El ninja ${userAscenso} ha sido ascendido a ${rangoAscenso}!`);
            });
        });
    }

    // CARGAR LISTA DE ASCENDIDOS AL PANEL ADMIN
    db.collection('usuarios_rango').orderBy('fecha_ascenso', 'desc').onSnapshot(snap => {
        const listaRangos = document.getElementById('lista-rangos');
        if(listaRangos) {
            listaRangos.innerHTML = '';
            if(snap.empty) {
                listaRangos.innerHTML = '<p style="color: #666; font-size: 0.8rem;">No hay ninjas con planes activos aún.</p>';
            }
            snap.forEach(doc => {
                const data = doc.data();
                const colorRango = data.rango.includes('Kage') ? 'var(--red)' : 'var(--blue)';
                listaRangos.innerHTML += `
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #333; padding: 8px 0; font-size: 0.9rem;">
                        <strong>${doc.id}</strong>
                        <span style="color: ${colorRango}; font-weight: bold;">${data.rango}</span>
                    </div>
                `;
            });
        }
    });

    // 4. RESTO DE FUNCIONES
    cargarTorneosDesdeNube();
    cargarAnunciosGremio();

    const formT = document.getElementById('form-torneo');
    if(formT) {
        formT.addEventListener('submit', (e) => {
            e.preventDefault();
            db.collection('torneos').add({
                nombre: document.getElementById('t-nombre').value,
                formato: document.getElementById('t-formato').value,
                fecha: document.getElementById('t-fecha').value,
                cuposTotales: parseInt(document.getElementById('t-cupos').value), 
                lista_inscriptos: [], 
                premio: document.getElementById('t-premio').value,
                privado: document.getElementById('t-privado').checked,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => { formT.reset(); alert("Torneo Creado"); });
        });
    }

    const btnSendChat = document.getElementById('btn-send-chat');
    if(btnSendChat) {
        btnSendChat.addEventListener('click', () => {
            const input = document.getElementById('chat-input-text');
            if(input.value.trim() && currentUserName !== "Ninja Anónimo") {
                db.collection('taberna').add({ usuario: currentUserName, texto: input.value.trim(), timestamp: firebase.firestore.FieldValue.serverTimestamp() });
                input.value = '';
            } else if (currentUserName === "Ninja Anónimo") {
                alert("Debes identificarte (Ingresar) para hablar en la Taberna.");
            }
        });
    }

    const chatContainer = document.getElementById('chat-messages-container');
    if(chatContainer) {
        db.collection('taberna').orderBy('timestamp').onSnapshot(snap => {
            chatContainer.innerHTML = '';
            snap.forEach(doc => {
                const d = doc.data();
                const nameColor = (d.usuario === 'Matías') ? 'var(--red)' : 'var(--blue)';
                chatContainer.innerHTML += `<div style="margin-bottom: 8px; border-bottom: 1px solid #111; padding-bottom: 5px;"><strong style="color:${nameColor}; margin-right: 5px;">${d.usuario}:</strong> ${d.texto}</div>`;
            });
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });
    }

    const formAnuncio = document.getElementById('form-anuncio');
    if(formAnuncio) {
        formAnuncio.addEventListener('submit', (e) => {
            e.preventDefault();
            if(currentUserName === "Ninja Anónimo") return;
            db.collection('anuncios_gremio').add({
                usuario: currentUserName, busco: document.getElementById('a-busco').value, soy: document.getElementById('a-soy').value, mensaje: document.getElementById('a-mensaje').value, timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => { formAnuncio.reset(); window.location.hash = '#gremio'; alert("Anuncio publicado."); });
        });
    }

    const videoUpload = document.getElementById('video-upload');
    if(videoUpload) {
        videoUpload.addEventListener('click', (e) => {
            if(currentUserName === "Ninja Anónimo") {
                e.preventDefault();
                alert("Atención: Debes Ingresar a la página para compartir tu jugada.");
                window.location.hash = "#modal-login";
            }
        });
    }
});

// FUNCIONES AUXILIARES
function cerrarSesion() { auth.signOut().then(() => window.location.reload()); }

function abrirModalAnuncio(e) {
    if(e) e.preventDefault();
    if(currentUserName === "Ninja Anónimo") {
        alert("Atención: Debes Ingresar a la página para publicar.");
        window.location.hash = "#modal-login";
    } else {
        window.location.hash = "#modal-anuncio"; 
    }
}

// FUNCIÓN PARA QUE LOS BOTONES CAMBIEN EL STREAM LOCALMENTE
// También arregla el error de conexión de Twitch obteniendo el dominio real
function cambiarStreamLocal(plataforma, usuarioFuerza = null) {
    const iframe = document.getElementById('stream-frame');
    const botones = document.querySelectorAll('.plat-btn');
    
    // Si no se le pasa usuario (es decir, el usuario tocó el botón manualmente),
    // usa el canal que el Admin haya configurado en base de datos.
    const canalAUsar = usuarioFuerza || kageStreamUser;
    
    // Detecta automáticamente en qué dominio web estamos (Vercel, localhost, etc)
    // ESTO ARREGLA EL ERROR DE TWITCH
    const currentDomain = window.location.hostname;

    let finalSrc = "";
    if (plataforma === 'twitch') {
        finalSrc = `https://player.twitch.tv/?channel=${canalAUsar}&parent=${currentDomain}`;
    } else if (plataforma === 'youtube') {
        finalSrc = `https://www.youtube.com/embed/${canalAUsar}?autoplay=1`;
    } else if (plataforma === 'kick') {
        finalSrc = `https://player.kick.com/${canalAUsar}`;
    } else if (plataforma === 'tiktok') {
        finalSrc = `https://www.tiktok.com/embed/v2/${canalAUsar}`;
    }
    
    if(iframe) iframe.src = finalSrc;

    // Colorear el botón activo
    botones.forEach(btn => {
        btn.style.background = '#111';
        btn.style.color = 'white';
        btn.style.border = '1px solid #444';
    });
    
    // Buscar el botón correspondiente y pintarlo
    let btnActivo = null;
    if(plataforma === 'twitch') btnActivo = botones[0];
    if(plataforma === 'youtube') btnActivo = botones[1];
    if(plataforma === 'kick') btnActivo = botones[2];
    if(plataforma === 'tiktok') btnActivo = botones[3];

    if(btnActivo) {
        if (plataforma === 'twitch') { btnActivo.style.background = 'var(--blue)'; btnActivo.style.color = '#000'; btnActivo.style.border = 'none';}
        if (plataforma === 'youtube') { btnActivo.style.background = 'var(--red)'; btnActivo.style.color = '#fff'; btnActivo.style.border = 'none';}
        if (plataforma === 'kick') { btnActivo.style.background = 'var(--green)'; btnActivo.style.color = '#000'; btnActivo.style.border = 'none';}
        if (plataforma === 'tiktok') { btnActivo.style.background = '#ff0050'; btnActivo.style.color = '#fff'; btnActivo.style.border = 'none';}
    }
}

function filtrarTorneos(formato) {
    currentFilter = formato;
    const botones = document.querySelectorAll('.btn-filter');
    botones.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    cargarTorneosDesdeNube();
}

function cargarTorneosDesdeNube() {
    const listaTorneos = document.getElementById('lista-torneos');
    if(!listaTorneos) return;

    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        listaTorneos.innerHTML = '';
        let hayTorneosVisibles = false;

        snap.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            
            if(currentFilter === 'todos' || data.formato === currentFilter) {
                hayTorneosVisibles = true;
                const inscritos = data.lista_inscriptos ? data.lista_inscriptos.length : 0;
                const estaLleno = inscritos >= data.cuposTotales;
                const yaInscrito = data.lista_inscriptos && data.lista_inscriptos.includes(currentUserName);
                
                let btnTexto = "UNIRSE";
                let btnColor = "var(--red)";
                
                if (yaInscrito) { btnTexto = "INSCRIPTO"; btnColor = "gray"; } 
                else if (estaLleno) { btnTexto = "LLENO"; btnColor = "gray"; }

                const etiquetaPrivado = data.privado ? '<span style="color:#ff0040; font-size:0.7rem; float:right; border:1px solid #ff0040; padding:2px 5px; border-radius:3px;">PRIVADO</span>' : '';
                
                let nombresPreview = "";
                if(inscritos > 0) {
                    const primerosNombres = data.lista_inscriptos.slice(0, 3).join(", ");
                    nombresPreview = `<p style="font-size: 0.75rem; color: #888; margin-bottom: 5px;">Participantes: ${primerosNombres}${inscritos > 3 ? '...' : ''}</p>`;
                }

                listaTorneos.innerHTML += `
                    <div class="card-t container-glass">
                        <span style="color:var(--blue); font-weight:bold; font-size: 0.8rem; background: rgba(0, 210, 255, 0.2); padding: 4px 10px; border-radius: 4px; border: 1px solid var(--blue);">MODO ${data.formato.toUpperCase()}</span>
                        ${etiquetaPrivado}
                        <h3 style="margin:15px 0; font-size: 1.4rem; border-bottom: 1px solid #333; padding-bottom: 10px;">${data.nombre}</h3>
                        <p style="margin-bottom: 8px; color: #ccc;"><i class="far fa-calendar-alt" style="color: var(--blue); width: 20px;"></i> ${data.fecha}</p>
                        <p style="margin-bottom: 8px; color: #ccc;"><i class="fas fa-users" style="color: var(--blue); width: 20px;"></i> Jugadores: ${inscritos} / ${data.cuposTotales}</p>
                        ${nombresPreview}
                        <p style="margin-bottom: 15px; color: var(--green); font-weight: bold;"><i class="fas fa-trophy" style="color: var(--green); width: 20px;"></i> Premio: ${data.premio || 'A definir'}</p>
                        
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button class="btn-primary" style="flex: 2; padding: 10px; background: ${btnColor};" onclick="unirseTorneo('${id}')" ${estaLleno || yaInscrito ? 'disabled' : ''}>${btnTexto}</button>
                            <button class="btn-secondary" style="flex: 1; padding: 10px; background: #222;" onclick="alert('Sistema de llaves en desarrollo por el Kage.')"><i class="fas fa-sitemap"></i> Llaves</button>
                        </div>
                    </div>
                `;
            }
        });

        if(!hayTorneosVisibles) {
            listaTorneos.innerHTML = '<p style="color: #ccc; grid-column: 1 / -1; text-align: center;">No hay torneos disponibles para este formato actualmente.</p>';
        }
    });
}

function unirseTorneo(torneoId) {
    if(currentUserName === "Ninja Anónimo") {
        alert("Debes ingresar con tu cuenta para unirte a un torneo.");
        window.location.hash = "#modal-login";
        return;
    }
    const torneoRef = db.collection('torneos').doc(torneoId);
    torneoRef.get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            const inscritos = data.lista_inscriptos ? data.lista_inscriptos.length : 0;
            if (inscritos >= data.cuposTotales) { alert("Lo sentimos, este torneo ya está lleno."); } 
            else {
                torneoRef.update({ lista_inscriptos: firebase.firestore.FieldValue.arrayUnion(currentUserName) })
                .then(() => alert("¡Te has inscripto al torneo exitosamente!"));
            }
        }
    });
}

function cargarAnunciosGremio() {
    const listaAnuncios = document.getElementById('lista-anuncios');
    if(!listaAnuncios) return;
    db.collection('anuncios_gremio').orderBy('timestamp', 'desc').onSnapshot(snap => {
        listaAnuncios.innerHTML = '';
        if(snap.empty) { listaAnuncios.innerHTML = '<p style="color: #666; text-align: center;">El tablón está vacío. ¡Publica tu solicitud!</p>'; }
        snap.forEach(doc => {
            const d = doc.data();
            const date = d.timestamp ? new Date(d.timestamp.toDate()).toLocaleDateString() : 'Recién';
            listaAnuncios.innerHTML += `
                <div style="background: #0a0a0f; border: 1px solid #333; padding: 15px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;"><strong style="color: var(--blue);">${d.usuario}</strong><span style="font-size: 0.7rem; color: #888;">${date}</span></div>
                    <div style="display: flex; gap: 5px; margin-bottom: 10px; flex-wrap: wrap;"><span style="background: #222; padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; color: #00d2ff;">Busco: ${d.busco}</span><span style="background: #222; padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; color: #ff0040;">Soy: ${d.soy}</span></div>
                    <p style="font-size: 0.9rem; color: #ccc; margin-bottom: 15px;">${d.mensaje}</p>
                    <button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="alert('Dile a ${d.usuario} por la Taberna Global que te interesa su equipo.')"><i class="fas fa-paper-plane"></i> Contactar</button>
                </div>
            `;
        });
    });
}

function mostrarTabAdmin(tabId) {
    document.getElementById('tab-torneos').style.display = 'none';
    document.getElementById('tab-byakugan').style.display = 'none';
    document.getElementById('tab-pagos').style.display = 'none';
    document.getElementById('tab-ban').style.display = 'none';
    document.getElementById(tabId).style.display = 'block';

    const botones = document.querySelectorAll('#admin .btn-filter');
    botones.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}
