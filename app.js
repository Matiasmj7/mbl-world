// --- CONFIGURACIÓN DE FIREBASE ---
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

let usuarioActual = "Ninja Anónimo";

document.addEventListener('DOMContentLoaded', () => {
    
    // CONTROL DE USUARIO EN VIVO
    auth.onAuthStateChanged(user => {
        const userBtn = document.getElementById('user-btn');
        const heroName = document.getElementById('hero-user-name');
        
        if(user) {
            usuarioActual = user.displayName || user.email.split('@')[0];
            userBtn.innerText = usuarioActual;
            userBtn.href = "javascript:void(0)"; 
            if(heroName) heroName.innerText = usuarioActual;
        } else {
            usuarioActual = "Ninja Anónimo";
            userBtn.innerText = "Ingresar";
            userBtn.href = "#modal-login";
            if(heroName) heroName.innerText = "Ninja";
        }
    });

    // LOGIN GOOGLE
    const btnGoogle = document.getElementById('btn-login-google');
    if(btnGoogle) {
        btnGoogle.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).then(() => {
                window.location.hash = '#';
            }).catch(err => alert("Error: " + err.message));
        });
    }

    // LOGIN CORREO
    const formLogin = document.getElementById('form-login-email');
    if(formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;
            
            auth.signInWithEmailAndPassword(email, pass)
                .then(() => window.location.hash = '#')
                .catch(() => {
                    auth.createUserWithEmailAndPassword(email, pass)
                        .then(() => window.location.hash = '#')
                        .catch(err => alert("Error: " + err.message));
                });
        });
    }

    // LECTOR DE TORNEOS DESDE LA NUBE
    const contenedorTorneos = document.getElementById('contenedor-torneos');
    if(contenedorTorneos) {
        db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
            contenedorTorneos.innerHTML = '';
            snap.forEach(doc => {
                const data = doc.data();
                contenedorTorneos.innerHTML += `
                    <div class="torneo-card" data-formato="${data.formato}">
                        <div class="torneo-badge">Abierto</div>
                        <span class="torneo-formato">${data.formato.toUpperCase()}</span>
                        <h3>${data.nombre}</h3>
                        <div class="torneo-info">
                            <p><i class="fas fa-calendar-alt"></i> ${data.fecha}</p>
                            <p><i class="fas fa-users"></i> Cupos: ${data.cuposTotales}</p>
                            <p><i class="fas fa-trophy"></i> Premio: ${data.premio || 'A definir'}</p>
                        </div>
                        <button class="btn-submit" style="margin-top:15px;" onclick="alert('¡Inscripto en la base de datos!')">Inscribirse</button>
                    </div>
                `;
            });
        });
    }

    // CREADOR DE TORNEOS (ADMIN)
    const formTorneo = document.getElementById('form-crear-torneo');
    if(formTorneo) {
        formTorneo.addEventListener('submit', (e) => {
            e.preventDefault();
            db.collection('torneos').add({
                nombre: document.getElementById('admin-torneo-nombre').value,
                formato: document.getElementById('admin-torneo-formato').value,
                fecha: document.getElementById('admin-torneo-fecha').value,
                cuposTotales: document.getElementById('admin-torneo-cupos').value,
                premio: document.getElementById('admin-torneo-premio').value,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                formTorneo.reset();
                alert("¡Torneo guardado en Firebase!");
            });
        });
    }

    // CHAT EN VIVO
    const btnChat = document.getElementById('btn-send-chat');
    const inputChat = document.getElementById('chat-input-text');
    const boxChat = document.getElementById('chat-messages-container');

    if(btnChat) {
        btnChat.addEventListener('click', () => {
            const txt = inputChat.value.trim();
            if(txt) {
                db.collection('taberna').add({
                    usuario: usuarioActual,
                    texto: txt,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                inputChat.value = '';
            }
        });
        
        db.collection('taberna').orderBy('timestamp').onSnapshot(snap => {
            boxChat.innerHTML = '';
            snap.forEach(doc => {
                const d = doc.data();
                boxChat.innerHTML += `<div><strong style="color:var(--rasengan-blue)">${d.usuario}:</strong> ${d.texto}</div>`;
            });
            boxChat.scrollTop = boxChat.scrollHeight;
        });
    }

    // SELECTOR DE STREAM
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
});

function cerrarSesion() {
    auth.signOut().then(() => {
        alert("Sesión finalizada.");
        window.location.reload();
    });
}
