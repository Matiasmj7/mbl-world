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

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. ESTADO DE SESIÓN
    auth.onAuthStateChanged(user => {
        const userDisplay = document.getElementById('user-display');
        const userGreeting = document.getElementById('user-greeting');
        const adminNav = document.getElementById('admin-nav');
        const adminSection = document.getElementById('admin');

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
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).then(() => {
                window.location.hash = '#';
            }).catch(err => alert("Error: " + err.message));
        });
    }

    // 3. CARGAR TORNEOS
    cargarTorneosDesdeNube();

    // 4. CREAR TORNEOS (Kage)
    const formT = document.getElementById('form-torneo');
    if(formT) {
        formT.addEventListener('submit', (e) => {
            e.preventDefault();
            const esPrivado = document.getElementById('t-privado').checked;
            
            db.collection('torneos').add({
                nombre: document.getElementById('t-nombre').value,
                formato: document.getElementById('t-formato').value,
                fecha: document.getElementById('t-fecha').value,
                cuposTotales: parseInt(document.getElementById('t-cupos').value), 
                lista_inscriptos: [], 
                premio: document.getElementById('t-premio').value,
                privado: esPrivado,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                formT.reset();
                alert("¡Torneo publicado en la Arena de Combate!");
            });
        });
    }

    // 5. CHAT TABERNA
    const btnSendChat = document.getElementById('btn-send-chat');
    if(btnSendChat) {
        btnSendChat.addEventListener('click', () => {
            const inputField = document.getElementById('chat-input-text');
            const txt = inputField.value.trim();
            if(txt && currentUserName !== "Ninja Anónimo") {
                db.collection('taberna').add({ 
                    usuario: currentUserName, 
                    texto: txt, 
                    timestamp: firebase.firestore.FieldValue.serverTimestamp() 
                });
                inputField.value = '';
            } else if (currentUserName === "Ninja Anónimo") {
                alert("Debes identificarte (Ingresar) para hablar en la Taberna.");
            }
        });
    }

    // 6. LEER CHAT EN TIEMPO REAL
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

    // 7. CARGAR Y PUBLICAR ANUNCIOS DEL GREMIO
    cargarAnunciosGremio();

    const formAnuncio = document.getElementById('form-anuncio');
    if(formAnuncio) {
        formAnuncio.addEventListener('submit', (e) => {
            e.preventDefault();
            if(currentUserName === "Ninja Anónimo") {
                alert("Debes ingresar a la web para publicar.");
                return;
            }
            db.collection('anuncios_gremio').add({
                usuario: currentUserName,
                busco: document.getElementById('a-busco').value,
                soy: document.getElementById('a-soy').value,
                mensaje: document.getElementById('a-mensaje').value,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                formAnuncio.reset();
                window.location.hash = '#gremio'; 
                alert("Anuncio publicado en el tablón.");
            });
        });
    }

    // 8. BLOQUEAR SUBIDA DE VIDEO SI NO ESTÁ LOGUEADO (ABISMO)
    const videoUpload = document.getElementById('video-upload');
    if(videoUpload) {
        videoUpload.addEventListener('click', (e) => {
            if(currentUserName === "Ninja Anónimo") {
                e.preventDefault(); // Detiene que se abra la ventana de archivos
                alert("Atención: Debes Ingresar a la página con Google para compartir tu jugada.");
                window.location.hash = "#modal-login";
            }
        });
    }
});

// ==========================
// FUNCIONES AUXILIARES
// ==========================

function cerrarSesion() {
    firebase.auth().signOut().then(() => window.location.reload());
}

// Nueva función exclusiva para el botón del Gremio
function abrirModalAnuncio(e) {
    if(e) e.preventDefault();
    if(currentUserName === "Ninja Anónimo") {
        alert("Atención: Debes Ingresar a la página con Google para publicar en el Tablón.");
        window.location.hash = "#modal-login";
    } else {
        window.location.hash = "#modal-anuncio"; 
    }
}

// Filtros de Torneos
function filtrarTorneos(formato) {
    currentFilter = formato;
    const botones = document.querySelectorAll('.btn-filter');
    botones.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    cargarTorneosDesdeNube();
}

// Renderizar Torneos y lógica de inscripción
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
                
                if (yaInscrito) {
                    btnTexto = "INSCRIPTO";
                    btnColor = "gray";
                } else if (estaLleno) {
                    btnTexto = "LLENO";
                    btnColor = "gray";
                }

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
            
            if (inscritos >= data.cuposTotales) {
                alert("Lo sentimos, este torneo ya está lleno.");
            } else {
                torneoRef.update({
                    lista_inscriptos: firebase.firestore.FieldValue.arrayUnion(currentUserName)
                }).then(() => {
                    alert("¡Te has inscripto al torneo exitosamente!");
                });
            }
        }
    });
}

function cargarAnunciosGremio() {
    const listaAnuncios = document.getElementById('lista-anuncios');
    if(!listaAnuncios) return;

    db.collection('anuncios_gremio').orderBy('timestamp', 'desc').onSnapshot(snap => {
        listaAnuncios.innerHTML = '';
        
        if(snap.empty) {
             listaAnuncios.innerHTML = '<p style="color: #666; text-align: center;">El tablón está vacío. ¡Publica tu solicitud!</p>';
        }

        snap.forEach(doc => {
            const d = doc.data();
            const date = d.timestamp ? new Date(d.timestamp.toDate()).toLocaleDateString() : 'Recién';
            
            listaAnuncios.innerHTML += `
                <div style="background: #0a0a0f; border: 1px solid #333; padding: 15px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <strong style="color: var(--blue);">${d.usuario}</strong>
                        <span style="font-size: 0.7rem; color: #888;">${date}</span>
                    </div>
                    <div style="display: flex; gap: 5px; margin-bottom: 10px; flex-wrap: wrap;">
                        <span style="background: #222; padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; color: #00d2ff;">Busco: ${d.busco}</span>
                        <span style="background: #222; padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; color: #ff0040;">Soy: ${d.soy}</span>
                    </div>
                    <p style="font-size: 0.9rem; color: #ccc; margin-bottom: 15px;">${d.mensaje}</p>
                    <button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="alert('Dile a ${d.usuario} por la Taberna Global que te interesa su equipo.')"><i class="fas fa-paper-plane"></i> Contactar</button>
                </div>
            `;
        });
    });
}

function mostrarTabAdmin(tabId) {
    document.getElementById('tab-torneos').style.display = 'none';
    document.getElementById('tab-pagos').style.display = 'none';
    document.getElementById('tab-ban').style.display = 'none';
    document.getElementById(tabId).style.display = 'block';

    const botones = document.querySelectorAll('#admin .btn-filter');
    botones.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function cambiarStream(plataforma) {
    const iframe = document.getElementById('stream-frame');
    const botones = document.querySelectorAll('.plat-btn');
    
    botones.forEach(btn => {
        btn.style.background = '#111';
        btn.style.color = 'white';
        btn.style.border = '1px solid #444';
    });

    if (plataforma === 'twitch') {
        iframe.src = "https://player.twitch.tv/?channel=matias_mj7&parent=mbl-world-v2.vercel.app";
        botones[0].style.background = 'var(--blue)';
        botones[0].style.color = '#000';
        botones[0].style.border = 'none';
    } else if (plataforma === 'youtube') {
        iframe.src = "https://www.youtube.com/embed/live_stream?channel=UCUZHFZ9jIKrLroW8LcyJEQQ";
        botones[1].style.background = 'var(--red)';
        botones[1].style.color = '#fff';
        botones[1].style.border = 'none';
    } else if (plataforma === 'kick') {
        iframe.src = "https://player.kick.com/matias_mj7";
        botones[2].style.background = 'var(--green)';
        botones[2].style.color = '#000';
        botones[2].style.border = 'none';
    } else if (plataforma === 'tiktok') {
        iframe.src = "https://www.tiktok.com/embed/v2/6949015180630658309";
        botones[3].style.background = '#ff0050'; 
        botones[3].style.color = '#fff';
        botones[3].style.border = 'none';
    }
}
