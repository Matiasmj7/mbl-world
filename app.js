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

const ADMIN_EMAIL = "matias.moto7@gmail.com";
let currentUserName = "Ninja Anónimo";
let currentFilter = 'todos'; 
let kageStreamPlat = 'twitch'; 
let kageStreamUser = 'matias_mj7';

document.addEventListener('DOMContentLoaded', () => {
    
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
                cargarTorneosParaAdminLlaves();
            }
        } else {
            currentUserName = "Ninja Anónimo";
            if(userDisplay) { userDisplay.innerText = "Ingresar"; userDisplay.href = "#modal-login"; }
        }
    });

    const loginBtn = document.getElementById('login-google');
    if(loginBtn) {
        loginBtn.addEventListener('click', () => {
            auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(() => window.location.hash = '#');
        });
    }

    // BYAKUGAN DINAMICO
    db.collection('configuracion').doc('stream').onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            kageStreamPlat = data.plataforma;
            kageStreamUser = data.usuario;
            document.getElementById('status-stream').innerText = `SEÑAL: ${kageStreamPlat.toUpperCase()}`;
            cambiarStreamLocal(kageStreamPlat, kageStreamUser);
        }
    });

    const formConfigStream = document.getElementById('form-config-stream');
    if(formConfigStream) {
        formConfigStream.addEventListener('submit', (e) => {
            e.preventDefault();
            db.collection('configuracion').doc('stream').set({
                plataforma: document.getElementById('stream-plataforma').value,
                usuario: document.getElementById('stream-usuario').value.trim(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => alert("Byakugan Actualizado."));
        });
    }

    cargarTorneosDesdeNube();
    cargarAnunciosGremio();
    escucharTaberna();
});

// FUNCIONES DE TORNEOS Y LLAVES
async function generarLlaves(torneoId, torneoNombre) {
    if(!confirm(`¿Generar cruces para ${torneoNombre}?`)) return;
    const doc = await db.collection('torneos').doc(torneoId).get();
    let jugadores = doc.data().lista_inscriptos || [];
    if(jugadores.length < 2) return alert("Mínimo 2 ninjas.");
    
    jugadores = jugadores.sort(() => Math.random() - 0.5);
    const llavesRef = db.collection('torneos').doc(torneoId).collection('llaves');
    const batch = db.batch();
    
    for (let i = 0; i < jugadores.length; i += 2) {
        batch.set(llavesRef.doc(`partido_${i}`), {
            p1: jugadores[i],
            p2: jugadores[i+1] || "BYE",
            ganador: jugadores[i+1] ? "" : jugadores[i],
            ronda: 1
        });
    }
    await batch.commit();
    alert("¡Cruces generados!");
}

function verLlaves(torneoId, torneoNombre) {
    const contenedor = document.getElementById('contenedor-llaves-texto');
    document.getElementById('llaves-titulo').innerText = torneoNombre;
    window.location.hash = "#modal-llaves";
    
    db.collection('torneos').doc(torneoId).collection('llaves').onSnapshot(snap => {
        contenedor.innerHTML = "";
        snap.forEach(doc => {
            const p = doc.data();
            contenedor.innerHTML += `
                <div style="background:#000; padding:10px; border:1px solid #333; margin-bottom:5px;">
                    <div style="color:var(--blue)">${p.p1}</div> vs <div style="color:var(--red)">${p.p2}</div>
                </div>`;
        });
    });
}

function cargarTorneosDesdeNube() {
    const lista = document.getElementById('lista-torneos');
    if(!lista) return;
    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        lista.innerHTML = '';
        snap.forEach(doc => {
            const d = doc.data();
            const id = doc.id;
            const inscriptos = d.lista_inscriptos ? d.lista_inscriptos.length : 0;
            const cupos = d.cuposTotales || 0; // Fix para el undefined del video

            lista.innerHTML += `
                <div class="card-t container-glass">
                    <h3 style="margin-bottom:10px;">${d.nombre}</h3>
                    <p style="font-size:0.8rem; color:#aaa;"><i class="fas fa-users"></i> ${inscriptos} / ${cupos}</p>
                    <div style="display:flex; gap:10px; margin-top:15px;">
                        <button class="btn-primary" style="flex:1" onclick="unirseTorneo('${id}')">UNIRSE</button>
                        <button class="btn-secondary" style="flex:1" onclick="verLlaves('${id}', '${d.nombre}')">LLAVES</button>
                    </div>
                </div>`;
        });
    });
}

// LOGICA AUXILIAR
function cambiarStreamLocal(plataforma, usuario) {
    const iframe = document.getElementById('stream-frame');
    const domain = window.location.hostname;
    let src = "";
    if(plataforma === 'twitch') src = `https://player.twitch.tv/?channel=${usuario}&parent=${domain}`;
    if(plataforma === 'youtube') src = `https://www.youtube.com/embed/${usuario}`;
    if(iframe) iframe.src = src;
}

function cargarTorneosParaAdminLlaves() {
    const lista = document.getElementById('admin-lista-torneos-llaves');
    db.collection('torneos').onSnapshot(snap => {
        lista.innerHTML = '';
        snap.forEach(doc => {
            const d = doc.data();
            lista.innerHTML += `
                <div style="display:flex; justify-content:space-between; background:#111; padding:10px; margin-bottom:5px;">
                    <span>${d.nombre}</span>
                    <button class="btn-primary" style="padding:5px 10px;" onclick="generarLlaves('${doc.id}', '${d.nombre}')">GENERAR</button>
                </div>`;
        });
    });
}

function cerrarSesion() { auth.signOut().then(() => window.location.reload()); }
function filtrarTorneos(f) { currentFilter = f; cargarTorneosDesdeNube(); }
// ... (Otras funciones de chat y gremio se mantienen igual que v3.7)
