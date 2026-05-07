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

const ADMIN_EMAIL = "matias.moto7@gmail.com";
let currentUserName = "Ninja Anónimo";
let currentUserId = null;
let miClan = "";
let misRyos = 0;
let miInventario = [];
let miEquipamiento = { borde: '', colorChat: '', pin: '' };
let currentFilter = 'todos'; 
let kageStreamPlat = 'twitch'; 
let kageStreamUser = 'matias_mj7';
let trabajando = false; 
let miPerfilActual = {};

// CATÁLOGO TIENDA
const CATALOGO_TIENDA = [
    { id: 'borde_fuego', nombre: 'Aura de Fuego', tipo: 'borde', precio: 300, desc: 'Borde ardiente.', estilo: 'border: 3px solid #ff4500; box-shadow: 0 0 10px #ff4500;' },
    { id: 'color_dorado', nombre: 'Voz Dorada', tipo: 'colorChat', precio: 150, desc: 'Nombre en oro.', estilo: 'color: gold; text-shadow: 0 0 5px gold;' },
    { id: 'pin_shuriken', nombre: 'Pin Shuriken', tipo: 'pin', precio: 200, desc: 'Equipo ninja.', icon: '<i class="fas fa-dharmachakra"></i>' }
];

document.addEventListener('DOMContentLoaded', () => {
    
    // AUTH MONITOR
    auth.onAuthStateChanged(user => {
        if(user) {
            currentUserId = user.uid;
            db.collection('ninjas').doc(user.uid).onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data(); miPerfilActual = data; currentUserName = data.nick; misRyos = data.ryos || 0; miInventario = data.inventario || []; miEquipamiento = data.equipado || { borde: '', colorChat: '', pin: '' };
                    document.getElementById('user-display').innerText = currentUserName;
                    document.getElementById('user-greeting').innerText = currentUserName;
                    document.getElementById('mi-nick-bingo').innerText = currentUserName;
                    document.getElementById('mi-xp-bingo').innerText = `${data.xp || 0} XP`;
                    document.getElementById('mi-ryos-bingo').innerHTML = `<i class="fas fa-coins"></i> ${misRyos} Ryos`;
                    renderizarTienda();
                    if(user.email === ADMIN_EMAIL) { document.getElementById('admin-nav').style.display = 'block'; document.getElementById('admin').style.display = 'block'; cargarTorneosParaAdminLlaves(); }
                } else { window.location.hash = "#modal-registro-nick"; }
            });
        } else {
            currentUserName = "Ninja Anónimo"; document.getElementById('user-display').innerText = "Ingresar";
        }
    });

    // TICKER & STREAM
    db.collection('configuracion').doc('ticker').onSnapshot(doc => {
        if (doc.exists) document.getElementById('ticker-contenido').innerHTML = `<span class="ticker-item"><i class="fas fa-bullhorn"></i> MBL ARG: ${doc.data().mensaje}</span>`;
    });

    // CARGAR SECCIONES
    cargarTorneosDesdeNube();
    cargarAnunciosGremio();
    cargarVideosAbismo();
    cargarTopClanes();
    cargarHallOfFame();
});

// FUNCIÓN HALL OF FAME
function cargarHallOfFame() {
    const podio = document.getElementById('podio-leyendas');
    if(!podio) return;
    db.collection('ninjas').where('torneosGanados', '>', 0).orderBy('torneosGanados', 'desc').limit(3).onSnapshot(snap => {
        if(snap.empty) { podio.innerHTML = '<p style="color: #666; width: 100%; text-align: center;">La historia recién comienza... ¿Quién será el primero?</p>'; return; }
        podio.innerHTML = "";
        let leyendas = []; snap.forEach(doc => leyendas.push(doc.data()));
        if (leyendas[1]) podio.innerHTML += crearCartaPodio(leyendas[1], 2);
        if (leyendas[0]) podio.innerHTML += crearCartaPodio(leyendas[0], 1);
        if (leyendas[2]) podio.innerHTML += crearCartaPodio(leyendas[2], 3);
    });
}

function crearCartaPodio(ninja, rank) {
    let imgSrc = ninja.fotoPerfil || `https://ui-avatars.com/api/?name=${ninja.nick}`;
    return `<div class="podium-spot rank-${rank}"><img src="${imgSrc}"><h4 style="color:white;">${ninja.nick}</h4><span style="color:var(--green);"><i class="fas fa-trophy"></i> ${ninja.torneosGanados}</span></div>`;
}

// RESTAURACIÓN GREMIO (ESTO ARREGLA EL ABISMO)
function cargarAnunciosGremio() { 
    const lista = document.getElementById('lista-anuncios'); if(!lista) return; 
    db.collection('anuncios_gremio').orderBy('timestamp', 'desc').limit(15).onSnapshot(snap => { 
        lista.innerHTML = snap.empty ? "<p>Vacio</p>" : "";
        snap.forEach(doc => { 
            const d = doc.data(); 
            lista.innerHTML += `<div style="background:#111; padding:10px; margin-bottom:5px; border-radius:5px;"><strong>${d.usuario}</strong> busca ${d.busco}</div>`; 
        }); 
    }); 
}

// ABISMO
function cargarVideosAbismo() {
    const lista = document.getElementById('lista-abismo'); if(!lista) return;
    db.collection('abismo_videos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        lista.innerHTML = snap.empty ? '<p>Silencio en el abismo...</p>' : '';
        snap.forEach(doc => {
            const d = doc.data();
            lista.innerHTML += `<div class="container-glass" style="margin-bottom:15px;"><iframe src="${d.url}" style="width:100%; height:300px; border:none; border-radius:8px;"></iframe><p>${d.usuario}</p></div>`;
        });
    });
}

// OTROS (TORNEOS, TIENDA, ETC - MANTENER LÓGICA V3.22)
function renderizarTienda() { /* Lógica de renderizado de v3.22 */ }
function cargarTorneosDesdeNube() { /* Lógica de torneos de v3.22 */ }
function cargarTopClanes() { /* Lógica de clanes de v3.22 */ }
function abrirPerfil(nick) { /* Lógica de perfil de v3.22 */ }
function extraerIdLimpio(url, plat) { /* Lógica de ID de v3.22 */ }
function cambiarStreamLocal(plat, user) { /* Lógica de stream de v3.22 */ }
