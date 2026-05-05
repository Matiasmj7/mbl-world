const firebaseConfig = {
  apiKey: "AIzaSyBEsnLlMgiQVie9MXrKL4dhQ2m23tv34kg",
  authDomain: "mblarg-94390.firebaseapp.com",
  projectId: "mblarg-94390",
  storageBucket: "mblarg-94390.firebasestorage.app",
  messagingSenderId: "308094247977",
  appId: "1:308094247977:web:cef31ccf807f732f5ce838"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// CONFIGURACIÓN DE ACCESO
const EMAIL_ADMIN = "matias.moto7@gmail.com";
let usuarioActual = "Ninja Anónimo";

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. GESTIÓN DE SESIÓN
    auth.onAuthStateChanged(user => {
        const userBtn = document.getElementById('user-btn');
        const heroName = document.getElementById('hero-user-name');
        const adminSection = document.getElementById('admin');
        const navAdminLink = document.getElementById('nav-admin-link');

        if(user) {
            usuarioActual = user.displayName || user.email.split('@')[0];
            userBtn.innerText = usuarioActual;
            if(heroName) heroName.innerText = usuarioActual;

            // Lógica de Admin
            if(user.email === EMAIL_ADMIN) {
                adminSection.style.display = 'block';
                navAdminLink.style.display = 'block';
            }
        } else {
            usuarioActual = "Ninja Anónimo";
            userBtn.innerText = "Ingresar";
            adminSection.style.display = 'none';
            navAdminLink.style.display = 'none';
        }
    });

    // 2. LOGIN GOOGLE
    const btnGoogle = document.getElementById('btn-login-google');
    if(btnGoogle) {
        btnGoogle.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).then(() => {
                window.location.hash = '#'; // Cierra el modal
            }).catch(err => console.error("Error Login:", err));
        });
    }

    // 3. CARGAR TORNEOS (Realtime)
    const contenedorTorneos = document.getElementById('contenedor-torneos');
    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        contenedorTorneos.innerHTML = '';
        snap.forEach(doc => {
            const data = doc.data();
            contenedorTorneos.innerHTML += `
                <div class="torneo-card glass-box">
                    <span style="color:var(--rasengan-blue); font-weight:bold;">${data.formato}</span>
                    <h3 style="margin:10px 0;">${data.nombre}</h3>
                    <p><i class="far fa-calendar-alt"></i> ${data.fecha}</p>
                    <p><i class="fas fa-users"></i> Cupos: ${data.cuposTotales}</p>
                    <p style="color:var(--success-green); font-weight:bold;">Premio: ${data.premio || 'A definir'}</p>
                    <button class="btn-susanoo" style="width:100%; margin-top:15px;" onclick="alert('Inscripción enviada')">UNIRSE AL COMBATE</button>
                </div>
            `;
        });
    });

    // 4. CREAR TORNEOS (Solo Admin)
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
                alert("¡Torneo publicado con éxito!");
            }).catch(err => alert("Error al publicar: " + err));
        });
    }
});

function cerrarSesion() {
    auth.signOut().then(() => window.location.reload());
}
