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

// ACCESO KAGE SUPREMO
const EMAIL_ADMIN = "matias.moto7@gmail.com";
let usuarioActual = "Ninja Anónimo";

document.addEventListener('DOMContentLoaded', () => {
    
    // ESTADO DE SESIÓN
    auth.onAuthStateChanged(user => {
        const userBtn = document.getElementById('user-btn');
        const heroName = document.getElementById('hero-user-name');
        const adminSection = document.getElementById('admin');
        const navAdminLink = document.getElementById('nav-admin-link');

        if(user) {
            usuarioActual = user.displayName || user.email.split('@')[0];
            userBtn.innerText = usuarioActual;
            userBtn.href = "javascript:void(0)";
            if(heroName) heroName.innerText = usuarioActual;

            // VERIFICACIÓN DE PODER KAGE
            if(user.email === EMAIL_ADMIN) {
                if(adminSection) adminSection.style.display = 'block';
                if(navAdminLink) navAdminLink.style.display = 'block';
            } else {
                if(adminSection) adminSection.style.display = 'none';
                if(navAdminLink) navAdminLink.style.display = 'none';
            }
        } else {
            usuarioActual = "Ninja Anónimo";
            userBtn.innerText = "Ingresar";
            userBtn.href = "#modal-login";
            if(heroName) heroName.innerText = "Ninja";
            if(adminSection) adminSection.style.display = 'none';
            if(navAdminLink) navAdminLink.style.display = 'none';
        }
    });

    // LOGIN GOOGLE
    const btnGoogle = document.getElementById('btn-login-google');
    if(btnGoogle) {
        btnGoogle.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).then(() => {
                window.location.hash = '#';
            }).catch(err => alert("Error de Aldea: " + err.message));
        });
    }

    // CARGAR TORNEOS (ARENA)
    const contenedorTorneos = document.getElementById('contenedor-torneos');
    if(contenedorTorneos) {
        db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
            contenedorTorneos.innerHTML = '';
            snap.forEach(doc => {
                const data = doc.data();
                contenedorTorneos.innerHTML += `
                    <div class="torneo-card">
                        <span style="color:var(--rasengan-blue); font-weight:900;">${data.formato.toUpperCase()}</span>
                        <h3 style="margin:15px 0; font-size:1.5rem;">${data.nombre}</h3>
                        <p><i class="fas fa-calendar-alt" style="color:var(--rasengan-blue);"></i> ${data.fecha}</p>
                        <p><i class="fas fa-users" style="color:var(--rasengan-blue);"></i> Cupos: ${data.cuposTotales}</p>
                        <p><i class="fas fa-trophy" style="color:var(--success-green);"></i> Premio: ${data.premio || 'A definir'}</p>
                        <button class="btn-submit" style="margin-top:20px;" onclick="alert('¡Inscripción recibida!')">Inscribirse</button>
                    </div>
                `;
            });
        });
    }

    // CREAR TORNEO (ADMIN PANEL)
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
                alert("¡Torneo enviado a la nube con éxito!");
            });
        });
    }

    // TABERNA (CHAT EN VIVO)
    const btnChat = document.getElementById('btn-send-chat');
    const inputChat = document.getElementById('chat-input-text');
    const boxChat = document.getElementById('chat-messages-container');

    if(btnChat) {
        btnChat.addEventListener('click', () => {
            const txt = inputChat.value.trim();
            if(txt && usuarioActual !== "Ninja Anónimo") {
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
});

function cerrarSesion() {
    auth.signOut().then(() => window.location.reload());
}
