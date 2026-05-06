// CONFIGURACIÓN FIREBASE (Mantén la tuya)
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

document.addEventListener('DOMContentLoaded', () => {
    
    // Auth y Streams... (Mantener lógica de v3.7)
    
    auth.onAuthStateChanged(user => {
        if(user) {
            currentUserName = user.displayName || user.email.split('@')[0];
            if(user.email === ADMIN_EMAIL) {
                document.getElementById('admin-nav').style.display = 'block';
                document.getElementById('admin').style.display = 'block';
                cargarTorneosParaAdminLlaves();
            }
        }
    });

    cargarTorneosDesdeNube();
});

// ==========================================
// LÓGICA DE GENERACIÓN DE LLAVES (EL CEREBRO)
// ==========================================

async function generarLlaves(torneoId, torneoNombre) {
    if(!confirm(`¿Deseas cerrar inscripciones y generar los cruces para ${torneoNombre}?`)) return;

    const torneoRef = db.collection('torneos').doc(torneoId);
    const doc = await torneoRef.get();
    const data = doc.data();
    let jugadores = data.lista_inscriptos || [];

    if(jugadores.length < 2) {
        alert("Se necesitan al menos 2 ninjas para iniciar la Arena.");
        return;
    }

    // 1. Mezclar jugadores al azar (Shuffle)
    jugadores = jugadores.sort(() => Math.random() - 0.5);

    // 2. Crear los cruces de Ronda 1
    const partidos = [];
    for (let i = 0; i < jugadores.length; i += 2) {
        if (jugadores[i + 1]) {
            partidos.push({
                p1: jugadores[i],
                p2: jugadores[i + 1],
                ganador: "",
                ronda: 1
            });
        } else {
            // El jugador que queda solo recibe un BYE
            partidos.push({
                p1: jugadores[i],
                p2: "BYE (Pasa de Ronda)",
                ganador: jugadores[i], // Gana automáticamente
                ronda: 1
            });
        }
    }

    // 3. Guardar en una sub-colección llamada 'llaves' dentro del torneo
    const batch = db.batch();
    const llavesRef = torneoRef.collection('llaves');

    // Limpiar llaves anteriores si existieran
    const viejas = await llavesRef.get();
    viejas.forEach(v => batch.delete(v.ref));

    partidos.forEach((p, index) => {
        const newDoc = llavesRef.doc(`partido_${index + 1}`);
        batch.set(newDoc, p);
    });

    // Marcar torneo como "Iniciado"
    batch.update(torneoRef, { estado: "iniciado" });

    await batch.commit();
    alert("¡Los pergaminos de batalla han sido repartidos!");
}

// ==========================================
// VISTA DE LLAVES PARA EL JUGADOR
// ==========================================

function verLlaves(torneoId, torneoNombre) {
    const contenedor = document.getElementById('contenedor-llaves-texto');
    const titulo = document.getElementById('llaves-titulo');
    titulo.innerText = `Llaves: ${torneoNombre}`;
    contenedor.innerHTML = '<p style="color: #888;">Leyendo los pergaminos...</p>';
    window.location.hash = "#modal-llaves";

    db.collection('torneos').doc(torneoId).collection('llaves').orderBy('ronda').onSnapshot(snap => {
        if(snap.empty) {
            contenedor.innerHTML = '<p style="color: var(--red);">El Kage aún no ha generado los cruces para este torneo.</p>';
            return;
        }

        contenedor.innerHTML = "";
        snap.forEach(doc => {
            const p = doc.data();
            const esGanadorP1 = p.ganador === p.p1 ? 'border: 1px solid var(--green); background: rgba(0,255,163,0.1);' : '';
            const esGanadorP2 = p.ganador === p.p2 ? 'border: 1px solid var(--green); background: rgba(0,255,163,0.1);' : '';

            contenedor.innerHTML += `
                <div style="margin-bottom: 15px; background: #111; padding: 10px; border-radius: 5px; border: 1px solid #333;">
                    <div style="font-size: 0.7rem; color: var(--blue); margin-bottom: 5px;">RONDA ${p.ronda}</div>
                    <div style="padding: 5px; ${esGanadorP1}">${p.p1}</div>
                    <div style="color: #444; font-size: 0.8rem; margin: 2px 0;">VS</div>
                    <div style="padding: 5px; ${esGanadorP2}">${p.p2}</div>
                </div>
            `;
        });
    });
}

// ==========================================
// FUNCIONES DE CARGA (ADMIN Y TORNEOS)
// ==========================================

function cargarTorneosDesdeNube() {
    const lista = document.getElementById('lista-torneos');
    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        lista.innerHTML = '';
        snap.forEach(doc => {
            const d = doc.data();
            const id = doc.id;
            const inscriptos = d.lista_inscriptos ? d.lista_inscriptos.length : 0;
            
            lista.innerHTML += `
                <div class="card-t container-glass">
                    <h3>${d.nombre}</h3>
                    <p>Participantes: ${inscriptos} / ${d.cuposTotales}</p>
                    <div style="display: flex; gap: 5px; margin-top: 15px;">
                        <button class="btn-primary" style="flex:1" onclick="unirseTorneo('${id}')">UNIRSE</button>
                        <button class="btn-secondary" style="flex:1" onclick="verLlaves('${id}', '${d.nombre}')">LLAVES</button>
                    </div>
                </div>
            `;
        });
    });
}

function cargarTorneosParaAdminLlaves() {
    const lista = document.getElementById('admin-lista-torneos-llaves');
    db.collection('torneos').onSnapshot(snap => {
        lista.innerHTML = '';
        snap.forEach(doc => {
            const d = doc.data();
            const id = doc.id;
            const btnColor = d.estado === 'iniciado' ? 'gray' : 'var(--blue)';
            const btnTexto = d.estado === 'iniciado' ? 'RE-GENERAR' : 'GENERAR LLAVES';

            lista.innerHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #000; padding: 15px; border-radius: 8px; border: 1px solid #222;">
                    <div><strong>${d.nombre}</strong> <br> <span style="font-size:0.7rem; color:#888;">${d.lista_inscriptos?.length || 0} inscritos</span></div>
                    <button class="btn-primary" style="background: ${btnColor}; padding: 8px 15px; font-size: 0.8rem;" onclick="generarLlaves('${id}', '${d.nombre}')">${btnTexto}</button>
                </div>
            `;
        });
    });
}

// (Mantener funciones cerrarSesion, login, cambiarStreamLocal de v3.7)
