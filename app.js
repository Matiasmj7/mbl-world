// ==========================================
// CONFIGURACIÓN FIREBASE Y VARIABLES GLOBALES
// ==========================================
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
const storage = firebase.storage();

const ADMIN_EMAIL = "matias.moto7@gmail.com";
let currentUserName = "Héroe Anónimo";
let currentUserId = null;
let miClan = "";
let miComunidad = ""; 
let misRyos = 0;
let miPlan = "genin";
let miInventario = [];
let miEquipamiento = { borde: '', colorChat: '', pin: '' };
let currentFilter = 'todos'; 
let trabajando = false; 
let miPerfilActual = {};
let unsubscribeChatComunidad = null; 

const CATALOGO_TIENDA = [
    { id: 'borde_fuego', nombre: 'Aura de Fuego', tipo: 'borde', precio: 300, desc: 'Borde ardiente.', estilo: 'border: 3px solid #ff4500; box-shadow: 0 0 10px #ff4500;' },
    { id: 'borde_hielo', nombre: 'Aura de Hielo', tipo: 'borde', precio: 300, desc: 'Congela a tus rivales.', estilo: 'border: 3px solid #00d2ff; box-shadow: 0 0 10px #00d2ff;' },
    { id: 'borde_sombra', nombre: 'Sombra del Abismo', tipo: 'borde', precio: 600, desc: 'Oscuridad pura.', estilo: 'border: 3px solid #1a1a1a; box-shadow: 0 0 15px #8a2be2;' },
    { id: 'borde_esmeralda', nombre: 'Aura Esmeralda', tipo: 'borde', precio: 350, desc: 'Brillo tóxico.', estilo: 'border: 3px solid #39ff14; box-shadow: 0 0 10px #39ff14;' },
    { id: 'borde_sangre', nombre: 'Aura de Sangre', tipo: 'borde', precio: 400, desc: 'Rojo carmesí.', estilo: 'border: 3px solid #ff0000; box-shadow: 0 0 15px #ff0000;' },
    { id: 'color_dorado', nombre: 'Voz Dorada', tipo: 'colorChat', precio: 150, desc: 'Nombre en oro.', estilo: 'color: gold; text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);' },
    { id: 'color_veneno', nombre: 'Voz Tóxica', tipo: 'colorChat', precio: 150, desc: 'Verde venenoso.', estilo: 'color: #39ff14; text-shadow: 0 0 5px rgba(57, 255, 20, 0.5);' },
    { id: 'color_hielo', nombre: 'Voz Gélida', tipo: 'colorChat', precio: 150, desc: 'Celeste brillante.', estilo: 'color: #00d2ff; text-shadow: 0 0 5px rgba(0, 210, 255, 0.5);' },
    { id: 'color_sangre', nombre: 'Voz Sanguinaria', tipo: 'colorChat', precio: 150, desc: 'Rojo sangre.', estilo: 'color: #ff0000; text-shadow: 0 0 5px rgba(255, 0, 0, 0.5);' },
    { id: 'color_rosa', nombre: 'Voz Sakura', tipo: 'colorChat', precio: 150, desc: 'Rosa cerezo.', estilo: 'color: #ffb7c5; text-shadow: 0 0 5px rgba(255, 183, 197, 0.5);' },
    { id: 'pin_shuriken', nombre: 'Pin Shuriken', tipo: 'pin', precio: 200, desc: 'Insignia básica.', icon: '<i class="fas fa-dharmachakra" style="color: #ccc; filter: drop-shadow(0 0 2px #fff);"></i>' },
    { id: 'pin_mitico', nombre: 'Pin Mítico', tipo: 'pin', precio: 500, desc: 'Insignia élite.', icon: '<i class="fas fa-dragon" style="color: #ff007f; filter: drop-shadow(0 0 5px #ff007f);"></i>' },
    { id: 'pin_rey', nombre: 'Corona del Rey', tipo: 'pin', precio: 1000, desc: 'Para reyes.', icon: '<i class="fas fa-crown" style="color: gold; filter: drop-shadow(0 0 5px gold);"></i>' },
    { id: 'pin_fantasma', nombre: 'Pin Fantasma', tipo: 'pin', precio: 600, desc: 'Misterioso.', icon: '<i class="fas fa-ghost" style="color: white; filter: drop-shadow(0 0 5px white);"></i>' }
];

// ==========================================
// INICIALIZACIÓN Y SESIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        const userDisplay = document.getElementById('user-display');
        const adminNav = document.getElementById('admin-nav');
        const adminSection = document.getElementById('admin');

        if(user) {
            currentUserId = user.uid;
            db.collection('ninjas').doc(user.uid).onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    if(data.banned) { alert("Has sido expulsado."); auth.signOut(); return; }

                    miPerfilActual = data; 
                    currentUserName = data.nick; 
                    miClan = data.clan || ""; 
                    miComunidad = data.comunidad || "";
                    misRyos = data.ryos || 0; 
                    miPlan = data.plan || "genin";
                    miInventario = data.inventario || []; 
                    miEquipamiento = data.equipado || { borde: '', colorChat: '', pin: '' };

                    if(userDisplay) { userDisplay.innerText = currentUserName; userDisplay.href = "#"; }
                    
                    document.getElementById('user-greeting').innerText = currentUserName;
                    document.getElementById('mi-nick-bingo').innerText = currentUserName;
                    document.getElementById('mi-rango-bingo').innerText = (data.plan === 'kasekage') ? 'Mítico' : (data.plan === 'jonin' ? 'Épico' : 'Guerrero');
                    document.getElementById('mi-xp-bingo').innerText = `${data.xp || 0} XP`;
                    document.getElementById('mi-ryos-bingo').innerHTML = `<i class="fas fa-gem"></i> ${misRyos} Diamantes`;
                    document.getElementById('tienda-mis-ryos').innerHTML = `${misRyos} Diamantes`;
                    document.getElementById('btn-notif').style.display = 'inline-block';
                    
                    renderizarTienda();
                    const esAdmin = (user.email === ADMIN_EMAIL || data.email_oculto === ADMIN_EMAIL);
                    
                    if (miComunidad !== "") {
                        document.getElementById('vista-sin-comunidad').style.display = 'none';
                        document.getElementById('vista-con-comunidad').style.display = 'flex';
                        document.getElementById('nombre-mi-comunidad').innerText = miComunidad;
                    } else {
                        document.getElementById('vista-sin-comunidad').style.display = 'block';
                        document.getElementById('vista-con-comunidad').style.display = 'none';
                    }

                    if (esAdmin) {
                        document.getElementById('vista-sin-comunidad').style.display = 'none';
                        document.getElementById('vista-con-comunidad').style.display = 'flex';
                        document.getElementById('nombre-mi-comunidad').innerText = "Vigilancia Creador";
                        document.getElementById('kage-comunidad-selector-container').style.display = 'block';
                        document.getElementById('btn-abandonar-comunidad').style.display = 'none';
                        cargarSelectorComunidadesKage();
                    } else if (miComunidad !== "") { escucharChatComunidad(miComunidad); }

                    if(esAdmin || miPlan === 'jonin' || miPlan === 'kasekage') {
                        if(adminNav) adminNav.style.display = 'block';
                        if(adminSection) adminSection.style.display = 'block';
                        document.getElementById('titulo-panel-admin').innerText = esAdmin ? 'Centro de Mando del Creador' : 'Panel de Organización';
                        document.getElementById('btn-admin-nav').innerText = esAdmin ? 'Creador' : 'Organizador';
                        
                        document.querySelectorAll('.admin-only').forEach(el => el.style.display = esAdmin ? 'inline-block' : 'none');
                        cargarTorneosParaAdminLlaves();
                        cargarListaBorrarTorneosAdmin();
                    }
                } else { window.location.hash = "#modal-registro-nick"; }
            });
            escucharNotificaciones();
        } else {
            currentUserName = "Héroe Anónimo";
            if(userDisplay) { userDisplay.innerText = "Ingresar"; userDisplay.href = "#modal-login"; }
            document.getElementById('btn-notif').style.display = 'none';
        }
    });

    document.getElementById('form-registro-nick').addEventListener('submit', (e) => {
        e.preventDefault();
        const nuevoNick = document.getElementById('nuevo-nick').value.trim();
        db.collection('ninjas').doc(currentUserId).set({
            nick: nuevoNick, xp: 0, ryos: 100, torneosGanados: 0, rango: "Guerrero", clan: "", comunidad: "", plan: "genin", banned: false, inventario: [], equipado: {borde: '', colorChat: '', pin: ''}, fotoPerfil: "", bio: "", redSocial: "", email_oculto: auth.currentUser.email || "manual@mblarg.com", fecha_registro: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => { alert("¡Identidad Forjada!"); window.location.hash = "#"; window.location.reload(); });
    });

    escucharPersonalizacion(); escucharTicker(); escucharStreamYDiscordGlobal(); cargarTorneosDesdeNube(); cargarSorteos(); cargarHallOfFame(); cargarVideosAbismo(); cargarTopClanes(); cargarAnunciosGremio(); cargarTopIndividualBingo(); escucharTabernaGlobal(); configurarAdminForms(); cargarTopComunidades();
});

// ==========================================
// NUEVO: SISTEMA AUTH MANUAL (NO GOOGLE)
// ==========================================
function cambiarSeccionAuth(mostrarRegistro) {
    document.getElementById('login-normal-section').style.display = mostrarRegistro ? 'none' : 'block';
    document.getElementById('register-manual-section').style.display = mostrarRegistro ? 'block' : 'none';
}
function registrarUsuarioManual() {
    const user = document.getElementById('reg-usuario').value.trim().toLowerCase();
    const pass = document.getElementById('reg-pass').value.trim();
    if(user.length < 4 || pass.length < 6) return alert("Usuario min 4 letras, clave min 6.");
    auth.createUserWithEmailAndPassword(`${user}@mblarg.com`, pass).then(() => {
        alert("¡Cuenta Creada!"); window.location.hash = "#modal-registro-nick";
    }).catch(() => alert("El usuario ya existe o no es válido."));
}
function autenticarUsuarioManual() {
    const user = document.getElementById('login-email-falso').value.trim().toLowerCase();
    const pass = document.getElementById('login-pass').value.trim();
    const email = user.includes('@') ? user : `${user}@mblarg.com`;
    auth.signInWithEmailAndPassword(email, pass).then(() => {
        alert("¡Acceso correcto!"); window.location.hash = "#";
    }).catch(() => alert("Credenciales incorrectas."));
}

// ==========================================
// NUEVO: PANEL ADMINISTRATIVO DE BORRADO Y RESET
// ==========================================
function cargarListaBorrarTorneosAdmin() {
    const cont = document.getElementById('admin-lista-borrar-torneos'); if(!cont) return;
    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        cont.innerHTML = "";
        if(snap.empty) { cont.innerHTML = "<p style='color:#888;'>No hay torneos activos.</p>"; return; }
        snap.forEach(doc => {
            const d = doc.data();
            cont.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.5); padding:10px; border-radius:5px; margin-bottom:5px; border:1px solid #222;">
                    <span style="color:#fff;">${d.nombre} (${d.formato})</span>
                    <button class="btn-primary" style="background:var(--red); color:white; padding:4px 10px; font-size:0.8rem;" onclick="borrarTorneoDefinitivo('${doc.id}','${d.nombre}')">ELIMINAR</button>
                </div>`;
        });
    });
}
function borrarTorneoDefinitivo(id, nombre) {
    if(confirm(`🚨 ¿ELIMINAR TORNEO?\n¿Confirmas borrar "${nombre}" permanentemente? Se borrarán sus llaves.`)) {
        db.collection('torneos').doc(id).delete().then(() => alert("Torneo purgado de la nube."));
    }
}
async function reiniciarTopBingo() {
    if(!confirm("🚨 ¡ADVERTENCIA COMPETITIVA!\n¿Deseas resetear el ranking global? Todos los XP volverán a 0. Conservarán Diamantes e Inventario.")) return;
    try {
        const snap = await db.collection('ninjas').get();
        const batch = db.batch();
        snap.forEach(doc => batch.update(doc.ref, { xp: 0 }));
        await batch.commit(); alert("🏆 Ranking reiniciado con éxito.");
    } catch(e) { alert("Error: " + e.message); }
}

// ==========================================
// FUNCIONES CLÁSICAS RESTAURADAS DE LA v4.11
// ==========================================
function escucharPersonalizacion() {
    db.collection('configuracion').doc('personalizacion').onSnapshot(doc => {
        if(doc.exists) {
            const data = doc.data();
            const bgVideo = document.getElementById('main-bg-video'); const bgImage = document.getElementById('main-bg-image');
            if (data.bgTipo === 'imagen') { if(bgVideo) bgVideo.style.display = 'none'; if(bgImage) { bgImage.style.display = 'block'; bgImage.src = data.bgUrl || ''; } } 
            else { if(bgImage) bgImage.style.display = 'none'; if(bgVideo) { bgVideo.style.display = 'block'; bgVideo.src = data.bgUrl || 'https://raw.githubusercontent.com/Matiasmj7/mbl-world/main/bingo_bg_video.mp4'; } }
            if (data.colorAcento) document.documentElement.style.setProperty('--blue', data.colorAcento);
            
            // NUEVO: CARGAR REDES SOCIALES DINÁMICAMENTE DESDE FIREBASE
            const redes = ['wa', 'ds', 'fb', 'tt', 'ig', 'yt'];
            redes.forEach(r => {
                const aEl = document.getElementById(`link-soc-${r}`);
                const inpEl = document.getElementById(`cfg-link-${r}`);
                if(data.linksSociales && data.linksSociales[r]) {
                    if(aEl) aEl.href = data.linksSociales[r];
                    if(inpEl) inpEl.value = data.linksSociales[r];
                }
            });

            const secciones = ['stream', 'fama', 'ligas', 'planes', 'torneos', 'bingo', 'comunidades', 'sorteos', 'abismo', 'gremio', 'tienda'];
            secciones.forEach(sec => {
                const sectionEl = document.getElementById(sec); const menuEl = document.getElementById(`menu-${sec === 'bingo' ? 'registro-bingo' : sec}`);
                if (data.visibilidad && typeof data.visibilidad[sec] !== 'undefined') {
                    if(sectionEl) sectionEl.style.display = data.visibilidad[sec] ? 'block' : 'none';
                    if(menuEl) menuEl.style.display = data.visibilidad[sec] ? '' : 'none';
                }
            });
        }
    });
}

function escucharStreamYDiscordGlobal() {
    const iframeStream = document.getElementById('stream-frame'); const iframeDiscord = document.getElementById('chat-externo-frame'); const statusText = document.getElementById('status-stream');
    if(!iframeStream || !statusText || !iframeDiscord) return;
    db.collection('configuracion').doc('global_media').onSnapshot(doc => {
        if(doc.exists) {
            const data = doc.data(); const plat = data.plataforma || 'kick'; const id = data.id || 'matias_mj7';
            if (plat === 'kick') iframeStream.src = `https://player.kick.com/${id}`;
            else if (plat === 'youtube') iframeStream.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1`;
            if(iframeDiscord) iframeDiscord.src = data.discordUrl || 'https://e.widgetbot.io/channels/299881420891881473/299881420891881473';
        }
    });
}

function cargarTorneosDesdeNube() {
    const listaTorneos = document.getElementById('lista-torneos'); const listaLigas = document.getElementById('lista-ligas');
    if(!listaTorneos || !listaLigas) return;
    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        listaTorneos.innerHTML = ''; listaLigas.innerHTML = '';
        snap.forEach(doc => {
            const data = doc.data(); const id = doc.id;
            if(data.tipo === 'liga') listaLigas.innerHTML += generarTarjetaEventoHTML(data, id, true);
            else if (currentFilter === 'todos' || data.formato === currentFilter) listaTorneos.innerHTML += generarTarjetaEventoHTML(data, id, false);
        });
    });
}

function generarTarjetaEventoHTML(data, id, esLiga) {
    const esIndividual = (data.formato === '1v1');
    const inscritos = esIndividual ? (data.lista_inscriptos ? data.lista_inscriptos.length : 0) : (data.lista_equipos ? data.lista_equipos.length : 0);
    let yaInscrito = false;
    if (esIndividual) yaInscrito = data.lista_inscriptos && data.lista_inscriptos.includes(currentUserName);
    else if (data.lista_equipos) data.lista_equipos.forEach(eq => { if(eq.miembros && eq.miembros.includes(currentUserName)) yaInscrito = true; });
    
    let btnTexto = esIndividual ? "UNIRSE" : "VER ESCUADRAS";
    if (yaInscrito) btnTexto = "INSCRIPTO";
    if (data.estado !== "abierto") btnTexto = "CERRADO";

    return `
        <div class="card-t container-glass" style="${esLiga ? 'border-color: gold !important;' : ''}">
            <span style="color:var(--blue); font-weight:bold; font-size:0.8rem; border:1px solid var(--blue); padding:2px 6px; border-radius:4px;">${data.formato.toUpperCase()}</span>
            <h3 style="margin: 10px 0; color: white;">${data.nombre}</h3>
            <p style="font-size:0.85rem; color:#aaa; margin-bottom:5px;"><i class="fas fa-users"></i> Cupos: ${inscritos} / ${data.cuposTotales}</p>
            <p style="font-size:0.85rem; color:var(--green); font-weight:bold;"><i class="fas fa-trophy"></i> Premio: ${data.premio}</p>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn-primary" style="flex: 2; background: ${yaInscrito?'var(--green)':'var(--blue)'}; color: black;" onclick="unirseTorneo('${id}', '${data.estado}')" ${yaInscrito || data.estado!=='abierto'?'disabled':''}>${btnTexto}</button>
                <button class="btn-secondary" style="flex: 1;" onclick="verLlaves('${id}', '${data.nombre}')">CRUCES</button>
            </div>
        </div>`;
}

function unirseTorneo(torneoId, estado) {
    if(estado !== "abierto") return; if(currentUserName === "Héroe Anónimo") { window.location.hash = "#modal-login"; return; }
    db.collection('torneos').doc(torneoId).get().then(doc => {
        const data = doc.data();
        if (data.formato === '1v1') {
            if ((data.lista_inscriptos?.length || 0) >= data.cuposTotales) return alert("Cupos llenos.");
            doc.ref.update({ lista_inscriptos: firebase.firestore.FieldValue.arrayUnion(currentUserName) }).then(() => alert("Inscripto."));
        } else { abrirModalEquipos(torneoId, data.formato); }
    });
}

function abrirModalEquipos(torneoId, formato) {
    document.getElementById('eq-torneo-id').value = torneoId; document.getElementById('eq-formato').value = formato;
    document.getElementById('modal-equipos').style.display = 'flex'; cargarListaEquiposTorneo(torneoId, formato);
}

function cargarListaEquiposTorneo(torneoId, formato) {
    const contenedor = document.getElementById('lista-equipos-torneo'); const limite = parseInt(formato.charAt(0));
    db.collection('torneos').doc(torneoId).onSnapshot(doc => {
        if(!doc.exists || !contenedor) return; contenedor.innerHTML = "";
        const equipos = doc.data().lista_equipos || [];
        equipos.forEach(eq => {
            const lleno = eq.miembros.length >= limite;
            let btn = lleno ? `<button class="btn-secondary" disabled>LLENO</button>` : `<button class="btn-primary" style="background:var(--green); color:black;" onclick="unirseEquipoTorneo('${torneoId}','${eq.nombre}')">UNIRSE</button>`;
            if (eq.pass) btn = `<button class="btn-primary" onclick="abrirModalPassEquipo('${torneoId}','${eq.nombre}')">CLAVE</button>`;
            contenedor.innerHTML += `<div style="background:#111; padding:10px; border-radius:5px; display:flex; justify-content:space-between; align-items:center; border:1px solid #222;"><div><strong>${eq.nombre}</strong><br><span style='font-size:0.75rem; color:#888;'>Miembros: ${eq.miembros.join(', ')} (${eq.miembros.length}/${limite})</span></div><div>${btn}</div></div>`;
        });
    });
}

function crearEquipoTorneo() {
    const tId = document.getElementById('eq-torneo-id').value; const nombreEq = document.getElementById('eq-nombre').value.trim(); const passEq = document.getElementById('eq-pass').value.trim();
    if(!nombreEq) return;
    db.collection('torneos').doc(tId).get().then(doc => {
        let equipos = doc.data().lista_equipos || [];
        equipos.push({ nombre: nombreEq, pass: passEq, miembros: [currentUserName] });
        doc.ref.update({ lista_equipos: equipos }).then(() => {
            document.getElementById('eq-nombre').value = ""; document.getElementById('eq-pass').value = "";
        });
    });
}

function unirseEquipoTorneo(torneoId, nombreEq) {
    db.collection('torneos').doc(torneoId).get().then(doc => {
        let equipos = doc.data().lista_equipos || []; const lim = parseInt(document.getElementById('eq-formato').value.charAt(0));
        for (let i = 0; i < equipos.length; i++) {
            if (equipos[i].nombre === nombreEq && equipos[i].miembros.length < lim) {
                equipos[i].miembros.push(currentUserName); db.collection('torneos').doc(torneoId).update({ lista_equipos: equipos }).then(() => alert("¡Te has unido!")); break;
            }
        }
    });
}

function abrirModalPassEquipo(torneoId, nombreEq) {
    document.getElementById('join-eq-torneo-id').value = torneoId; document.getElementById('join-eq-nombre').value = nombreEq;
    document.getElementById('modal-pass-equipo').style.display = 'flex';
}

function confirmarUnionEquipoPrivado() {
    const tId = document.getElementById('join-eq-torneo-id').value; const nombreEq = document.getElementById('join-eq-nombre').value; const clave = document.getElementById('join-eq-pass-input').value.trim();
    db.collection('torneos').doc(tId).get().then(doc => {
        const equipos = doc.data().lista_equipos || []; const target = equipos.find(e => e.nombre === nombreEq);
        if (target && target.pass === clave) { unirseEquipoTorneo(tId, nombreEq); document.getElementById('modal-pass-equipo').style.display = 'none'; } 
        else alert("Clave inválida.");
    });
}

function verLlaves(torneoId, torneoNombre) {
    document.getElementById('llaves-titulo').innerText = `Cruces: ${torneoNombre}`; const cont = document.getElementById('contenedor-llaves-texto'); cont.innerHTML = "Abriendo pergaminos..."; window.location.hash = "#modal-llaves";
    db.collection('torneos').doc(torneoId).collection('llaves').orderBy('ronda','asc').onSnapshot(snap => {
        cont.innerHTML = ""; if(snap.empty) { cont.innerHTML = "<p style='color:var(--red); text-align:center;'>Cruces no generados aún.</p>"; return; }
        snap.forEach(doc => {
            const p = doc.data();
            cont.innerHTML += `<div style="background:#111; padding:12px; margin-bottom:5px; border:1px solid #222; display:flex; justify-content:space-between; border-radius:5px; align-items:center;"><span style="color:white; font-weight:bold;">${p.p1} vs ${p.p2}</span><strong style="color:var(--green); font-size:0.85rem;">${p.ganador ? 'Ganador: ' + p.ganador : 'Pendiente'}</strong></div>`;
        });
    });
}

// ==========================================
// RESTO DE FUNCIONES DINÁMICAS (BINGO, TABERNA, TIENDA)
// ==========================================
function renderizarTienda() {
    const cat = document.getElementById('catalogo-tienda'); if(!cat) return; cat.innerHTML = "";
    CATALOGO_TIENDA.forEach(item => {
        const loTiene = miInventario.includes(item.id); const eq = (miEquipamiento.borde === item.id || miEquipamiento.colorChat === item.id || miEquipamiento.pin === item.id);
        let btn = loTiene ? (eq ? `<button class="btn-primary" style="background:var(--green);" disabled>EQUIPADO</button>` : `<button class="btn-primary" onclick="equiparObjeto('${item.id}','${item.tipo}')">EQUIPAR</button>`) : `<button class="btn-primary" onclick="comprarObjeto('${item.id}', ${item.precio})">COMPRAR (${item.precio} D)</button>`;
        let preview = item.tipo === 'borde' ? `<div style="width:40px; height:40px; border-radius:50%; ${item.estilo} margin:0 auto 10px auto; background:#222;"></div>` : `<div style="${item.estilo} font-weight:bold; margin-bottom:10px;">${item.nombre}</div>`;
        cat.innerHTML += `<div class="container-glass" style="text-align:center; padding:15px; border:1px solid #222; border-radius:8px;">${preview}<h4>${item.nombre}</h4><p style="font-size:0.75rem; color:#666; margin-bottom:10px;">${item.desc}</p>${btn}</div>`;
    });
}
function comprarObjeto(id, p) { if(currentUserName==="Héroe Anónimo") return; if(misRyos < p) return alert("Diamantes insuficientes."); if(confirm("¿Comprar cosmético?")) db.collection('ninjas').doc(currentUserId).update({ ryos: misRyos - p, inventario: firebase.firestore.FieldValue.arrayUnion(id) }); }
function equiparObjeto(id, t) { const n = {...miEquipamiento}; n[t] = id; db.collection('ninjas').doc(currentUserId).update({ equipado: n }).then(() => alert("¡Objeto equipado!")); }
function misionDiaria() { if(currentUserName==="Héroe Anónimo" || trabajando) return; trabajando = true; document.getElementById('btn-trabajar').innerText = "Reclamando..."; setTimeout(() => { db.collection('ninjas').doc(currentUserId).update({ ryos: firebase.firestore.FieldValue.increment(10) }).then(() => { trabajando = false; document.getElementById('btn-trabajar').innerHTML = "<i class='fas fa-gem'></i> Misión Diaria"; alert("+10 Diamantes recibidos."); }); }, 1200); }
function filtrarTorneos(f, e) { currentFilter = f; document.querySelectorAll('#torneos .btn-filter').forEach(b => b.classList.remove('active')); if(e) e.target.classList.add('active'); cargarTorneosDesdeNube(); }
function escucharTabernaGlobal() { const cont = document.getElementById('chat-messages-container'); db.collection('taberna').orderBy('timestamp').limit(50).onSnapshot(snap => { if(!cont) return; cont.innerHTML = ""; snap.forEach(doc => { const d = doc.data(); let est = "color:var(--blue);"; if(d.usuario==='Matías'||d.usuario==='Admin') est="color:var(--red); text-shadow:0 0 5px red;"; cont.innerHTML += `<div style="font-size:0.85rem; margin-bottom:5px;"><strong style="${est} cursor:pointer;" onclick="abrirPerfil('${d.usuario}')">${d.usuario}:</strong> <span style="color:#eee;">${d.texto}</span></div>`; }); cont.scrollTop = cont.scrollHeight; }); const btn = document.getElementById('btn-send-chat'); if(btn) { btn.onclick = () => { const inp = document.getElementById('chat-input-text'); if(inp.value.trim() && currentUserName!=="Héroe Anónimo") { db.collection('taberna').add({ usuario: currentUserName, texto: inp.value.trim(), timestamp: firebase.firestore.FieldValue.serverTimestamp() }); inp.value = ""; } }; } }
function cargarTopIndividualBingo() { const l = document.getElementById('ranking-dinamico'); db.collection('ninjas').orderBy('xp','desc').limit(10).onSnapshot(snap => { if(!l) return; l.innerHTML = ""; snap.forEach((doc, i) => { const d = doc.data(); l.innerHTML += `<div style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.4); padding:10px; border-radius:5px; margin-bottom:4px; cursor:pointer;" onclick="abrirPerfil('${d.nick}')"><span>${i+1}. ${d.nick}</span><span style="color:gold; font-weight:bold;">${d.xp||0} XP</span></div>`; }); }); }
function abrirPerfil(n) { window.location.hash='#modal-perfil'; db.collection('ninjas').where('nick','==',n).get().then(snap => { if(!snap.empty){ const d = snap.docs[0].data(); document.getElementById('perfil-nick').innerText = d.nick; document.getElementById('perfil-rango').innerText = d.plan==='kasekage'?'MÍTICO':(d.plan==='jonin'?'ÉPICO':'GUERRERO'); document.getElementById('perfil-xp').innerText = `${d.xp||0} XP`; document.getElementById('perfil-campeonatos').innerText = d.torneosGanados||0; document.getElementById('perfil-bio').innerText = d.bio ? `"${d.bio}"` : '"Ninja misterioso..."'; document.getElementById('perfil-avatar').src = d.fotoPerfil || `https://ui-avatars.com/api/?name=${n}&background=random`; } }); }
function abrirModalEditarPerfil() { document.getElementById('modal-editar-perfil').style.display = 'flex'; }
function abrirModalClan() { document.getElementById('modal-clan').style.display = 'flex'; }
function crearClan() { db.collection('clanes').doc(document.getElementById('input-crear-clan').value.trim()).set({ nombre: document.getElementById('input-crear-clan').value.trim(), miembros: [currentUserName], xp: 0 }); }
function unirseClan() { db.collection('clanes').doc(document.getElementById('input-unirse-clan').value.trim()).update({ miembros: firebase.firestore.FieldValue.arrayUnion(currentUserName) }); }
function abandonarClan() { db.collection('clanes').doc(miClan).update({ miembros: firebase.firestore.FieldValue.arrayRemove(currentUserName) }); }

function configurarAdminForms() {
    document.getElementById('form-torneo').addEventListener('submit', (e) => {
        e.preventDefault();
        db.collection('torneos').add({ nombre: document.getElementById('t-nombre').value, fecha: document.getElementById('t-fecha').value, cuposTotales: parseInt(document.getElementById('t-cupos').value), premio: document.getElementById('t-premio').value, formato: document.getElementById('t-formato').value, tipo: document.getElementById('t-tipo').value, privado: document.getElementById('t-privado').checked, creador: currentUserName, lista_inscriptos: [], lista_equipos: [], estado: "abierto", timestamp: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { document.getElementById('form-torneo').reset(); alert("¡Evento Publicado!"); });
    });
    document.getElementById('form-config-personalizacion').addEventListener('submit', (e) => {
        e.preventDefault();
        const bgTipo = document.getElementById('cfg-bg-tipo').value; const bgUrl = document.getElementById('cfg-bg-url').value; const colorAcento = document.getElementById('cfg-color-acento').value;
        const linksSociales = {
            wa: document.getElementById('cfg-link-wa').value, ds: document.getElementById('cfg-link-ds').value, fb: document.getElementById('cfg-link-fb').value,
            tt: document.getElementById('cfg-link-tt').value, ig: document.getElementById('cfg-link-ig').value, yt: document.getElementById('cfg-link-yt').value
        };
        db.collection('configuracion').doc('personalizacion').update({ bgTipo, bgUrl, colorAcento, linksSociales }).then(() => alert("¡Configuración de Redes y Diseño guardada!"));
    });
}

function cargarTorneosParaAdminLlaves() {
    const l = document.getElementById('admin-lista-torneos-llaves'); db.collection('torneos').orderBy('timestamp','desc').onSnapshot(snap => { if(!l) return; l.innerHTML = ""; snap.forEach(doc => { l.innerHTML += `<div style="background:#000; padding:10px; border:1px solid #222; margin-bottom:5px; display:flex; justify-content:space-between; align-items:center; border-radius:5px;"><span>${doc.data().nombre}</span><button class="btn-secondary" onclick="abrirAdminPartidos('${doc.id}','${doc.data().nombre}','','${doc.data().formato}')">GESTIONAR</button></div>`; }); });
}
function gestionarPlan(p) { db.collection('ninjas').where('nick','==',document.getElementById('gestion-nick').value.trim()).get().then(s => s.docs[0].ref.update({ plan: p })); }
function banearUsuario() { db.collection('ninjas').where('nick','==',document.getElementById('gestion-nick').value.trim()).get().then(s => s.docs[0].ref.update({ banned: true })); }
function escucharTicker() { db.collection('configuracion').doc('ticker').onSnapshot(doc => { if(doc.exists) document.getElementById('ticker-contenido').innerHTML = `<span class="ticker-item"><i class="fas fa-bullhorn"></i> ALERTA: ${doc.data().mensaje}</span>`; }); }
function escucharNotificaciones() { db.collection('notificaciones').where('para','==',currentUserName).onSnapshot(s => { document.getElementById('notif-badge').innerText = s.size; }); }
async function limpiarTaberna() { const snap = await db.collection('taberna').get(); const b = db.batch(); snap.forEach(d => b.delete(d.ref)); await b.commit(); alert("Taberna vaciada."); }

// ==========================================
// MÁPER DE SEGURIDAD EXPORTADO AL ÁREA GLOBAL (Solución Vercel/Netlify)
// ==========================================
window.unirseTorneo = unirseTorneo;
window.verLlaves = verLlaves;
window.crearEquipoTorneo = crearEquipoTorneo;
window.unirseEquipoTorneo = unirseEquipoTorneo;
window.abrirModalPassEquipo = abrirModalPassEquipo;
window.confirmarUnionEquipoPrivado = confirmarUnionEquipoPrivado;
window.borrarTorneoDefinitivo = borrarTorneoDefinitivo;
window.abrirAdminPartidos = abrirAdminPartidos;
window.setGanadorManual = setGanadorManual;
window.abrirPerfil = abrirPerfil;
window.abrirModalEditarPerfil = abrirModalEditarPerfil;
window.abrirModalClan = abrirModalClan;
window.crearClan = crearClan;
window.unirseClan = unirseClan;
window.abandonarClan = abandonarClan;
window.misionDiaria = misionDiaria;
window.comprarObjeto = comprarObjeto;
window.equiparObjeto = equiparObjeto;
window.filtrarTorneos = filtrarTorneos;
window.reiniciarTopBingo = reiniciarTopBingo;
window.limpiarTaberna = limpiarTaberna;
window.gestionarPlan = gestionarPlan;
window.banearUsuario = banearUsuario;
window.autenticarUsuarioManual = autenticarUsuarioManual;
window.registrarUsuarioManual = registrarUsuarioManual;
window.cambiarSeccionAuth = cambiarSeccionAuth;
