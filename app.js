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

// INITIALIZATION
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
                    miPerfilActual = data; currentUserName = data.nick; miClan = data.clan || ""; miComunidad = data.comunidad || ""; misRyos = data.ryos || 0; miPlan = data.plan || "genin"; miInventario = data.inventario || []; miEquipamiento = data.equipado || { borde: '', colorChat: '', pin: '' };
                    
                    if(userDisplay) { userDisplay.innerText = currentUserName; userDisplay.href = "#"; }
                    document.getElementById('user-greeting').innerText = currentUserName; document.getElementById('mi-nick-bingo').innerText = currentUserName;
                    document.getElementById('mi-rango-bingo').innerText = (data.plan === 'kasekage') ? 'Mítico' : (data.plan === 'jonin' ? 'Épico' : 'Guerrero');
                    document.getElementById('mi-xp-bingo').innerText = `${data.xp || 0} XP`; document.getElementById('mi-ryos-bingo').innerHTML = `<i class="fas fa-gem"></i> ${misRyos} Diamantes`; document.getElementById('tienda-mis-ryos').innerHTML = `${misRyos} Diamantes`;
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
                        cargarTorneosParaAdminLlaves(); cargarListaBorrarTorneosAdmin();
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

    // MAPEO DE EVENTOS NATIVOS
    document.getElementById('btn-auth-login-manual').addEventListener('click', autenticarUsuarioManual);
    document.getElementById('btn-auth-register-manual').addEventListener('click', registrarUsuarioManual);
    document.getElementById('btn-auth-switch-to-reg').addEventListener('click', () => cambiarSeccionAuth(true));
    document.getElementById('btn-auth-switch-to-log').addEventListener('click', () => cambiarSeccionAuth(false));
    document.getElementById('btn-fundar-comunidad').addEventListener('click', crearComunidad);
    document.getElementById('btn-unirse-comunidad').addEventListener('click', unirseComunidad);
    document.getElementById('btn-abandonar-comunidad').addEventListener('click', abandonarComunidad);
    document.getElementById('btn-enviar-msg-comunidad').addEventListener('click', enviarMensajeComunidad);
    document.getElementById('btn-abrir-gremio-clan').addEventListener('click', abrirModalClan);
    document.getElementById('btn-fundar-clan-gremio').addEventListener('click', crearClan);
    document.getElementById('btn-unirse-clan-gremio').addEventListener('click', unirseClan);
    document.getElementById('btn-abandonar-clan-gremio').addEventListener('click', abandonarClan);
    document.getElementById('btn-crear-anuncio-gremio').addEventListener('click', (e) => abrirModalAnuncio(e));
    document.getElementById('btn-send-chat').addEventListener('click', enviarMensajeTaberna);
    document.getElementById('btn-trabajar').addEventListener('click', misionDiaria);
    document.getElementById('btn-admin-reset-bingo').addEventListener('click', reiniciarTopBingo);
    document.getElementById('btn-admin-limpiar-taberna').addEventListener('click', limpiarTaberna);
    document.getElementById('btn-trigger-modal-editar-perfil').addEventListener('click', abrirModalEditarPerfil);
    document.getElementById('btn-admin-add-manual-ninja').addEventListener('click', inscribirJugadorManual);
    document.getElementById('btn-squad-fundar-equipo').addEventListener('click', crearEquipoTorneo);
    document.getElementById('btn-squad-confirmar-pass').addEventListener('click', confirmarUnionEquipoPrivado);
    document.getElementById('btn-notif').addEventListener('click', (e) => abrirNotificaciones(e));
    
    document.getElementById('nav-btn-perfil').addEventListener('click', () => abrirPerfil(currentUserName));
    document.getElementById('nav-btn-clan').addEventListener('click', abrirModalClan);
    document.getElementById('nav-btn-salir').addEventListener('click', cerrarSesion);

    document.querySelectorAll('.modal-close-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => cerrarModalPerfil(e));
    });

    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            cargarTorneosDesdeNube();
        });
    });

    document.querySelectorAll('.btn-tab-admin').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-tab-admin').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            mostrarTabAdmin(e.target.getAttribute('data-tab'));
        });
    });

    document.querySelectorAll('.btn-gestion-p').forEach(btn => {
        btn.addEventListener('click', (e) => gestionarPlan(e.target.getAttribute('data-plan')));
    });
    document.getElementById('btn-gestion-ban').addEventListener('click', banearUsuario);

    document.querySelectorAll('.btn-comprar-pack-ryos').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.getElementById('info-pago-ryos').innerText = e.target.getAttribute('data-pack');
        });
    });

    escucharPersonalizacion(); escucharTicker(); escucharStreamYDiscordGlobal(); cargarTorneosDesdeNube(); cargarSorteos(); cargarHallOfFame(); cargarVideosAbismo(); cargarTopClanes(); cargarAnunciosGremio(); cargarTopIndividualBingo(); escucharTabernaGlobal(); configurarAdminForms(); cargarTopComunidades();
});

// INYECCIÓN MÁSTER EN WINDOW (Para evitar fallos en Vercel)
window.unirseTorneo = function(id, est) {
    if(est!=="abierto") return; if(currentUserName==="Héroe Anónimo") { window.location.hash="#modal-login"; return; }
    db.collection('torneos').doc(id).get().then(doc => {
        const d = doc.data();
        if(d.formato==='1v1'){
            if((d.lista_inscriptos?.length||0)>=d.cuposTotales) alert("Cupos llenos.");
            else doc.ref.update({ lista_inscriptos: firebase.firestore.FieldValue.arrayUnion(currentUserName) }).then(()=>alert("¡Inscrito!"));
        } else { abrirModalEquipos(id, d.formato); }
    });
};

window.verLlaves = function(id, nom) {
    document.getElementById('llaves-titulo').innerText = `Cruces: ${nom}`; const cont = document.getElementById('contenedor-llaves-texto'); cont.innerHTML = "Abriendo pergaminos..."; window.location.hash = "#modal-llaves";
    db.collection('torneos').doc(id).collection('llaves').orderBy('ronda','asc').onSnapshot(snap => {
        cont.innerHTML = "";
        snap.forEach(doc => {
            const p = doc.data();
            cont.innerHTML += `<div style="background:#111; padding:12px; margin-bottom:5px; border:1px solid #222; display:flex; justify-content:space-between; border-radius:5px;"><span>${p.p1} vs ${p.p2}</span><strong style="color:var(--green);">${p.ganador? 'Ganador: ' + p.ganador : 'Pendiente'}</strong></div>`;
        });
    });
};

window.borrarTorneoDefinitivo = function(id, nombre) {
    if(confirm(`⚠️ ¿ELIMINAR EVENTO?\n¿Confirmas borrar permanentemente "${nombre}" de la base de datos?`)) {
        db.collection('torneos').doc(id).delete().then(() => alert("Purgado del sistema."));
    }
};

window.abrirAdminPartidos = function(id, nom, crd, f) {
    document.getElementById('admin-partidos-titulo').innerText = `Gestión: ${nom}`; window.location.hash = "#modal-admin-partidos";
    document.getElementById('input-torneo-manual-id').value = id; document.getElementById('input-torneo-manual-formato').value = f;
    document.getElementById('input-equipo-manual').style.display = f==='1v1'?'none':'block';
    db.collection('torneos').doc(id).collection('llaves').orderBy('ronda','desc').onSnapshot(snap => {
        const cont = document.getElementById('contenedor-admin-partidos'); cont.innerHTML = "";
        snap.forEach(doc => {
            const p = doc.data();
            cont.innerHTML += `<div style="background:#111; padding:10px; margin-bottom:5px; border-left:3px solid var(--blue); margin-top:5px; border-radius:4px;"><span>${p.p1} VS ${p.p2}</span><br>Resultado: ${p.ganador||'Pendiente'} ${p.ganador===""?`<button style="margin-left:10px;" onclick="window.setGanadorManual('${id}','${doc.id}','${p.p1}')">${p.p1}</button> <button onclick="window.setGanadorManual('${id}','${doc.id}','${p.p2}')">${p.p2}</button>`:''}</div>`;
        });
    });
};

window.setGanadorManual = function(tId, pId, win) {
    if(confirm(`¿Declarar ganador a ${win}?`)) {
        db.collection('torneos').doc(tId).collection('llaves').doc(pId).update({ ganador: win });
    }
};

window.abrirPerfil = function(n) {
    window.location.hash='#modal-perfil';
    db.collection('ninjas').where('nick','==',n).get().then(snap => {
        if(!snap.empty){
            const d = snap.docs[0].data(); document.getElementById('perfil-nick').innerText=d.nick;
            document.getElementById('perfil-rango').innerText=d.plan==='kasekage'?'MÍTICO':(d.plan==='jonin'?'ÉPICO':'GUERRERO');
            document.getElementById('perfil-xp').innerText=`${d.xp||0} XP`; document.getElementById('perfil-campeonatos').innerText=d.torneosGanados||0;
            document.getElementById('perfil-bio').innerText=d.bio?`"${d.bio}"` : '"Ninja Misterioso..."';
            document.getElementById('perfil-avatar').src = d.fotoPerfil||`https://ui-avatars.com/api/?name=${n}&background=random`;
        }
    });
};

window.unirseSorteo = function(sorteoId, precio, estado) {
    if(estado !== 'abierto') return; if(currentUserName === "Héroe Anónimo") { alert("Identifícate."); return; }
    if (precio > 0) {
        if (misRyos < precio) { alert("Diamantes insuficientes."); return; }
        if (!confirm(`¿Gastar ${precio} Diamantes?`)) return;
        db.collection('ninjas').doc(currentUserId).update({ ryos: firebase.firestore.FieldValue.increment(-precio) });
    }
    db.collection('sorteos').doc(sorteoId).update({ participantes: firebase.firestore.FieldValue.arrayUnion(currentUserName) }).then(() => alert("¡Registrado!"));
};

window.ejecutarSorteo = function(sorteoId, premioNombre, cantidadGanadores) {
    db.collection('sorteos').doc(sorteoId).get().then(doc => {
        let participantes = doc.data().participantes || []; if(participantes.length === 0) return alert("Sin participantes.");
        document.getElementById('modal-ruleta').style.display = 'flex';
        const spanNombre = document.getElementById('nombre-ruleta'); const divGanadores = document.getElementById('ganadores-lista');
        divGanadores.style.display = 'none'; spanNombre.classList.add('ruleta-blur');
        let it = 0;
        let inv = setInterval(() => {
            spanNombre.innerText = participantes[Math.floor(Math.random() * participantes.length)]; it++;
            if(it > 25) {
                clearInterval(inv); spanNombre.classList.remove('ruleta-blur');
                let win = [], pool = [...participantes];
                for(let i=0; i<cantidadGanadores; i++) { if(pool.length===0) break; let idx = Math.floor(Math.random()*pool.length); win.push(pool[idx]); pool.splice(idx,1); }
                spanNombre.innerText = "Sorteo Completado"; divGanadores.innerHTML = "GANADORES:<br>" + win.join('<br>'); divGanadores.style.display = 'block'; document.getElementById('btn-cerrar-ruleta').style.display = 'block';
                db.collection('sorteos').doc(sorteoId).update({ estado: 'cerrado', ganadores: win });
            }
        }, 100);
    });
};

window.abrirModalPassEquipo = function(id, n) { document.getElementById('join-eq-torneo-id').value=id; document.getElementById('join-eq-nombre').value=n; document.getElementById('modal-pass-equipo').style.display='flex'; };
window.unirseEquipoTorneo = function(id, n) { db.collection('torneos').doc(id).get().then(doc => { let eqs = doc.data().lista_equipos||[]; let lim = parseInt(document.getElementById('eq-formato').value.charAt(0)); for(let i=0; i<eqs.length; i++){ if(eqs[i].nombre===n && eqs[i].miembros.length < lim){ eqs[i].miembros.push(currentUserName); db.collection('torneos').doc(id).update({ lista_equipos: eqs }).then(()=>alert("¡Te uniste!")); break; } } }); };
window.activarVideo = function(id, u) { document.getElementById(`cont-${id}`).innerHTML = `<iframe src="${u}?autoplay=1" style="width:100%; aspect-ratio:16/9; border:none;" allow="autoplay" allowfullscreen></iframe>`; };
window.borrarVideoAbismo = function(id, e) { e.stopPropagation(); if(confirm("¿Purgar video?")) db.collection('abismo_videos').doc(id).delete(); };
window.darLikeVideo = function(id) { db.collection('abismo_videos').doc(id).update({ likes: firebase.firestore.FieldValue.increment(1) }); };
window.comentarVideo = function(e, id) { e.preventDefault(); const inp = document.getElementById(`coment-${id}`); if(!inp.value.trim()||currentUserName==="Héroe Anónimo") return; db.collection('abismo_videos').doc(id).update({ comentarios: firebase.firestore.FieldValue.arrayUnion({ usuario: currentUserName, texto: inp.value.trim(), timestamp: new Date().getTime() }) }).then(()=>inp.value=""); };

// LÓGICA AUTH MANUAL
function cambiarSeccionAuth(mostrarRegistro) {
    document.getElementById('login-normal-section').style.display = mostrarRegistro ? 'none' : 'block';
    document.getElementById('register-manual-section').style.display = mostrarRegistro ? 'block' : 'none';
}
function registrarUsuarioManual() {
    const user = document.getElementById('reg-usuario').value.trim().toLowerCase(); const pass = document.getElementById('reg-pass').value.trim();
    if(user.length < 4 || pass.length < 6) return alert("Usuario min 4 letras, clave min 6.");
    auth.createUserWithEmailAndPassword(`${user}@mblarg.com`, pass).then(() => { alert("¡Registrado!"); window.location.hash = "#modal-registro-nick"; }).catch(() => alert("Nombre ocupado."));
}
function autenticarUsuarioManual() {
    const user = document.getElementById('login-email-falso').value.trim().toLowerCase(); const pass = document.getElementById('login-pass').value.trim();
    const email = user.includes('@') ? user : `${user}@mblarg.com`;
    auth.signInWithEmailAndPassword(email, pass).then(() => { alert("¡Hola!"); window.location.hash = "#"; }).catch(() => alert("Credenciales inválidas."));
}

// FUNCIONES INTERNAS (DYNAMICS)
function mostrarTabAdmin(tabId) { ['tab-torneos', 'tab-llaves-admin', 'tab-moderacion', 'tab-banco', 'tab-gestion', 'tab-personalizacion'].forEach(t => document.getElementById(t).style.display = 'none'); document.getElementById(tabId).style.display = 'block'; }
function cerrarModalPerfil(e) { if(e) e.preventDefault(); window.location.hash = "#"; }
function cerrarSesion() { auth.signOut().then(() => window.location.reload()); }

// CONFIGURACIÓN DE REDES SOCIALES DESDE FIREBASE (Punto 3)
function escucharPersonalizacion() {
    db.collection('configuracion').doc('personalizacion').onSnapshot(doc => {
        if(doc.exists) {
            const data = doc.data();
            const bgVideo = document.getElementById('main-bg-video'); const bgImage = document.getElementById('main-bg-image');
            if (data.bgTipo === 'imagen') { if(bgVideo) bgVideo.style.display = 'none'; if(bgImage) { bgImage.style.display = 'block'; bgImage.src = data.bgUrl || ''; } } 
            else { if(bgImage) bgImage.style.display = 'none'; if(bgVideo) { bgVideo.style.display = 'block'; bgVideo.src = data.bgUrl || 'https://raw.githubusercontent.com/Matiasmj7/mbl-world/main/bingo_bg_video.mp4'; } }
            if (data.colorAcento) document.documentElement.style.setProperty('--blue', data.colorAcento);
            
            // MAPEO EN PANEL DE CONTROL PARA ENLACES DE REDES SOCIALES
            const redes = ['wa', 'ds', 'fb', 'tt', 'ig', 'yt'];
            redes.forEach(r => {
                const linkEl = document.getElementById(`link-soc-${r}`);
                const inputEl = document.getElementById(`cfg-link-${r}`);
                if(data.linksSociales && data.linksSociales[r]) {
                    if(linkEl) linkEl.href = data.linksSociales[r];
                    if(inputEl) inputEl.value = data.linksSociales[r];
                }
            });

            const secciones = ['stream', 'fama', 'ligas', 'planes', 'torneos', 'bingo', 'comunidades', 'sorteos', 'abismo', 'gremio', 'tienda'];
            secciones.forEach(sec => {
                const sectionEl = document.getElementById(sec); const menuEl = document.getElementById(`menu-${sec === 'bingo' ? 'registro-bingo' : sec}`);
                if (data.visibilidad && typeof data.visibilidad[sec] !== 'undefined') {
                    sectionEl.style.display = data.visibilidad[sec] ? 'block' : 'none'; if (menuEl) menuEl.style.display = data.visibilidad[sec] ? '' : 'none';
                }
            });
        }
    });
}

function configurarAdminForms() {
    document.getElementById('form-torneo').addEventListener('submit', (e) => {
        e.preventDefault();
        db.collection('torneos').add({ nombre: document.getElementById('t-nombre').value, fecha: document.getElementById('t-fecha').value, cuposTotales: parseInt(document.getElementById('t-cupos').value), premio: document.getElementById('t-premio').value, formato: document.getElementById('t-formato').value, tipo: document.getElementById('t-tipo').value, privado: document.getElementById('t-privado').checked, creador: currentUserName, lista_inscriptos: [], lista_equipos: [], estado: "abierto", timestamp: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { document.getElementById('form-torneo').reset(); alert("¡Torneo Publicado!"); });
    });
    document.getElementById('form-config-personalizacion').addEventListener('submit', (e) => {
        e.preventDefault();
        const bgTipo = document.getElementById('cfg-bg-tipo').value; const bgUrl = document.getElementById('cfg-bg-url').value; const colorAcento = document.getElementById('cfg-color-acento').value;
        const linksSociales = {
            wa: document.getElementById('cfg-link-wa').value, ds: document.getElementById('cfg-link-ds').value, fb: document.getElementById('cfg-link-fb').value,
            tt: document.getElementById('cfg-link-tt').value, ig: document.getElementById('cfg-link-ig').value, yt: document.getElementById('cfg-link-yt').value
        };
        db.collection('configuracion').doc('personalizacion').update({ bgTipo, bgUrl, colorAcento, linksSociales }).then(() => alert("¡Diseño y Redes actualizados!"));
    });
}

// LOGICAS DE BASE DE DATOS RESTANTES
function escucharStreamYDiscordGlobal() { const iframeStream = document.getElementById('stream-frame'); const iframeDiscord = document.getElementById('chat-externo-frame'); const statusText = document.getElementById('status-stream'); db.collection('configuracion').doc('global_media').onSnapshot(doc => { if(doc.exists) { const data = doc.data(); const plat = data.plataforma || 'kick'; const id = data.id || 'matias_mj7'; if(iframeStream) iframeStream.src = plat==='kick'?`https://player.kick.com/${id}`:`https://www.youtube.com/embed/${id}?autoplay=1&mute=1`; if(iframeDiscord) iframeDiscord.src = data.discordUrl || ''; } }); }
function escucharTicker() { db.collection('configuracion').doc('ticker').onSnapshot(doc => { if(doc.exists) document.getElementById('ticker-contenido').innerHTML = `<span class="ticker-item"><i class="fas fa-bullhorn"></i> ALERTA: ${doc.data().mensaje}</span>`; }); }
function cargarTorneosDesdeNube() { const lt = document.getElementById('lista-torneos'); const ll = document.getElementById('lista-ligas'); db.collection('torneos').orderBy('timestamp','desc').onSnapshot(snap => { if(lt) lt.innerHTML=''; if(ll) ll.innerHTML=''; snap.forEach(doc => { const d = doc.data(); if(d.tipo==='liga') ll.innerHTML += generarTarjetaEventoHTML(d,doc.id,true); else if(currentFilter==='todos'||d.formato===currentFilter) lt.innerHTML += generarTarjetaEventoHTML(d,doc.id,false); }); }); }
function generarTarjetaEventoHTML(d, id, esLiga) { const ind = d.formato==='1v1'; const ins = ind ? (d.lista_inscriptos?d.lista_inscriptos.length:0) : (d.lista_equipos?d.lista_equipos.length:0); return `<div class="card-t container-glass"><h3>${d.nombre}</h3><p>Cupos: ${ins}/${d.cuposTotales}</p><div style="display:flex; gap:5px; margin-top:10px;"><button class="btn-primary" onclick="window.unirseTorneo('${id}','${d.estado}')">INGRESAR</button><button class="btn-secondary" onclick="window.verLlaves('${id}','${d.nombre}')">LLAVES</button></div></div>`; }
function abrirModalEquipos(id, f) { document.getElementById('eq-torneo-id').value = id; document.getElementById('eq-formato').value = f; document.getElementById('modal-equipos').style.display = 'flex'; cargarListaEquiposTorneo(id, f); }
function cargarListaEquiposTorneo(id, f) { const cont = document.getElementById('lista-equipos-torneo'); const lim = parseInt(f.charAt(0)); db.collection('torneos').doc(id).onSnapshot(doc => { if(!doc.exists)return; cont.innerHTML = ""; doc.data().lista_equipos?.forEach(e => { cont.innerHTML += `<div style="background:#111; padding:10px; margin-bottom:5px; display:flex; justify-content:space-between; align-items:center;"><div><strong>${e.nombre}</strong> (${e.miembros.length}/${lim})</div><button class="btn-primary" onclick="window.unirseEquipoTorneo('${id}','${e.nombre}')">UNIRSE</button></div>`; }); }); }
function crearEquipoTorneo() { const id = document.getElementById('eq-torneo-id').value; const nom = document.getElementById('eq-nombre').value.trim(); if(!nom) return; db.collection('torneos').doc(id).get().then(doc => { let eqs = doc.data().lista_equipos||[]; eqs.push({ nombre: nom, pass: document.getElementById('eq-pass').value.trim(), miembros: [currentUserName] }); doc.ref.update({ lista_equipos: eqs }); }); }
function confirmarUnionEquipoPrivado() { const id = document.getElementById('join-eq-torneo-id').value; const n = document.getElementById('join-eq-nombre').value; const clv = document.getElementById('join-eq-pass-input').value.trim(); db.collection('torneos').doc(id).get().then(doc => { const eqs = doc.data().lista_equipos||[]; if(eqs.find(e=>e.nombre===n)?.pass===clv) { window.unirseEquipoTorneo(id, n); document.getElementById('modal-pass-equipo').style.display='none'; } else alert("Clave incorrecta."); }); }
function cargarSorteos() { const ls = document.getElementById('lista-sorteos'); db.collection('sorteos').orderBy('timestamp','desc').onSnapshot(snap => { if(!ls)return; ls.innerHTML=''; snap.forEach(doc => { const d = doc.data(); ls.innerHTML += `<div class="card-t container-glass"><h3>${d.premio}</h3><button class="btn-primary" onclick="window.unirseSorteo('${doc.id}',${d.precio},'${d.estado}')">RECLAMAR TICKET</button></div>`; }); }); }); }
function cargarHallOfFame() { const p = document.getElementById('podio-leyendas'); db.collection('ninjas').where('torneosGanados','>',0).orderBy('torneosGanados','desc').limit(3).onSnapshot(snap => { if(!p)return; p.innerHTML=""; snap.forEach(d => { p.innerHTML += `<div class="podium-spot" onclick="window.abrirPerfil('${d.data().nick}')"><h5>${d.data().nick}</h5><p>${d.data().torneosGanados} Copas</p></div>`; }); }); }
function cargarVideosAbismo() { const list = document.getElementById('lista-abismo'); db.collection('abismo_videos').orderBy('timestamp','desc').onSnapshot(snap => { if(!list)return; list.innerHTML=''; snap.forEach(doc => { const d = doc.data(); list.innerHTML += `<div class="container-glass"><strong onclick="window.abrirPerfil('${d.usuario}')">${d.usuario}</strong><div id="cont-${doc.id}" onclick="window.activarVideo('${doc.id}','${d.url}')"><img src="https://via.placeholder.com/150" style="width:100%;"><button onclick="window.borrarVideoAbismo('${doc.id}',event)">BORRAR</button></div></div>`; }); }); }
function cargarTopClanes() { const l = document.getElementById('lista-top-clanes'); db.collection('clanes').orderBy('xp','desc').limit(5).onSnapshot(snap => { if(!l)return; l.innerHTML=""; snap.forEach(doc => { l.innerHTML += `<div>${doc.data().nombre} - ${doc.data().xp} XP</div>`; }); }); }
function cargarAnunciosGremio() { const l = document.getElementById('lista-anuncios'); db.collection('anuncios_gremio').orderBy('timestamp','desc').limit(10).onSnapshot(snap => { if(!l)return; l.innerHTML=""; snap.forEach(doc => { l.innerHTML += `<div><strong>${doc.data().usuario}</strong>: ${doc.data().busco}</div>`; }); }); }
function escucharTabernaGlobal() { const cont = document.getElementById('chat-messages-container'); db.collection('taberna').orderBy('timestamp').limit(50).onSnapshot(snap => { if(!cont)return; cont.innerHTML=''; snap.forEach(doc => { cont.innerHTML += `<div><strong>${doc.data().usuario}:</strong> ${doc.data().texto}</div>`; }); cont.scrollTop = cont.scrollHeight; }); }
function enviarMensajeTaberna() { const input = document.getElementById('chat-input-text'); if(input.value.trim() && currentUserName!=="Héroe Anónimo") { db.collection('taberna').add({ usuario: currentUserName, texto: input.value.trim(), timestamp: firebase.firestore.FieldValue.serverTimestamp() }); input.value=''; } }
function cargarTopIndividualBingo() { const l = document.getElementById('ranking-dinamico'); db.collection('ninjas').orderBy('xp','desc').limit(10).onSnapshot(snap => { if(!l)return; l.innerHTML=""; snap.forEach(doc => { l.innerHTML += `<div onclick="window.abrirPerfil('${doc.data().nick}')">${doc.data().nick} - ${doc.data().xp} XP</div>`; }); }); }
function abrirModalAnuncio() { window.location.hash="#modal-anuncio"; }
function abrirModalClan() { document.getElementById('modal-clan').style.display='flex'; }
function crearClan() { db.collection('clanes').doc(document.getElementById('input-crear-clan').value.trim()).set({ nombre: document.getElementById('input-crear-clan').value.trim(), miembros: [currentUserName], xp: 0 }); }
function unirseClan() { db.collection('clanes').doc(document.getElementById('input-unirse-clan').value.trim()).update({ miembros: firebase.firestore.FieldValue.arrayUnion(currentUserName) }); }
function abandonarClan() { db.collection('clanes').doc(miClan).update({ miembros: firebase.firestore.FieldValue.arrayRemove(currentUserName) }); }
function cargarTorneosParaAdminLlaves() { const l = document.getElementById('admin-lista-torneos-llaves'); db.collection('torneos').orderBy('timestamp','desc').onSnapshot(snap => { if(!l)return; l.innerHTML=''; snap.forEach(doc => { l.innerHTML += `<div>${doc.data().nombre} <button onclick="window.abrirAdminPartidos('${doc.id}','${doc.data().nombre}','','${doc.data().formato}')">GESTIONAR</button></div>`; }); }); }
function banearUsuario() { db.collection('ninjas').where('nick','==',document.getElementById('gestion-nick').value.trim()).get().then(s => s.docs[0].ref.update({ banned: true })); }
function gestionarPlan(p) { db.collection('ninjas').where('nick','==',document.getElementById('gestion-nick').value.trim()).get().then(s => s.docs[0].ref.update({ plan: p })); }
async function limpiarTaberna() { const snap = await db.collection('taberna').get(); const b = db.batch(); snap.forEach(d => b.delete(d.ref)); await b.commit(); }
async function reiniciarTopBingo() { const snap = await db.collection('ninjas').get(); const b = db.batch(); snap.forEach(d => b.update(d.ref,{xp:0})); await b.commit(); }
function escucharNotificaciones() { db.collection('notificaciones').where('para','==',currentUserName).onSnapshot(s => { document.getElementById('notif-badge').innerText = s.size; }); }
function abrirNotificaciones(e) { e.preventDefault(); document.getElementById('modal-notificaciones').style.display='flex'; }
function cargarSelectorComunidadesKage() { db.collection('comunidades').get().then(s => { s.forEach(d => document.getElementById('kage-comunidad-selector').innerHTML += `<option value="${d.id}">${d.id}</option>`); }); }
function cambiarChatComunidadKage() { escucharChatComunidad(document.getElementById('kage-comunidad-selector').value); }
