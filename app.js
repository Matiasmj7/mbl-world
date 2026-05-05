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
let currentUserName = "Ninja Anónimo";

document.addEventListener('DOMContentLoaded', () => {
    
    // CONTROL DE SESIÓN
    auth.onAuthStateChanged(user => {
        const userDisplay = document.getElementById('user-display');
        const userGreeting = document.getElementById('user-greeting');
        const adminNav = document.getElementById('admin-nav');
        const adminSection = document.getElementById('admin');

        if(user) {
            currentUserName = user.displayName || user.email.split('@')[0];
            
            if(userDisplay) {
                userDisplay.innerText = currentUserName;
                userDisplay.href = "#"; 
            }
            if(userGreeting) userGreeting.innerText = currentUserName;

            // Lógica estricta de Admin: SOLO se muestra si el correo coincide
            if(user.email === ADMIN_EMAIL) {
                if(adminNav) adminNav.style.display = 'block';
                if(adminSection) adminSection.style.display = 'block';
            } else {
                if(adminNav) adminNav.style.display = 'none';
                if(adminSection) adminSection.style.display = 'none';
            }
        } else {
            currentUserName = "Ninja Anónimo";
            if(userDisplay) {
                userDisplay.innerText = "Ingresar";
                userDisplay.href = "#modal-login";
            }
            if(userGreeting) userGreeting.innerText = "Ninja";
            if(adminNav) adminNav.style.display = 'none';
            if(adminSection) adminSection.style.display = 'none';
        }
    });

    // LOGIN GOOGLE
    const loginBtn = document.getElementById('login-google');
    if(loginBtn) {
        loginBtn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).then(() => {
                window.location.hash = '#'; // Cierra modal
            }).catch(err => alert("Error al iniciar sesión: " + err.message));
        });
    }

    // CARGAR TORNEOS
    const listaTorneos = document.getElementById('lista-torneos');
    if(listaTorneos) {
        db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
            listaTorneos.innerHTML = '';
            
            if(snap.empty) {
                 listaTorneos.innerHTML = '<p style="color: #ccc; grid-column: 1 / -1; text-align: center;">Aún no hay torneos activos en la aldea. ¡Espera el anuncio del Kage!</p>';
            }

            snap.forEach(doc => {
                const d = doc.data();
                listaTorneos.innerHTML += `
                    <div class="card-t container-glass">
                        <span style="color:var(--blue); font-weight:bold; font-size: 0.8rem; background: rgba(0, 210, 255, 0.2); padding: 4px 10px; border-radius: 4px; border: 1px solid var(--blue);">MODO ${d.formato.toUpperCase()}</span>
                        <h3 style="margin:15px 0; font-size: 1.4rem; border-bottom: 1px solid #333; padding-bottom: 10px;">${d.nombre}</h3>
                        <p style="margin-bottom: 8px; color: #ccc;"><i class="far fa-calendar-alt" style="color: var(--blue); width: 20px;"></i> ${d.fecha}</p>
                        <p style="margin-bottom: 8px; color: #ccc;"><i class="fas fa-users" style="color: var(--blue); width: 20px;"></i> Cupos: ${d.cupos}</p>
                        <p style="margin-bottom: 15px; color: var(--green); font-weight: bold;"><i class="fas fa-trophy" style="color: var(--green); width: 20px;"></i> Premio: ${d.premio || 'A definir'}</p>
                        <button class="btn-primary" style="width:100%;" onclick="alert('¡Inscripción recibida para el torneo ${d.nombre}!')">UNIRSE A LA BATALLA</button>
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
                alert("¡Torneo guardado y publicado en la Arena!");
            }).catch(error => alert("Error guardando torneo: " + error));
        });
    }

    // CHAT TABERNA
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
                alert("Debes ingresar a la aldea para poder hablar en la Taberna.");
            }
        });
    }

    // LEER CHAT
    const chatContainer = document.getElementById('chat-messages-container');
    if(chatContainer) {
        db.collection('taberna').orderBy('timestamp').onSnapshot(snap => {
            chatContainer.innerHTML = '';
            snap.forEach(doc => { 
                const d = doc.data(); 
                chatContainer.innerHTML += `<div style="margin-bottom: 8px;"><strong style="color:var(--blue); margin-right: 5px;">${d.usuario}:</strong> ${d.texto}</div>`; 
            });
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });
    }
});

function cerrarSesion() {
    firebase.auth().signOut().then(() => window.location.reload());
}

// FUNCIÓN PARA CAMBIAR EL REPRODUCTOR DE STREAM
function cambiarStream(plataforma) {
    const iframe = document.getElementById('stream-frame');
    const botones = document.querySelectorAll('.plat-btn');
    
    // Reiniciar estilos de todos los botones
    botones.forEach(btn => {
        btn.style.background = '#111';
        btn.style.color = 'white';
        btn.style.border = '1px solid #444';
    });

    // Activar el botón seleccionado y cambiar el src del iframe
    if (plataforma === 'twitch') {
        // Asegúrate de que parent= coincide con la URL de tu página desplegada
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
        // URL embebida de TikTok (reemplaza si tienes un feed específico)
        iframe.src = "https://www.tiktok.com/embed/v2/6949015180630658309";
        botones[3].style.background = '#ff0050'; // Color de TikTok
        botones[3].style.color = '#fff';
        botones[3].style.border = 'none';
    }
}
