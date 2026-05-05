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
const EMAIL_ADMIN = "matias.moto7@gmail.com";
let usuarioActual = "Ninja Anónimo";

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        const userBtn = document.getElementById('user-btn');
        const heroName = document.getElementById('hero-user-name');
        const adminSection = document.getElementById('admin');
        const navAdminLink = document.getElementById('nav-admin-link');
        if(user) {
            usuarioActual = user.displayName || user.email.split('@')[0];
            userBtn.innerText = usuarioActual;
            if(heroName) heroName.innerText = usuarioActual;
            if(user.email === EMAIL_ADMIN) {
                if(adminSection) adminSection.style.display = 'block';
                if(navAdminLink) navAdminLink.style.display = 'block';
            }
        } else {
            usuarioActual = "Ninja Anónimo";
            userBtn.innerText = "Ingresar";
            if(adminSection) adminSection.style.display = 'none';
        }
    });

    document.getElementById('btn-login-google').addEventListener('click', () => {
        auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(() => window.location.hash = '#');
    });

    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        const cont = document.getElementById('contenedor-torneos');
        cont.innerHTML = '';
        snap.forEach(doc => {
            const d = doc.data();
            cont.innerHTML += `<div class="torneo-card glass-box"><span style="color:#00d2ff; font-weight:bold;">${d.formato.toUpperCase()}</span><h3 style="margin:10px 0;">${d.nombre}</h3><p>Fecha: ${d.fecha}</p><p>Cupos: ${d.cuposTotales}</p><p style="color:#00ffa3;">Premio: ${d.premio || 'A definir'}</p><button class="btn-submit" style="margin-top:15px;" onclick="alert('Inscrito')">INSCRIBIRSE</button></div>`;
        });
    });

    document.getElementById('form-crear-torneo').addEventListener('submit', (e) => {
        e.preventDefault();
        db.collection('torneos').add({
            nombre: document.getElementById('admin-torneo-nombre').value,
            formato: document.getElementById('admin-torneo-formato').value,
            fecha: document.getElementById('admin-torneo-fecha').value,
            cuposTotales: document.getElementById('admin-torneo-cupos').value,
            premio: document.getElementById('admin-torneo-premio').value,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            document.getElementById('form-crear-torneo').reset();
            alert("¡Torneo Publicado!");
        });
    });

    document.getElementById('btn-send-chat').addEventListener('click', () => {
        const txt = document.getElementById('chat-input-text').value.trim();
        if(txt && usuarioActual !== "Ninja Anónimo") {
            db.collection('taberna').add({ usuario: usuarioActual, texto: txt, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
            document.getElementById('chat-input-text').value = '';
        }
    });

    db.collection('taberna').orderBy('timestamp').onSnapshot(snap => {
        const bc = document.getElementById('chat-messages-container');
        bc.innerHTML = '';
        snap.forEach(doc => { const d = doc.data(); bc.innerHTML += `<div><strong style="color:#00d2ff">${d.usuario}:</strong> ${d.texto}</div>`; });
        bc.scrollTop = bc.scrollHeight;
    });
});

function cerrarSesion() { auth.signOut().then(() => window.location.reload()); }
