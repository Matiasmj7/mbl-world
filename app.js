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
let misRyos = 0;
let miInventario = [];
let miEquipamiento = { borde: '', colorChat: '', pin: '' };
let miPerfilActual = {};

// CATÁLOGO DE LA TIENDA
const CATALOGO_TIENDA = [
    { id: 'borde_fuego', nombre: 'Aura de Fuego', tipo: 'borde', precio: 300, desc: 'Borde ardiente.', estilo: 'border: 3px solid #ff4500; box-shadow: 0 0 10px #ff4500;' },
    { id: 'color_dorado', nombre: 'Voz Dorada', tipo: 'colorChat', precio: 150, desc: 'Nombre en oro.', estilo: 'color: gold; text-shadow: 0 0 5px gold;' },
    { id: 'pin_shuriken', nombre: 'Pin Shuriken', tipo: 'pin', precio: 200, desc: 'Insignia ninja.', icon: '<i class="fas fa-dharmachakra"></i>' }
];

document.addEventListener('DOMContentLoaded', () => {
    
    // MONITOR DE USUARIO
    auth.onAuthStateChanged(user => {
        const adminNav = document.getElementById('admin-nav');
        const adminSection = document.getElementById('admin');
        const userDisplay = document.getElementById('user-display');

        if(user) {
            currentUserId = user.uid;
            db.collection('ninjas').doc(user.uid).onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data(); 
                    miPerfilActual = data; 
                    currentUserName = data.nick; 
                    misRyos = data.ryos || 0; 
                    miInventario = data.inventario || []; 
                    miEquipamiento = data.equipado || { borde: '', colorChat: '', pin: '' };

                    if(userDisplay) { userDisplay.innerText = currentUserName; userDisplay.classList.add('btn-auth'); }
                    document.getElementById('user-greeting').innerText = currentUserName;
                    document.getElementById('mi-nick-bingo').innerText = currentUserName;
                    document.getElementById('mi-xp-bingo').innerText = `${data.xp || 0} XP`;
                    document.getElementById('mi-ryos-bingo').innerHTML = `<i class="fas fa-coins"></i> ${misRyos} Ryos`;
                    document.getElementById('tienda-mis-ryos').innerHTML = `<i class="fas fa-coins"></i> ${misRyos} Ryos`;
                    
                    renderizarTienda();
                    if(user.email === ADMIN_EMAIL) { 
                        if(adminNav) adminNav.style.display = 'block'; 
                        if(adminSection) adminSection.style.display = 'block'; 
                    }
                } else { window.location.hash = "#modal-registro-nick"; }
            });
        } else {
            currentUserName = "Ninja Anónimo";
            if(userDisplay) { userDisplay.innerText = "Ingresar"; userDisplay.classList.add('btn-auth'); }
        }
    });

    // TICKER DE NOTICIAS
    db.collection('configuracion').doc('ticker').onSnapshot(doc => {
        if (doc.exists) {
            document.getElementById('ticker-contenido').innerHTML = `<span class="ticker-item"><i class="fas fa-bullhorn"></i> MBL ARG: ${doc.data().mensaje}</span>`;
        }
    });

    // CARGAR SECCIONES DINÁMICAS
    cargarTorneosDesdeNube();
    cargarAnunciosGremio();
    cargarVideosAbismo();
    cargarTopClanes();
    cargarHallOfFame();
});

// --- FUNCIONES DEL SALÓN DE LA FAMA ---
function cargarHallOfFame() {
    const podio = document.getElementById('podio-leyendas');
    db.collection('ninjas').where('torneosGanados', '>', 0).orderBy('torneosGanados', 'desc').limit(3).onSnapshot(snap => {
        if(snap.empty) { 
            podio.innerHTML = '<p style="color: #666; width: 100%; text-align: center;">La historia recién comienza...</p>'; 
            return; 
        }
        let leyendas = []; snap.forEach(doc => leyendas.push(doc.data()));
        podio.innerHTML = "";
        if (leyendas[1]) podio.innerHTML += crearCartaPodio(leyendas[1], 2);
        if (leyendas[0]) podio.innerHTML += crearCartaPodio(leyendas[0], 1);
        if (leyendas[2]) podio.innerHTML += crearCartaPodio(leyendas[2], 3);
    });
}

function crearCartaPodio(ninja, rank) {
    let imgSrc = ninja.fotoPerfil || `https://ui-avatars.com/api/?name=${ninja.nick}`;
    return `<div class="podium-spot rank-${rank}"><img src="${imgSrc}"><h4>${ninja.nick}</h4><span style="color:var(--green); font-weight:bold;"><i class="fas fa-trophy"></i> ${ninja.torneosGanados}</span></div>`;
}

// --- FUNCIONES DEL ABISMO ---
function cargarVideosAbismo() {
    const lista = document.getElementById('lista-abismo');
    db.collection('abismo_videos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        lista.innerHTML = "";
        snap.forEach(doc => {
            const d = doc.data();
            lista.innerHTML += `
                <div class="container-glass" style="margin-bottom:20px;">
                    <iframe src="${d.url}" style="width:100%; height:320px; border:none; border-radius:8px;"></iframe>
                    <p style="margin-top:10px; color:var(--blue); font-weight:bold;"><i class="fas fa-user"></i> ${d.usuario}</p>
                </div>`;
        });
    });
}

// --- FUNCIONES DE LA TIENDA ---
function renderizarTienda() {
    const catalogo = document.getElementById('catalogo-tienda');
    if(!catalogo) return;
    catalogo.innerHTML = "";
    CATALOGO_TIENDA.forEach(item => {
        const loTiene = miInventario.includes(item.id);
        const loTieneEquipado = (miEquipamiento.borde === item.id || miEquipamiento.colorChat === item.id || miEquipamiento.pin === item.id);
        let btnHTML = `<button class="btn-primary" style="width:100%" onclick="comprarObjeto('${item.id}', ${item.precio})">Comprar (${item.precio} R)</button>`;
        if(loTieneEquipado) btnHTML = `<button class="btn-primary" style="width:100%; background:var(--green); color:black;" disabled>Equipado</button>`;
        else if(loTiene) btnHTML = `<button class="btn-primary" style="width:100%; background:var(--blue); color:black;" onclick="equiparObjeto('${item.id}', '${item.tipo}')">Equipar</button>`;
        
        catalogo.innerHTML += `<div class="container-glass" style="text-align:center;"><h4>${item.nombre}</h4><p style="font-size:0.8rem; color:#888; margin-bottom:15px;">${item.desc}</p>${btnHTML}</div>`;
    });
}

function comprarObjeto(id, precio) {
    if(misRyos < precio) return alert("Ryos insuficientes.");
    if(confirm(`¿Comprar por ${precio} Ryos?`)) {
        db.collection('ninjas').doc(currentUserId).update({ ryos: misRyos - precio, inventario: firebase.firestore.FieldValue.arrayUnion(id) });
    }
}

function equiparObjeto(id, tipo) {
    const nuevoEquip = {...miEquipamiento}; nuevoEquip[tipo] = id;
    db.collection('ninjas').doc(currentUserId).update({ equipado: nuevoEquip }).then(() => alert("¡Equipado!"));
}

// --- FUNCIONES DE TORNEOS Y GREMIO ---
function cargarTorneosDesdeNube() {
    const lista = document.getElementById('lista-torneos');
    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        lista.innerHTML = "";
        snap.forEach(doc => {
            const d = doc.data();
            lista.innerHTML += `<div class="container-glass card-t"><h3>${d.nombre}</h3><p>Modo: ${d.formato}</p><p>Premio: ${d.premio}</p><button class="btn-primary" style="margin-top:10px;" onclick="unirseTorneo('${doc.id}')">UNIRSE</button></div>`;
        });
    });
}

function unirseTorneo(id) {
    if(currentUserName === "Ninja Anónimo") return alert("Ingresa primero.");
    db.collection('torneos').doc(id).update({ lista_inscriptos: firebase.firestore.FieldValue.arrayUnion(currentUserName) }).then(() => alert("¡Inscripto!"));
}

function cargarAnunciosGremio() {
    const lista = document.getElementById('lista-anuncios');
    db.collection('anuncios_gremio').orderBy('timestamp', 'desc').onSnapshot(snap => {
        lista.innerHTML = "";
        snap.forEach(doc => {
            const d = doc.data();
            lista.innerHTML += `<div style="background:#111; padding:10px; margin-bottom:5px; border-radius:5px; border-left:3px solid var(--blue);"><strong>${d.usuario}:</strong> ${d.mensaje}</div>`;
        });
    });
}

function misionDiaria() {
    const btn = document.getElementById('btn-trabajar');
    btn.disabled = true; btn.innerText = "Trabajando...";
    setTimeout(() => {
        db.collection('ninjas').doc(currentUserId).update({ ryos: firebase.firestore.FieldValue.increment(10) }).then(() => {
            alert("¡Ganaste 10 Ryos!"); btn.disabled = false; btn.innerText = "Trabajar (+10 R)";
        });
    }, 1500);
}

function cargarTopClanes() {
    const lista = document.getElementById('lista-top-clanes');
    db.collection('clanes').orderBy('xp', 'desc').limit(5).onSnapshot(snap => {
        lista.innerHTML = "";
        snap.forEach(doc => { const d = doc.data(); lista.innerHTML += `<p>${d.nombre} - ${d.xp} XP</p>`; });
    });
}

function cerrarSesion() { auth.signOut().then(() => window.location.reload()); }
