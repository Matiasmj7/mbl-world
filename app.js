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

const CATALOGO_TIENDA = [
    { id: 'borde_fuego', nombre: 'Aura de Fuego', tipo: 'borde', precio: 300, desc: 'Efecto ardiente para tu avatar.', estilo: 'border: 3px solid #ff4500; box-shadow: 0 0 10px #ff4500;' },
    { id: 'color_dorado', nombre: 'Voz de Oro', tipo: 'colorChat', precio: 150, desc: 'Nombre dorado en el chat.', estilo: 'color: gold; text-shadow: 0 0 5px gold;' },
    { id: 'pin_shuriken', nombre: 'Pin Shuriken', tipo: 'pin', precio: 200, desc: 'Insignia básica ninja.', icon: '<i class="fas fa-dharmachakra"></i>' }
];

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if(user) {
            currentUserId = user.uid;
            db.collection('ninjas').doc(user.uid).onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data(); 
                    currentUserName = data.nick; 
                    misRyos = data.ryos || 0; 
                    miInventario = data.inventario || [];
                    miEquipamiento = data.equipado || { borde: '', colorChat: '', pin: '' };

                    document.getElementById('user-display').innerText = currentUserName;
                    document.getElementById('user-greeting').innerText = currentUserName;
                    document.getElementById('mi-nick-bingo').innerText = currentUserName;
                    document.getElementById('mi-ryos-bingo').innerText = `${misRyos} Ryos`;
                    document.getElementById('tienda-mis-ryos').innerText = `${misRyos} Ryos`;
                    
                    if(user.email === ADMIN_EMAIL) document.getElementById('admin-nav').style.display = 'block';
                    renderizarTienda();
                } else { window.location.hash = "#modal-registro-nick"; }
            });
        }
    });

    escucharTicker();
    cargarTorneosYLeagues();
    cargarHallOfFame();
    cargarVideosAbismo();
    cargarTopClanes();
});

// --- LÓGICA DE TIENDA (RESTAURADA) ---
function renderizarTienda() {
    const tienda = document.getElementById('catalogo-tienda');
    if(!tienda) return;
    tienda.innerHTML = "";
    CATALOGO_TIENDA.forEach(item => {
        const yaLoTiene = miInventario.includes(item.id);
        const btnTexto = yaLoTiene ? "Equipar" : `Comprar (${item.precio} R)`;
        tienda.innerHTML += `
            <div class="container-glass" style="text-align:center;">
                <h4>${item.nombre}</h4>
                <p style="font-size:0.8rem; color:#888;">${item.desc}</p>
                <button class="btn-primary" style="width:100%; margin-top:10px;" onclick="procesarTienda('${item.id}', ${item.precio}, '${item.tipo}')">${btnTexto}</button>
            </div>`;
    });
}

async function procesarTienda(id, precio, tipo) {
    if(!miInventario.includes(id)) {
        if(misRyos < precio) return alert("No tienes suficientes Ryos.");
        await db.collection('ninjas').doc(currentUserId).update({
            ryos: firebase.firestore.FieldValue.increment(-precio),
            inventario: firebase.firestore.FieldValue.arrayUnion(id)
        });
        alert("¡Objeto adquirido!");
    } else {
        const equip = {...miEquipamiento}; equip[tipo] = id;
        await db.collection('ninjas').doc(currentUserId).update({ equipado: equip });
        alert("¡Equipado con éxito!");
    }
}

// --- LÓGICA DE VIDEOS ABISMO (RESTAURADA) ---
function cargarVideosAbismo() {
    const lista = document.getElementById('lista-abismo');
    db.collection('abismo_videos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        lista.innerHTML = "";
        snap.forEach(doc => {
            const d = doc.data();
            lista.innerHTML += `<div class="container-glass"><iframe src="${d.url}" style="width:100%; height:200px; border:none; border-radius:8px;"></iframe><p style="margin-top:5px; font-size:0.8rem;">Por: ${d.usuario}</p></div>`;
        });
    });
}

// --- LÓGICA DE TORNEOS Y LIGAS ---
function cargarTorneosYLeagues() {
    const listaT = document.getElementById('lista-torneos');
    const listaL = document.getElementById('lista-ligas');
    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        listaT.innerHTML = ""; listaL.innerHTML = "";
        snap.forEach(doc => {
            const d = doc.data();
            const tarjeta = `<div class="container-glass card-t"><h4>${d.nombre}</h4><p>Premio: ${d.premio}</p><button class="btn-primary" onclick="unirse('${doc.id}')" style="margin-top:10px; width:100%;">UNIRSE</button></div>`;
            if(d.tipo === 'liga') listaL.innerHTML += tarjeta;
            else listaT.innerHTML += tarjeta;
        });
    });
}

function escucharTicker() {
    db.collection('configuracion').doc('ticker').onSnapshot(doc => {
        if(doc.exists) document.getElementById('ticker-contenido').innerHTML = `<span class="ticker-item"><i class="fas fa-bullhorn"></i> MBL ARG: ${doc.data().mensaje}</span>`;
    });
}

function cargarHallOfFame() {
    const podio = document.getElementById('podio-leyendas');
    db.collection('ninjas').where('torneosGanados', '>', 0).orderBy('torneosGanados', 'desc').limit(3).onSnapshot(snap => {
        if(snap.empty) { podio.innerHTML = "<p>La historia comienza hoy...</p>"; return; }
        podio.innerHTML = "";
        let ninjas = []; snap.forEach(d => ninjas.push(d.data()));
        if(ninjas[1]) podio.innerHTML += `<div class="podium-spot"><h4>2°</h4><img src="${ninjas[1].fotoPerfil || ''}"><h5>${ninjas[1].nick}</h5></div>`;
        if(ninjas[0]) podio.innerHTML += `<div class="podium-spot rank-1"><h4>1°</h4><img src="${ninjas[0].fotoPerfil || ''}"><h5>${ninjas[0].nick}</h5></div>`;
        if(ninjas[2]) podio.innerHTML += `<div class="podium-spot"><h4>3°</h4><img src="${ninjas[2].fotoPerfil || ''}"><h5>${ninjas[2].nick}</h5></div>`;
    });
}

function cargarTopClanes() {
    const lista = document.getElementById('lista-top-clanes');
    db.collection('clanes').orderBy('xp', 'desc').limit(5).onSnapshot(snap => {
        lista.innerHTML = "";
        snap.forEach(doc => { const d = doc.data(); lista.innerHTML += `<p>${d.nombre} - ${d.xp} XP</p>`; });
    });
}

function misionDiaria() {
    db.collection('ninjas').doc(currentUserId).update({ ryos: firebase.firestore.FieldValue.increment(10) });
    alert("¡Ganaste 10 Ryos por tu trabajo!");
}

function cerrarSesion() { auth.signOut().then(() => window.location.reload()); }
