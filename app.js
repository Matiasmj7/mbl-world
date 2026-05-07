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

const CATALOGO_TIENDA = [
    { id: 'borde_fuego', nombre: 'Aura de Fuego', tipo: 'borde', precio: 300, desc: 'Efecto ardiente para tu avatar.', estilo: 'border: 3px solid #ff4500; box-shadow: 0 0 10px #ff4500;' },
    { id: 'color_dorado', nombre: 'Voz de Oro', tipo: 'colorChat', precio: 150, desc: 'Tu nombre brillará en oro en el chat.', estilo: 'color: gold; text-shadow: 0 0 5px gold;' },
    { id: 'pin_shuriken', nombre: 'Pin Shuriken', tipo: 'pin', precio: 200, desc: 'Insignia básica del guerrero.', icon: '<i class="fas fa-dharmachakra"></i>' }
];

document.addEventListener('DOMContentLoaded', () => {
    
    // MONITOR DE USUARIO
    auth.onAuthStateChanged(user => {
        const userDisplay = document.getElementById('user-display');
        const adminNav = document.getElementById('admin-nav');
        const adminSection = document.getElementById('admin');

        if(user) {
            currentUserId = user.uid;
            db.collection('ninjas').doc(user.uid).onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data(); 
                    currentUserName = data.nick; 
                    misRyos = data.ryos || 0; 
                    miInventario = data.inventario || [];
                    miEquipamiento = data.equipado || { borde: '', colorChat: '', pin: '' };

                    if(userDisplay) userDisplay.innerText = currentUserName;
                    document.getElementById('user-greeting').innerText = currentUserName;
                    document.getElementById('mi-nick-bingo').innerText = currentUserName;
                    document.getElementById('mi-xp-bingo').innerText = `${data.xp || 0} XP`;
                    document.getElementById('mi-ryos-bingo').innerText = `${misRyos} Ryos`;
                    document.getElementById('tienda-mis-ryos').innerText = `${misRyos} Ryos`;
                    
                    if(user.email === ADMIN_EMAIL) {
                        if(adminNav) adminNav.style.display = 'block';
                        if(adminSection) adminSection.style.display = 'block';
                    }
                    renderizarTienda();
                } else { window.location.hash = "#modal-registro-nick"; }
            });
        } else {
            currentUserName = "Ninja Anónimo";
            if(userDisplay) userDisplay.innerText = "Ingresar";
        }
    });

    // CARGA DE DATOS
    escucharTicker();
    cargarEventos();
    cargarHallOfFame();
    cargarVideosAbismo();
    cargarGremio();
    cargarTopIndividual();
});

// --- TIENDA ---
function renderizarTienda() {
    const tienda = document.getElementById('catalogo-tienda');
    if(!tienda) return;
    tienda.innerHTML = "";
    CATALOGO_TIENDA.forEach(item => {
        const yaLoTiene = miInventario.includes(item.id);
        const btnTexto = yaLoTiene ? "EQUIPAR" : `ADQUIRIR (${item.precio} R)`;
        tienda.innerHTML += `
            <div class="container-glass" style="text-align:center;">
                <h4 style="color:var(--blue);">${item.nombre}</h4>
                <p style="font-size:0.8rem; color:#888; margin: 10px 0;">${item.desc}</p>
                <button class="btn-primary" style="width:100%;" onclick="accionTienda('${item.id}', ${item.precio}, '${item.tipo}')">${btnTexto}</button>
            </div>`;
    });
}

async function accionTienda(id, precio, tipo) {
    if(!miInventario.includes(id)) {
        if(misRyos < precio) return alert("Ryos insuficientes.");
        await db.collection('ninjas').doc(currentUserId).update({
            ryos: firebase.firestore.FieldValue.increment(-precio),
            inventario: firebase.firestore.FieldValue.arrayUnion(id)
        });
        alert("¡Objeto añadido a tu equipo!");
    } else {
        const equip = {...miEquipamiento}; equip[tipo] = id;
        await db.collection('ninjas').doc(currentUserId).update({ equipado: equip });
        alert("¡Estilo actualizado!");
    }
}

// --- ABISMO ---
function cargarVideosAbismo() {
    const lista = document.getElementById('lista-abismo');
    db.collection('abismo_videos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        lista.innerHTML = "";
        snap.forEach(doc => {
            const d = doc.data();
            lista.innerHTML += `
                <div class="container-glass">
                    <iframe src="${d.url}" style="width:100%; height:250px; border:none; border-radius:8px;"></iframe>
                    <p style="margin-top:10px; font-size:0.8rem; font-weight:bold; color:var(--blue);">${d.usuario}</p>
                </div>`;
        });
    });
}

// --- TORNEOS Y LIGAS ---
function cargarEventos() {
    const listaT = document.getElementById('lista-torneos');
    const listaL = document.getElementById('lista-ligas');
    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        listaT.innerHTML = ""; listaL.innerHTML = "";
        snap.forEach(doc => {
            const d = doc.data();
            const tarjeta = `
                <div class="container-glass card-t">
                    <h3 style="margin-bottom:10px;">${d.nombre}</h3>
                    <p style="color:#ccc; font-size:0.9rem;">Premio: <span style="color:var(--green); font-weight:bold;">${d.premio}</span></p>
                    <p style="color:#888; font-size:0.8rem; margin-bottom:15px;">Participantes: ${d.lista_inscriptos?.length || 0} / ${d.cupos || '∞'}</p>
                    <button class="btn-primary" onclick="unirseEvento('${doc.id}')" style="width:100%;">UNIRSE</button>
                </div>`;
            if(d.tipo === 'liga') listaL.innerHTML += tarjeta;
            else listaT.innerHTML += tarjeta;
        });
    });
}

async function unirseEvento(id) {
    if(currentUserName === "Ninja Anónimo") return alert("Debes ingresar primero.");
    await db.collection('torneos').doc(id).update({
        lista_inscriptos: firebase.firestore.FieldValue.arrayUnion(currentUserName)
    });
    alert("¡Inscrito en el evento!");
}

// --- SALÓN DE LA FAMA ---
function cargarHallOfFame() {
    const podio = document.getElementById('podio-leyendas');
    db.collection('ninjas').where('torneosGanados', '>', 0).orderBy('torneosGanados', 'desc').limit(3).onSnapshot(snap => {
        if(snap.empty) { podio.innerHTML = "<p>Buscando leyendas...</p>"; return; }
        podio.innerHTML = "";
        let ninjas = []; snap.forEach(d => ninjas.push(d.data()));
        if(ninjas[1]) podio.innerHTML += `<div class="podium-spot"><h4>2°</h4><img src="${ninjas[1].fotoPerfil || ''}"><h5>${ninjas[1].nick}</h5><p>${ninjas[1].torneosGanados} Copas</p></div>`;
        if(ninjas[0]) podio.innerHTML += `<div class="podium-spot rank-1"><h4>1°</h4><img src="${ninjas[0].fotoPerfil || ''}"><h5>${ninjas[0].nick}</h5><p>${ninjas[0].torneosGanados} Copas</p></div>`;
        if(ninjas[2]) podio.innerHTML += `<div class="podium-spot"><h4>3°</h4><img src="${ninjas[2].fotoPerfil || ''}"><h5>${ninjas[2].nick}</h5><p>${ninjas[2].torneosGanados} Copas</p></div>`;
    });
}

// --- TICKER ---
function escucharTicker() {
    db.collection('configuracion').doc('ticker').onSnapshot(doc => {
        if(doc.exists) {
            document.getElementById('ticker-contenido').innerHTML = `<span class="ticker-item"><i class="fas fa-bullhorn"></i> NOTICIA: ${doc.data().mensaje}</span>`;
        }
    });
}

// --- BINGO Y OTROS ---
function cargarTopIndividual() {
    const lista = document.getElementById('ranking-dinamico');
    db.collection('ninjas').orderBy('xp', 'desc').limit(10).onSnapshot(snap => {
        lista.innerHTML = "";
        snap.forEach((doc, i) => {
            const d = doc.data();
            lista.innerHTML += `<div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid #222;"><span>${i+1}. ${d.nick}</span><span style="color:gold;">${d.xp} XP</span></div>`;
        });
    });
}

function misionDiaria() {
    db.collection('ninjas').doc(currentUserId).update({ ryos: firebase.firestore.FieldValue.increment(10) });
    alert("¡Has trabajado duro! +10 Ryos añadidos.");
}

function cerrarSesion() { auth.signOut().then(() => window.location.reload()); }

// --- ADMIN ---
const formTicker = document.getElementById('form-config-ticker');
if(formTicker) {
    formTicker.addEventListener('submit', (e) => {
        e.preventDefault();
        db.collection('configuracion').doc('ticker').set({ mensaje: document.getElementById('input-ticker').value });
        alert("Ticker actualizado.");
    });
}

const formTorneo = document.getElementById('form-torneo');
if(formTorneo) {
    formTorneo.addEventListener('submit', (e) => {
        e.preventDefault();
        db.collection('torneos').add({
            nombre: document.getElementById('t-nombre').value,
            premio: document.getElementById('t-premio').value,
            cupos: document.getElementById('t-cupos').value,
            tipo: document.getElementById('t-tipo').value,
            lista_inscriptos: [],
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Evento publicado.");
    });
}
