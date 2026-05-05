// CONFIGURACIÓN FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBEsnLlMgiQVie9MXrKL4dhQ2m23tv34kg",
  authDomain: "mblarg-94390.firebaseapp.com",
  projectId: "mblarg-94390",
  storageBucket: "mblarg-94390.firebasestorage.app",
  messagingSenderId: "308094247977",
  appId: "1:308094247977:web:cef31ccf807f732f5ce838"
};

// INICIALIZAR
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ACCESO KAGE
const ADMIN_EMAIL = "matias.moto7@gmail.com";
let currentUserName = "Ninja";

document.addEventListener('DOMContentLoaded', () => {
    
    // CONTROL DE SESIÓN
    auth.onAuthStateChanged(user => {
        const userDisplay = document.getElementById('user-display');
        const userGreeting = document.getElementById('user-greeting');
        const adminNav = document.getElementById('admin-nav');
        const adminSection = document.getElementById('admin');

        if(user) {
            currentUserName = user.displayName || user.email.split('@')[0];
            userDisplay.innerText = currentUserName;
            if(userGreeting) userGreeting.innerText = currentUserName;

            // Mostrar admin solo a Matías
            if(user.email === ADMIN_EMAIL) {
                adminNav.style.display = 'block';
                adminSection.style.display = 'block';
            }
        } else {
            userDisplay.innerText = "Ingresar";
            if(userGreeting) userGreeting.innerText = "Ninja";
            adminNav.style.display = 'none';
            adminSection.style.display = 'none';
        }
    });

    // LOGIN GOOGLE
    const loginBtn = document.getElementById('login-google');
    if(loginBtn) {
        loginBtn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).then(() => {
                window.location.hash = '#'; // Cierra modal
            }).catch(err => alert("Error: " + err.message));
        });
    }

    // CARGAR TORNEOS
    const listaTorneos = document.getElementById('lista-torneos');
    if(listaTorneos) {
        db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
            listaTorneos.innerHTML = '';
            snap.forEach(doc => {
                const d = doc.data();
                listaTorneos.innerHTML += `
                    <div class="card-t">
                        <span style="color:var(--blue); font-weight:bold;">MODO ${d.formato.toUpperCase()}</span>
                        <h3 style="margin:10px 0;">${d.nombre}</h3>
                        <p><i class="far fa-calendar-alt"></i> ${d.fecha}</p>
                        <p><i class="fas fa-users"></i> Cupos: ${d.cupos}</p>
                        <p style="color:var(--green);">Premio: ${d.premio || 'A definir'}</p>
                        <button class="btn-primary" style="width:100%; margin-top:15px;" onclick="alert('¡Inscripto!')">UNIRSE</button>
                    </div>
                `;
            });
        });
    }

    // CREAR TORNEO (ADMIN)
    const formT = document.getElementById('form-torneo');
    if(formT) {
        formT.addEventListener('submit', (e) => {
            e.preventDefault();
            db.collection('torneos').add({
                nombre: document.getElementById('t-nombre').value,
                formato: document.getElementById('t-formato').value,
                fecha: document.getElementById('t-fecha').value,
                cupos: document.getElementById('t-cupos').value,
                premio: document.getElementById('t-premio').value,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                formT.reset();
                alert("¡Torneo en la nube!");
            });
        });
    }
});

function cerrarSesion() {
    auth.signOut().then(() => window.location.reload());
}
