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
    
    // 1. ESTADO DE SESIÓN Y PERMISOS
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
                cuposTotales: document.getElementById('t-cupos').value, 
                inscriptos: 0, 
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

    // LEER CHAT EN TIEMPO REAL
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
});

function cerrarSesion() {
    firebase.auth().signOut().then(() => window.location.reload());
}

function verificarLogin() {
    if(currentUserName === "Ninja Anónimo") {
        alert("Atención: Debes Ingresar a la página para usar esta función.");
        window.location.hash = "#modal-login";
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
            const d = doc.data();
            
            if(currentFilter === 'todos' || d.formato === currentFilter) {
                hayTorneosVisibles = true;
                const etiquetaPrivado = d.privado ? '<span style="color:#ff0040; font-size:0.7rem; float:right; border:1px solid #ff0040; padding:2px 5px; border-radius:3px;">PRIVADO</span>' : '';
                
                listaTorneos.innerHTML += `
                    <div class="card-t container-glass">
                        <span style="color:var(--blue); font-weight:bold; font-size: 0.8rem; background: rgba(0, 210, 255, 0.2); padding: 4px 10px; border-radius: 4px; border: 1px solid var(--blue);">MODO ${d.formato.toUpperCase()}</span>
                        ${etiquetaPrivado}
                        <h3 style="margin:15px 0; font-size: 1.4rem; border-bottom: 1px solid #333; padding-bottom: 10px;">${d.nombre}</h3>
                        <p style="margin-bottom: 8px; color: #ccc;"><i class="far fa-calendar-alt" style="color: var(--blue); width: 20px;"></i> ${d.fecha}</p>
                        <p style="margin-bottom: 8px; color: #ccc;"><i class="fas fa-users" style="color: var(--blue); width: 20px;"></i> Jugadores: ${d.inscriptos || 0} / ${d.cuposTotales}</p>
                        <p style="margin-bottom: 15px; color: var(--green); font-weight: bold;"><i class="fas fa-trophy" style="color: var(--green); width: 20px;"></i> Premio: ${d.premio || 'A definir'}</p>
                        
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button class="btn-primary" style="flex: 2; padding: 10px;" onclick="verificarLogin()">UNIRSE</button>
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
