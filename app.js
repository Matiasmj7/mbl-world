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
    
    // 1. CONTROL DE SESIÓN
    auth.onAuthStateChanged(user => {
        const adminNav = document.getElementById('admin-nav');
        const adminSection = document.getElementById('admin');
        const userDisplay = document.getElementById('user-display');
        const userGreeting = document.getElementById('user-greeting');

        if(user) {
            currentUserName = user.displayName || user.email.split('@')[0];
            if(userDisplay) userDisplay.innerText = currentUserName;
            if(userGreeting) userGreeting.innerText = currentUserName;

            if(user.email === ADMIN_EMAIL) {
                if(adminNav) adminNav.style.display = 'block';
                if(adminSection) adminSection.style.display = 'block';
            }
        } else {
            currentUserName = "Ninja Anónimo";
            if(userDisplay) userDisplay.innerText = "Ingresar";
        }
    });

    // 2. LOGIN GOOGLE
    const loginBtn = document.getElementById('login-google');
    if(loginBtn) {
        loginBtn.addEventListener('click', () => {
            auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(() => window.location.hash = '#');
        });
    }

    // 3. --- LÓGICA DINÁMICA DEL BYAKUGAN ---
    // Escuchar cambios en la base de datos para el stream actual
    db.collection('configuracion').doc('stream').onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            const iframe = document.getElementById('stream-frame');
            const statusText = document.getElementById('status-stream');
            
            let finalSrc = "";
            const canal = data.usuario;
            const plataforma = data.plataforma;

            statusText.innerText = `SEÑAL RECIBIDA: ${plataforma.toUpperCase()} [${canal}]`;

            if (plataforma === 'twitch') {
                finalSrc = `https://player.twitch.tv/?channel=${canal}&parent=mbl-world-v2.vercel.app`;
            } else if (plataforma === 'youtube') {
                finalSrc = `https://www.youtube.com/embed/${canal}?autoplay=1`;
            } else if (plataforma === 'kick') {
                finalSrc = `https://player.kick.com/${canal}`;
            } else if (plataforma === 'tiktok') {
                finalSrc = `https://www.tiktok.com/embed/v2/${canal}`;
            }
            
            if(iframe) iframe.src = finalSrc;
        } else {
            // Si no hay nada en la base de datos, poner un valor por defecto
            document.getElementById('status-stream').innerText = "ESPERANDO ÓRDENES DEL KAGE...";
        }
    });

    // GUARDAR NUEVA CONFIGURACIÓN DE STREAM (SOLO ADMIN)
    const formConfigStream = document.getElementById('form-config-stream');
    if(formConfigStream) {
        formConfigStream.addEventListener('submit', (e) => {
            e.preventDefault();
            const nuevaPlat = document.getElementById('stream-plataforma').value;
            const nuevoUser = document.getElementById('stream-usuario').value.trim();

            db.collection('configuracion').doc('stream').set({
                plataforma: nuevaPlat,
                usuario: nuevoUser,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                alert("¡Visión del Byakugan Actualizada para toda la aldea!");
            });
        });
    }

    // 4. RESTO DE FUNCIONES (BACKUP 3.3)
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
            }
        });
    }

    db.collection('taberna').orderBy('timestamp').onSnapshot(snap => {
        const container = document.getElementById('chat-messages-container');
        container.innerHTML = '';
        snap.forEach(doc => {
            const d = doc.data();
            container.innerHTML += `<div><strong style="color:var(--blue)">${d.usuario}:</strong> ${d.texto}</div>`;
        });
        container.scrollTop = container.scrollHeight;
    });
});

function cerrarSesion() { auth.signOut().then(() => window.location.reload()); }

function abrirModalAnuncio(e) {
    if(e) e.preventDefault();
    if(currentUserName === "Ninja Anónimo") {
        window.location.hash = "#modal-login";
    } else {
        window.location.hash = "#modal-anuncio"; 
    }
}

function filtrarTorneos(formato) {
    currentFilter = formato;
    cargarTorneosDesdeNube();
}

function cargarTorneosDesdeNube() {
    const lista = document.getElementById('lista-torneos');
    if(!lista) return;
    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        lista.innerHTML = '';
        snap.forEach(doc => {
            const d = doc.data();
            if(currentFilter === 'todos' || d.formato === currentFilter) {
                lista.innerHTML += `<div class="card-t container-glass"><h3>${d.nombre}</h3><p>${d.formato} - ${d.fecha}</p><button class="btn-primary" onclick="alert('Inscripto')">UNIRSE</button></div>`;
            }
        });
    });
}

function cargarAnunciosGremio() {
    const lista = document.getElementById('lista-anuncios');
    db.collection('anuncios_gremio').orderBy('timestamp', 'desc').onSnapshot(snap => {
        lista.innerHTML = '';
        snap.forEach(doc => {
            const d = doc.data();
            lista.innerHTML += `<div style="border-bottom:1px solid #333; padding:10px;"><strong>${d.usuario}</strong>: Busco ${d.busco}</div>`;
        });
    });
}

function mostrarTabAdmin(tabId) {
    const tabs = ['tab-torneos', 'tab-byakugan', 'tab-pagos', 'tab-ban'];
    tabs.forEach(t => document.getElementById(t).style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
}
