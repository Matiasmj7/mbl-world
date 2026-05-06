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
let currentFilter = 'todos'; 
let kageStreamPlat = 'twitch'; 
let kageStreamUser = 'matias_mj7';

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. ESTADO DE SESIÓN CON NICKNAME Y CLAN
    auth.onAuthStateChanged(user => {
        const adminNav = document.getElementById('admin-nav');
        const adminSection = document.getElementById('admin');
        const userDisplay = document.getElementById('user-display');
        const userGreeting = document.getElementById('user-greeting');
        const btnNotif = document.getElementById('btn-notif');

        if(user) {
            currentUserId = user.uid;
            db.collection('ninjas').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    currentUserName = data.nick;
                    miClan = data.clan || ""; 
                    
                    if(userDisplay) { userDisplay.innerText = currentUserName; userDisplay.href = "#"; }
                    if(userGreeting) userGreeting.innerText = currentUserName;
                    
                    document.getElementById('mi-nick-bingo').innerText = currentUserName;
                    document.getElementById('mi-xp-bingo').innerText = `${data.xp || 0} XP`;
                    document.getElementById('mi-rango-bingo').innerText = data.rango || 'Guerrero';
                    
                    if(btnNotif) btnNotif.style.display = 'block';
                    escucharNotificaciones(); // Inicia la escucha de alertas para este usuario

                    if(user.email === ADMIN_EMAIL) {
                        if(adminNav) adminNav.style.display = 'block';
                        if(adminSection) adminSection.style.display = 'block';
                        cargarTorneosParaAdminLlaves();
                    }
                } else {
                    window.location.hash = "#modal-registro-nick";
                }
            });
        } else {
            currentUserName = "Ninja Anónimo";
            currentUserId = null;
            miClan = "";
            if(userDisplay) { userDisplay.innerText = "Ingresar"; userDisplay.href = "#modal-login"; }
            if(userGreeting) userGreeting.innerText = "Ninja";
            document.getElementById('mi-nick-bingo').innerText = "Inicia sesión";
            document.getElementById('mi-xp-bingo').innerText = "0 XP";
            if(adminNav) adminNav.style.display = 'none';
            if(adminSection) adminSection.style.display = 'none';
            if(btnNotif) btnNotif.style.display = 'none';
        }
    });

    const formNick = document.getElementById('form-registro-nick');
    if(formNick) {
        formNick.addEventListener('submit', (e) => {
            e.preventDefault();
            const nuevoNick = document.getElementById('nuevo-nick').value.trim();
            db.collection('ninjas').doc(currentUserId).set({
                nick: nuevoNick, xp: 0, ryos: 0, rango: "Guerrero", clan: "", email_oculto: auth.currentUser.email, fecha_registro: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                alert("¡Identidad Ninja creada exitosamente!");
                window.location.hash = "#";
                window.location.reload();
            });
        });
    }

    const loginBtn = document.getElementById('login-google');
    if(loginBtn) { loginBtn.addEventListener('click', () => { auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); }); }

    // 2. BYAKUGAN
    db.collection('configuracion').doc('stream').onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            kageStreamPlat = data.plataforma;
            kageStreamUser = extraerIdLimpio(data.usuario, kageStreamPlat);
            document.getElementById('status-stream').innerText = `SEÑAL ACTUALIZADA POR EL KAGE: ${kageStreamPlat.toUpperCase()}`;
            cambiarStreamLocal(kageStreamPlat, kageStreamUser);
        }
    });

    const formConfigStream = document.getElementById('form-config-stream');
    if(formConfigStream) {
        formConfigStream.addEventListener('submit', (e) => {
            e.preventDefault();
            db.collection('configuracion').doc('stream').set({
                plataforma: document.getElementById('stream-plataforma').value, usuario: document.getElementById('stream-usuario').value.trim(), timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => alert("¡Visión del Byakugan Actualizada para toda la aldea!"));
        });
    }

    // 3. LIBRO BINGO Y ASCENSOS ADMIN
    db.collection('ninjas').orderBy('xp', 'desc').limit(30).onSnapshot(snap => {
        const rankingContainer = document.getElementById('ranking-dinamico');
        if(rankingContainer) {
            rankingContainer.innerHTML = '';
            if(snap.empty) { rankingContainer.innerHTML = '<p style="color: #666; text-align: center;">El Libro Bingo está vacío.</p>'; }
            let puesto = 1;
            snap.forEach(doc => {
                const data = doc.data();
                let colorBorde = '#333';
                if(puesto === 1) colorBorde = 'gold'; else if(puesto === 2) colorBorde = 'silver'; else if(puesto === 3) colorBorde = '#cd7f32';

                rankingContainer.innerHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #000; padding: 10px 15px; border-radius: 5px; border-left: 3px solid ${colorBorde}; cursor: pointer; transition: 0.3s;" onclick="abrirPerfil('${data.nick}')" onmouseover="this.style.background='#111'" onmouseout="this.style.background='#000'">
                        <div><strong>${puesto}. <span style="color: var(--blue);">${data.nick}</span></strong></div>
                        <div style="font-size: 0.8rem; color: #aaa; text-align: right;">${data.xp || 0} XP<br><span style="color: var(--blue);">${data.rango || 'Guerrero'}</span></div>
                    </div>
                `;
                puesto++;
            });
        }
    });

    const formAscenso = document.getElementById('form-ascenso');
    if(formAscenso) {
        formAscenso.addEventListener('submit', (e) => {
            e.preventDefault();
            const userAscenso = document.getElementById('p-usuario').value.trim();
            const rangoAscenso = document.getElementById('p-rango').value;
            db.collection('usuarios_rango').doc(userAscenso).set({ rango: rangoAscenso, fecha_ascenso: firebase.firestore.FieldValue.serverTimestamp() })
            .then(() => { formAscenso.reset(); alert(`Ascendido a ${rangoAscenso}!`); });
        });
    }

    db.collection('usuarios_rango').orderBy('fecha_ascenso', 'desc').onSnapshot(snap => {
        const listaRangos = document.getElementById('lista-rangos');
        if(listaRangos) {
            listaRangos.innerHTML = '';
            snap.forEach(doc => {
                const data = doc.data();
                const colorRango = data.rango.includes('Kage') ? 'var(--red)' : 'var(--blue)';
                listaRangos.innerHTML += `<div style="display: flex; justify-content: space-between; border-bottom: 1px solid #333; padding: 8px 0; font-size: 0.9rem;"><strong>${doc.id}</strong><span style="color: ${colorRango}; font-weight: bold;">${data.rango}</span></div>`;
            });
        }
    });

    // 4. CREAR TORNEOS
    const formT = document.getElementById('form-torneo');
    if(formT) {
        formT.addEventListener('submit', (e) => {
            e.preventDefault();
            db.collection('torneos').add({
                nombre: document.getElementById('t-nombre').value, formato: document.getElementById('t-formato').value, fecha: document.getElementById('t-fecha').value,
                cuposTotales: parseInt(document.getElementById('t-cupos').value), lista_inscriptos: [], premio: document.getElementById('t-premio').value, privado: document.getElementById('t-privado').checked, estado: "abierto", timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => { formT.reset(); alert("Torneo Creado en la Arena"); });
        });
    }

    // 5. CHAT Y GREMIO
    const btnSendChat = document.getElementById('btn-send-chat');
    if(btnSendChat) {
        btnSendChat.addEventListener('click', () => {
            const input = document.getElementById('chat-input-text');
            if(input.value.trim() && currentUserName !== "Ninja Anónimo") {
                db.collection('taberna').add({ usuario: currentUserName, texto: input.value.trim(), timestamp: firebase.firestore.FieldValue.serverTimestamp() });
                input.value = '';
            } else if (currentUserName === "Ninja Anónimo") { alert("Debes identificarte (Ingresar)."); }
        });
    }

    const chatContainer = document.getElementById('chat-messages-container');
    if(chatContainer) {
        db.collection('taberna').orderBy('timestamp').onSnapshot(snap => {
            chatContainer.innerHTML = '';
            snap.forEach(doc => {
                const d = doc.data();
                const nameColor = (d.usuario === 'Matías') ? 'var(--red)' : 'var(--blue)';
                chatContainer.innerHTML += `<div style="margin-bottom: 8px; border-bottom: 1px solid #111; padding-bottom: 5px;"><strong style="color:${nameColor}; margin-right: 5px; cursor:pointer;" onclick="abrirPerfil('${d.usuario}')">${d.usuario}:</strong> <span style="word-break: break-all;">${d.texto}</span></div>`;
            });
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });
    }

    const formAnuncio = document.getElementById('form-anuncio');
    if(formAnuncio) {
        formAnuncio.addEventListener('submit', (e) => {
            e.preventDefault();
            if(currentUserName === "Ninja Anónimo") return;
            db.collection('anuncios_gremio').add({
                usuario: currentUserName, busco: document.getElementById('a-busco').value, soy: document.getElementById('a-soy').value, mensaje: document.getElementById('a-mensaje').value, timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => { formAnuncio.reset(); window.location.hash = '#gremio'; alert("Anuncio publicado."); });
        });
    }

    // 6. ABISMO CON ENLACES EXTERNOS
    const formAbismo = document.getElementById('form-abismo');
    if(formAbismo) {
        formAbismo.addEventListener('submit', (e) => {
            e.preventDefault();
            if(currentUserName === "Ninja Anónimo") { alert("Atención: Debes Ingresar a la página para compartir tu jugada."); window.location.hash = "#modal-login"; return; }
            
            const urlInput = document.getElementById('video-url').value.trim();
            let embedUrl = ""; let plataforma = "desconocida";
            
            if(urlInput.includes('youtube.com') || urlInput.includes('youtu.be')) {
                plataforma = "youtube"; const id = extraerIdLimpio(urlInput, 'youtube'); embedUrl = `https://www.youtube.com/embed/${id}`;
            } else if(urlInput.includes('tiktok.com')) {
                plataforma = "tiktok"; const id = extraerIdLimpio(urlInput, 'tiktok');
                if(id) { embedUrl = `https://www.tiktok.com/embed/v2/${id}`; } else { embedUrl = urlInput; }
            } else { alert("Por ahora solo puedes compartir enlaces de YouTube o TikTok."); return; }

            db.collection('abismo_videos').add({
                usuario: currentUserName, url: embedUrl, urlCruda: urlInput, plataforma: plataforma, likes: 0, timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => { alert("¡Tu pergamino visual ha sido publicado en el Abismo!"); formAbismo.reset(); }).catch(err => { alert("Hubo un error al publicar: " + err.message); });
        });
    }

    // 7. REPORTES DE RESULTADOS
    const formReporte = document.getElementById('form-reporte');
    if(formReporte) {
        formReporte.addEventListener('submit', (e) => {
            e.preventDefault();
            const tId = document.getElementById('rep-torneo-id').value;
            const pId = document.getElementById('rep-partido-id').value;
            const ganador = document.getElementById('rep-ganador').value;
            const prueba = document.getElementById('rep-prueba').value.trim() || 'No adjuntada (Revisar WS)';

            db.collection('torneos').doc(tId).collection('llaves').doc(pId).update({
                reporte_pendiente: { reportadoPor: currentUserName, ganadorPropuesto: ganador, prueba: prueba }
            }).then(() => {
                alert("¡Reporte enviado exitosamente! El Kage lo revisará pronto.");
                document.getElementById('modal-reporte').style.display = 'none';
                window.location.hash = "#modal-llaves";
            });
        });
    }

    cargarTorneosDesdeNube();
    cargarAnunciosGremio();
    cargarVideosAbismo(); 
    cargarTopClanes(); 
});

// ==========================================
// NUEVO: SISTEMA DE NOTIFICACIONES
// ==========================================

function enviarNotificacion(paraUsuario, mensaje) {
    if (!paraUsuario || paraUsuario === "Ninja Anónimo" || paraUsuario === "BYE") return;
    db.collection('notificaciones').add({
        para: paraUsuario,
        texto: mensaje,
        leida: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

function escucharNotificaciones() {
    const badge = document.getElementById('notif-badge');
    const contenedorHTML = document.getElementById('lista-notificaciones-contenido');

    db.collection('notificaciones')
      .where('para', '==', currentUserName)
      .orderBy('timestamp', 'desc')
      .onSnapshot(snap => {
        let noLeidas = 0;
        contenedorHTML.innerHTML = "";

        if(snap.empty) {
            contenedorHTML.innerHTML = '<p style="color:#888; text-align:center;">El viento está en calma. No hay mensajes.</p>';
            badge.style.display = 'none';
            return;
        }

        snap.forEach(doc => {
            const data = doc.data();
            if(!data.leida) noLeidas++;
            
            const bg = data.leida ? '#0a0a0f' : '#1a1a24';
            const border = data.leida ? '1px solid #222' : '1px solid var(--blue)';
            
            contenedorHTML.innerHTML += `
                <div style="background: ${bg}; border: ${border}; padding: 10px; border-radius: 5px; margin-bottom: 8px; font-size: 0.85rem;">
                    <i class="fas fa-envelope" style="color: var(--blue); margin-right: 5px;"></i> ${data.texto}
                </div>
            `;
        });

        if(noLeidas > 0) {
            badge.innerText = noLeidas;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    });
}

function abrirNotificaciones(e) {
    e.preventDefault();
    document.getElementById('modal-notificaciones').style.display = 'flex';
    
    // Marcar todas como leídas al abrir
    db.collection('notificaciones').where('para', '==', currentUserName).where('leida', '==', false).get().then(snap => {
        const batch = db.batch();
        snap.forEach(doc => {
            batch.update(doc.ref, { leida: true });
        });
        batch.commit();
    });
}

// ==========================================
// SISTEMA DE CLANES (ESCUADRONES)
// ==========================================

function abrirModalClan() {
    if (currentUserName === "Ninja Anónimo") { alert("Debes identificarte en la aldea para acceder a los escuadrones."); window.location.hash = "#modal-login"; return; }
    document.getElementById('modal-clan').style.display = 'flex';
    
    if (miClan === "") {
        document.getElementById('vista-sin-clan').style.display = 'block'; document.getElementById('vista-con-clan').style.display = 'none';
    } else {
        document.getElementById('vista-sin-clan').style.display = 'none'; document.getElementById('vista-con-clan').style.display = 'block';
        document.getElementById('clan-nombre-display').innerText = miClan;
        db.collection('clanes').doc(miClan).onSnapshot(doc => {
            if(doc.exists) {
                document.getElementById('clan-xp-display').innerText = doc.data().xp || 0;
                const ul = document.getElementById('lista-miembros-clan'); ul.innerHTML = "";
                const miembros = doc.data().miembros || [];
                miembros.forEach(m => {
                    let liderBadge = m === doc.data().lider ? '<span style="color:gold; font-size:0.7rem; float:right;"><i class="fas fa-crown"></i> Lider</span>' : '';
                    ul.innerHTML += `<li style="padding: 8px 0; border-bottom: 1px solid #222;">${m} ${liderBadge}</li>`;
                });
            }
        });
    }
}

function crearClan() {
    const nombre = document.getElementById('input-crear-clan').value.trim();
    if(!nombre) return alert("Escribe un nombre para tu clan.");
    const docRef = db.collection('clanes').doc(nombre);
    docRef.get().then(doc => {
        if(doc.exists) { alert("Ese nombre de Escuadrón ya está en uso en la aldea."); } else {
            docRef.set({ nombre: nombre, lider: currentUserName, xp: 0, miembros: [currentUserName], timestamp: firebase.firestore.FieldValue.serverTimestamp() }).then(() => {
                db.collection('ninjas').doc(currentUserId).update({ clan: nombre }).then(() => { miClan = nombre; alert(`¡Has fundado el Escuadrón ${nombre}! Llévalo a la gloria.`); abrirModalClan(); });
            });
        }
    });
}

function unirseClan() {
    const nombre = document.getElementById('input-unirse-clan').value.trim();
    if(!nombre) return alert("Escribe el nombre del clan al que quieres unirte.");
    const docRef = db.collection('clanes').doc(nombre);
    docRef.get().then(doc => {
        if(!doc.exists) { alert("Ese Escuadrón no existe. Revisa las mayúsculas y minúsculas."); } else {
            docRef.update({ miembros: firebase.firestore.FieldValue.arrayUnion(currentUserName) }).then(() => {
                db.collection('ninjas').doc(currentUserId).update({ clan: nombre }).then(() => { miClan = nombre; alert(`¡Te has unido exitosamente al Escuadrón ${nombre}!`); abrirModalClan(); });
            });
        }
    });
}

function abandonarClan() {
    if(!confirm("¿Estás seguro de que deseas abandonar tu Escuadrón actual?")) return;
    db.collection('clanes').doc(miClan).update({ miembros: firebase.firestore.FieldValue.arrayRemove(currentUserName) }).then(() => {
        db.collection('ninjas').doc(currentUserId).update({ clan: "" }).then(() => { miClan = ""; alert("Has dejado tu escuadrón. Eres un ninja solitario nuevamente."); abrirModalClan(); });
    });
}

function cargarTopClanes() {
    const lista = document.getElementById('lista-top-clanes');
    if(!lista) return;
    db.collection('clanes').orderBy('xp', 'desc').limit(10).onSnapshot(snap => {
        lista.innerHTML = "";
        if(snap.empty) { lista.innerHTML = "<p style='color:#666; text-align:center;'>Aún no hay escuadrones formados en la aldea.</p>"; return; }
        let puesto = 1;
        snap.forEach(doc => {
            const d = doc.data(); let color = "#333";
            if(puesto === 1) color = "gold"; else if(puesto === 2) color = "silver"; else if(puesto === 3) color = "#cd7f32";
            lista.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; background:#000; padding:12px; border-radius:5px; border-left:3px solid ${color}; margin-bottom: 5px;"><div><strong style="color: white; font-size: 1.1rem;">${puesto}. ${d.nombre}</strong> <br> <span style="font-size:0.75rem; color:#888;"><i class="fas fa-users"></i> ${d.miembros.length} miembros</span></div><div style="color:gold; font-weight:bold; font-size:1rem;">${d.xp} XP</div></div>`;
            puesto++;
        });
    });
}

// ==========================================
// FUNCIONES DE PERFILES, ABISMO Y AUXILIARES
// ==========================================

function cargarVideosAbismo() {
    const lista = document.getElementById('lista-abismo');
    if(!lista) return;

    db.collection('abismo_videos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        lista.innerHTML = '';
        if(snap.empty) {
            lista.innerHTML = '<p style="color: #ccc; text-align: center; width: 100%;">El Abismo está en silencio. ¡Copia el link de tu mejor jugada y sé el primero en publicarla!</p>';
            return;
        }
        snap.forEach(doc => {
            const d = doc.data();
            let reproductorHTML = "";
            if(d.url && d.url.includes('embed')) {
                reproductorHTML = `<iframe src="${d.url}" style="width: 100%; height: 350px; border: none; border-radius: 8px;" allowfullscreen></iframe>`;
            } else {
                reproductorHTML = `<div style="height: 150px; display: flex; align-items: center; justify-content: center; background: #111; border-radius: 8px;"><a href="${d.urlCruda}" target="_blank" class="btn-secondary" style="text-decoration: none;"><i class="fas fa-external-link-alt"></i> Ver jugada en TikTok</a></div>`;
            }

            lista.innerHTML += `
                <div class="container-glass" style="padding: 15px; border-color: var(--blue) !important;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; cursor: pointer; transition: 0.3s;" onclick="abrirPerfil('${d.usuario}')" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                        <img src="https://ui-avatars.com/api/?name=${d.usuario}&background=random" style="width: 30px; border-radius: 50%; border: 1px solid var(--blue);">
                        <strong style="font-size: 0.9rem; color: white;">${d.usuario}</strong>
                    </div>
                    <div style="margin-bottom: 10px;">${reproductorHTML}</div>
                    <div style="display: flex; justify-content: space-between; border-top: 1px solid #333; padding-top: 10px;">
                        <button style="background: none; border: none; color: #ccc; cursor: pointer; font-size: 1.1rem; transition: 0.2s;" onclick="darLikeVideo('${doc.id}', '${d.usuario}')" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='#ccc'">
                            <i class="fas fa-heart"></i> <span style="font-size: 0.9rem;">${d.likes || 0}</span>
                        </button>
                    </div>
                </div>
            `;
        });
    });
}

function darLikeVideo(videoId, autorVideo) {
    if(currentUserName === "Ninja Anónimo") return alert("Debes identificarte en la aldea para dar Like.");
    db.collection('abismo_videos').doc(videoId).update({ likes: firebase.firestore.FieldValue.increment(1) });
    
    // Si le da like a otra persona, le notifica
    if (autorVideo !== currentUserName) {
        enviarNotificacion(autorVideo, `${currentUserName} reconoció tu habilidad en el Abismo con un Like.`);
    }
}

async function abrirPerfil(nick) {
    const modal = document.getElementById('modal-perfil');
    document.getElementById('perfil-nick').innerText = nick;
    document.getElementById('perfil-avatar').src = `https://ui-avatars.com/api/?name=${nick}&background=random`;
    document.getElementById('perfil-rango').innerText = "Buscando..."; 
    document.getElementById('perfil-xp').innerText = "..."; 
    document.getElementById('perfil-campeonatos').innerText = "...";
    document.getElementById('perfil-clan').innerHTML = ""; 
    
    window.location.hash = '#modal-perfil';
    
    try {
        const snapshot = await db.collection('ninjas').where('nick', '==', nick).get();
        if(!snapshot.empty) {
            const data = snapshot.docs[0].data();
            document.getElementById('perfil-rango').innerText = data.rango || 'Guerrero'; 
            document.getElementById('perfil-xp').innerText = `${data.xp || 0} XP`;
            if(data.clan && data.clan !== "") {
                document.getElementById('perfil-clan').innerHTML = `<i class="fas fa-shield-alt"></i> Escuadrón: ${data.clan}`;
            }
        } else {
            document.getElementById('perfil-rango').innerText = 'Sin Rango'; document.getElementById('perfil-xp').innerText = `0 XP`;
        }
        const torneosSnap = await db.collection('torneos').where('campeon', '==', nick).get();
        document.getElementById('perfil-campeonatos').innerText = torneosSnap.size;
    } catch(error) { console.error("Error cargando perfil:", error); }
}

function cerrarModalPerfil(e) { e.preventDefault(); history.back(); }

function cerrarSesion() { auth.signOut().then(() => window.location.reload()); }
function abrirModalAnuncio(e) { if(e) e.preventDefault(); if(currentUserName === "Ninja Anónimo") { alert("Debes Ingresar primero."); window.location.hash = "#modal-login"; } else { window.location.hash = "#modal-anuncio"; } }

function extraerIdLimpio(urlCruda, plataforma) {
    let id = urlCruda.trim();
    try {
        if (plataforma === 'twitch') { if (id.includes('twitch.tv/')) id = id.split('twitch.tv/')[1].split('?')[0].replace('/', ''); }
        else if (plataforma === 'youtube') { if (id.includes('v=')) id = id.split('v=')[1].split('&')[0]; else if (id.includes('youtu.be/')) id = id.split('youtu.be/')[1].split('?')[0]; else if (id.includes('/live/')) id = id.split('/live/')[1].split('?')[0]; }
        else if (plataforma === 'kick') { if (id.includes('kick.com/')) id = id.split('kick.com/')[1].split('?')[0].replace('/', ''); }
        else if (plataforma === 'tiktok') { if (id.includes('/video/')) id = id.split('/video/')[1].split('?')[0]; }
    } catch(e) { console.log("Error filtrando enlace:", e); }
    return id;
}

function cambiarStreamLocal(plataforma, usuarioFuerza = null) {
    const iframe = document.getElementById('stream-frame'); const botones = document.querySelectorAll('.plat-btn');
    let canalAUsar = usuarioFuerza ? usuarioFuerza : extraerIdLimpio(kageStreamUser, kageStreamPlat);
    const currentDomain = window.location.hostname; let finalSrc = "";
    if (plataforma === 'twitch') { finalSrc = `https://player.twitch.tv/?channel=${canalAUsar}&parent=${currentDomain}`; }
    else if (plataforma === 'youtube') { finalSrc = `https://www.youtube.com/embed/${canalAUsar}?autoplay=1`; }
    else if (plataforma === 'kick') { finalSrc = `https://player.kick.com/${canalAUsar}`; }
    else if (plataforma === 'tiktok') { finalSrc = `https://www.tiktok.com/embed/v2/${canalAUsar}`; }
    if(iframe) iframe.src = finalSrc;
    botones.forEach(btn => { btn.style.background = '#111'; btn.style.color = 'white'; btn.style.border = '1px solid #444'; });
    let btnActivo = null;
    if(plataforma === 'twitch') btnActivo = botones[0]; if(plataforma === 'youtube') btnActivo = botones[1]; if(plataforma === 'kick') btnActivo = botones[2]; if(plataforma === 'tiktok') btnActivo = botones[3];
    if(btnActivo) {
        if (plataforma === 'twitch') { btnActivo.style.background = 'var(--blue)'; btnActivo.style.color = '#000'; btnActivo.style.border = 'none';}
        if (plataforma === 'youtube') { btnActivo.style.background = 'var(--red)'; btnActivo.style.color = '#fff'; btnActivo.style.border = 'none';}
        if (plataforma === 'kick') { btnActivo.style.background = 'var(--green)'; btnActivo.style.color = '#000'; btnActivo.style.border = 'none';}
        if (plataforma === 'tiktok') { btnActivo.style.background = '#ff0050'; btnActivo.style.color = '#fff'; btnActivo.style.border = 'none';}
    }
}

function filtrarTorneos(formato) {
    currentFilter = formato;
    const botones = document.querySelectorAll('.btn-filter');
    botones.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    cargarTorneosDesdeNube();
}

function cargarTorneosDesdeNube() {
    const listaTorneos = document.getElementById('lista-torneos');
    if(!listaTorneos) return;

    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        listaTorneos.innerHTML = '';
        let hayTorneosVisibles = false;

        snap.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            
            if(currentFilter === 'todos' || data.formato === currentFilter) {
                hayTorneosVisibles = true;
                const inscritos = data.lista_inscriptos ? data.lista_inscriptos.length : 0;
                const cupos = data.cuposTotales || 0;
                const estaLleno = inscritos >= cupos;
                const yaInscrito = data.lista_inscriptos && data.lista_inscriptos.includes(currentUserName);
                
                let btnTexto = "UNIRSE"; let btnColor = "var(--red)";
                if (data.estado === "iniciado" || data.estado === "finalizado") { btnTexto = "CERRADO"; btnColor = "gray"; }
                else if (yaInscrito) { btnTexto = "INSCRIPTO"; btnColor = "gray"; } 
                else if (estaLleno) { btnTexto = "LLENO"; btnColor = "gray"; }

                const etiquetaPrivado = data.privado ? '<span style="color:#ff0040; font-size:0.7rem; float:right; border:1px solid #ff0040; padding:2px 5px; border-radius:3px;">PRIVADO</span>' : '';
                
                let nombresPreview = "";
                if(inscritos > 0) {
                    const primerosNombres = data.lista_inscriptos.slice(0, 3).map(n => `<span style="cursor:pointer; color:var(--blue);" onclick="abrirPerfil('${n}')">${n}</span>`).join(", ");
                    nombresPreview = `<p style="font-size: 0.75rem; color: #888; margin-bottom: 5px;">Participantes: ${primerosNombres}${inscritos > 3 ? '...' : ''}</p>`;
                }

                listaTorneos.innerHTML += `
                    <div class="card-t container-glass">
                        <span style="color:var(--blue); font-weight:bold; font-size: 0.8rem; background: rgba(0, 210, 255, 0.2); padding: 4px 10px; border-radius: 4px; border: 1px solid var(--blue);">MODO ${data.formato.toUpperCase()}</span>
                        ${etiquetaPrivado}
                        <h3 style="margin:15px 0; font-size: 1.4rem; border-bottom: 1px solid #333; padding-bottom: 10px;">${data.nombre}</h3>
                        <p style="margin-bottom: 8px; color: #ccc;"><i class="far fa-calendar-alt" style="color: var(--blue); width: 20px;"></i> ${data.fecha}</p>
                        <p style="margin-bottom: 8px; color: #ccc;"><i class="fas fa-users" style="color: var(--blue); width: 20px;"></i> Jugadores: ${inscritos} / ${cupos}</p>
                        ${nombresPreview}
                        <p style="margin-bottom: 15px; color: var(--green); font-weight: bold;"><i class="fas fa-trophy" style="color: var(--green); width: 20px;"></i> Premio: ${data.premio || 'A definir'}</p>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button class="btn-primary" style="flex: 2; padding: 10px; background: ${btnColor};" onclick="unirseTorneo('${id}', '${data.estado}')" ${estaLleno || yaInscrito || data.estado !== "abierto" ? 'disabled' : ''}>${btnTexto}</button>
                            <button class="btn-secondary" style="flex: 1; padding: 10px; background: #222;" onclick="verLlaves('${id}', '${data.nombre}')"><i class="fas fa-sitemap"></i> Llaves</button>
                        </div>
                    </div>
                `;
            }
        });
        if(!hayTorneosVisibles) { listaTorneos.innerHTML = '<p style="color: #ccc; grid-column: 1 / -1; text-align: center;">No hay torneos disponibles.</p>'; }
    });
}

function unirseTorneo(torneoId, estado) {
    if(estado !== "abierto") return;
    if(currentUserName === "Ninja Anónimo") { alert("Debes ingresar con tu cuenta para unirte."); window.location.hash = "#modal-login"; return; }
    const torneoRef = db.collection('torneos').doc(torneoId);
    torneoRef.get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            const inscritos = data.lista_inscriptos ? data.lista_inscriptos.length : 0;
            if (inscritos >= data.cuposTotales) { alert("Lo sentimos, torneo lleno."); } 
            else { torneoRef.update({ lista_inscriptos: firebase.firestore.FieldValue.arrayUnion(currentUserName) }).then(() => alert("¡Inscripto exitosamente!")); }
        }
    });
}

// LÓGICA DEL PANEL DE ADMIN (AHORA CON BOTÓN DE BORRAR)
function cargarTorneosParaAdminLlaves() {
    const lista = document.getElementById('admin-lista-torneos-llaves');
    db.collection('torneos').onSnapshot(snap => {
        lista.innerHTML = '';
        snap.forEach(doc => {
            const d = doc.data();
            const id = doc.id;
            let botonesHTML = '';
            if(d.estado === 'iniciado') {
                botonesHTML = `<button class="btn-secondary" style="padding: 8px 15px; font-size: 0.8rem; margin-right: 5px;" onclick="abrirAdminPartidos('${id}', '${d.nombre}')">ADMINISTRAR</button><button class="btn-primary" style="background: #444; padding: 8px 15px; font-size: 0.8rem;" onclick="generarLlaves('${id}', '${d.nombre}')">RE-GENERAR</button>`;
            } else if (d.estado === 'finalizado') {
                botonesHTML = `<span style="color: gold; font-weight: bold; margin-bottom: 5px; display: block;"><i class="fas fa-crown"></i> CAMPEÓN: ${d.campeon}</span>`;
            } else {
                botonesHTML = `<button class="btn-primary" style="background: var(--blue); color: black; padding: 8px 15px; font-size: 0.8rem; margin-bottom: 5px;" onclick="generarLlaves('${id}', '${d.nombre}')">GENERAR LLAVES</button>`;
            }
            
            // Renderizado del torneo en el panel de control con el botón eliminar abajo
            lista.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #000; padding: 15px; border-radius: 8px; border: 1px solid #222; flex-wrap: wrap; gap: 10px;">
                <div style="flex: 1; min-width: 150px;"><strong>${d.nombre}</strong> <br> <span style="font-size:0.7rem; color:#888;">${d.lista_inscriptos?.length || 0} inscritos</span></div>
                <div style="display: flex; flex-direction: column; align-items: flex-end;">${botonesHTML}</div>
                <div style="width: 100%; margin-top: 5px; border-top: 1px dashed #333; padding-top: 10px;">
                    <button class="btn-secondary" style="background: transparent; color: var(--red); border: 1px solid var(--red); padding: 6px; font-size: 0.7rem; width: 100%;" onclick="borrarTorneo('${id}', '${d.nombre}')"><i class="fas fa-trash"></i> Eliminar Torneo del Registro</button>
                </div>
            </div>`;
        });
    });
}

function borrarTorneo(torneoId, torneoNombre) {
    if(confirm(`ATENCIÓN: ¿Estás seguro de que deseas ELIMINAR el torneo "${torneoNombre}" para siempre? Esto no se puede deshacer.`)) {
        db.collection('torneos').doc(torneoId).delete().then(() => {
            alert("El torneo ha sido borrado de los pergaminos de la aldea.");
            // Si estuviéramos en la vista de ese torneo, limpiamos
            document.getElementById('contenedor-admin-partidos').innerHTML = "";
            document.getElementById('btn-siguiente-ronda').style.display = "none";
        }).catch((error) => {
            alert("Error al borrar el torneo: " + error);
        });
    }
}

async function generarLlaves(torneoId, torneoNombre) {
    if(!confirm(`¿Generar cruces de Ronda 1 para ${torneoNombre}?`)) return;
    const torneoRef = db.collection('torneos').doc(torneoId);
    const doc = await torneoRef.get();
    const data = doc.data();
    let jugadores = data.lista_inscriptos || [];
    if(jugadores.length < 2) { alert("Mínimo 2 ninjas."); return; }
    jugadores = jugadores.sort(() => Math.random() - 0.5);
    const partidos = [];
    for (let i = 0; i < jugadores.length; i += 2) {
        if (jugadores[i + 1]) { partidos.push({ p1: jugadores[i], p2: jugadores[i + 1], ganador: "", ronda: 1 }); } 
        else { partidos.push({ p1: jugadores[i], p2: "BYE", ganador: jugadores[i], ronda: 1 }); }
    }
    const batch = db.batch();
    const llavesRef = torneoRef.collection('llaves');
    const viejas = await llavesRef.get();
    viejas.forEach(v => batch.delete(v.ref));
    partidos.forEach((p, index) => { const newDoc = llavesRef.doc(`partido_${index + 1}`); batch.set(newDoc, p); });
    batch.update(torneoRef, { estado: "iniciado", campeon: "" });
    await batch.commit();
    
    // Notificar a los participantes
    jugadores.forEach(j => {
        enviarNotificacion(j, `¡Los cruces están listos! Revisa tu llave en el torneo "${torneoNombre}".`);
    });

    alert("¡Los pergaminos de batalla han sido repartidos!");
}

function abrirAdminPartidos(torneoId, torneoNombre) {
    document.getElementById('admin-partidos-titulo').innerText = `Juez: ${torneoNombre}`;
    window.location.hash = "#modal-admin-partidos";
    db.collection('torneos').doc(torneoId).collection('llaves').orderBy('ronda', 'desc').onSnapshot(snap => {
        const contenedor = document.getElementById('contenedor-admin-partidos');
        const btnSiguiente = document.getElementById('btn-siguiente-ronda');
        contenedor.innerHTML = "";
        if(snap.empty) { contenedor.innerHTML = "<p>No hay llaves.</p>"; btnSiguiente.style.display = "none"; return; }
        let rondaMaxima = 1; let partidosRondaActiva = []; let todosTienenGanador = true;
        snap.forEach(doc => { const p = doc.data(); if(p.ronda > rondaMaxima) rondaMaxima = p.ronda; });
        snap.forEach(doc => { const p = doc.data(); if(p.ronda === rondaMaxima) { partidosRondaActiva.push({id: doc.id, ...p}); if(p.ganador === "") todosTienenGanador = false; } });
        
        contenedor.innerHTML = `<h4 style="color: var(--blue); margin-bottom: 10px;">RONDA ${rondaMaxima}</h4>`;
        
        partidosRondaActiva.forEach(p => {
            if(p.ganador !== "") {
                contenedor.innerHTML += `<div style="background: #111; padding: 10px; margin-bottom: 5px; border-radius: 5px; border-left: 3px solid var(--green);"><span style="color: #888;">${p.p1} vs ${p.p2}</span><br><strong style="color: var(--green);"><i class="fas fa-check"></i> Ganador: ${p.ganador}</strong></div>`;
            } else if (p.reporte_pendiente) {
                let pruebaHtml = p.reporte_pendiente.prueba !== 'Sin link' && p.reporte_pendiente.prueba !== 'No adjuntada (Revisar WS)' 
                    ? `<a href="${p.reporte_pendiente.prueba}" target="_blank" style="color: var(--blue); font-size: 0.8rem; text-decoration: underline;">Ver Captura de Pantalla</a>` 
                    : `<span style="color: #888; font-size: 0.8rem;">Sin captura (Validar por WS)</span>`;

                contenedor.innerHTML += `
                    <div style="background: #111; padding: 10px; margin-bottom: 10px; border-radius: 5px; border: 1px solid gold;">
                        <div style="margin-bottom: 5px; font-weight: bold; text-align: center;">${p.p1} <span style="color:var(--red);">VS</span> ${p.p2}</div>
                        <div style="background: rgba(255, 215, 0, 0.1); padding: 8px; border-radius: 5px; margin-bottom: 10px; font-size: 0.9rem;">
                            <i class="fas fa-exclamation-triangle" style="color: gold;"></i> <strong>${p.reporte_pendiente.reportadoPor}</strong> reportó victoria para:<br>
                            <span style="color: var(--green); font-weight: bold; font-size: 1.1rem;">${p.reporte_pendiente.ganadorPropuesto}</span><br>
                            ${pruebaHtml}
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn-primary" style="flex: 2; padding: 5px; font-size:0.8rem; background: var(--green); color: black;" onclick="setGanador('${torneoId}', '${p.id}', '${p.reporte_pendiente.ganadorPropuesto}')">APROBAR REPORTE</button>
                            <button class="btn-secondary" style="flex: 1; padding: 5px; font-size:0.8rem; background: var(--red); color: white; border: none;" onclick="rechazarReporte('${torneoId}', '${p.id}')">Rechazar</button>
                        </div>
                    </div>
                `;
            } else {
                contenedor.innerHTML += `
                    <div style="background: #111; padding: 10px; margin-bottom: 10px; border-radius: 5px; border: 1px solid var(--blue);">
                        <div style="margin-bottom: 10px; font-weight: bold; text-align: center;">${p.p1} <span style="color:var(--red);">VS</span> ${p.p2}</div>
                        <p style="text-align: center; font-size: 0.7rem; color: #888; margin-bottom: 5px;">Esperando reporte de los jugadores...</p>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn-secondary" style="flex: 1; padding: 5px; font-size:0.8rem;" onclick="setGanador('${torneoId}', '${p.id}', '${p.p1}')">Forzar: Gana ${p.p1}</button>
                            <button class="btn-secondary" style="flex: 1; padding: 5px; font-size:0.8rem;" onclick="setGanador('${torneoId}', '${p.id}', '${p.p2}')">Forzar: Gana ${p.p2}</button>
                        </div>
                    </div>
                `;
            }
        });
        if(todosTienenGanador) { btnSiguiente.style.display = "block"; btnSiguiente.onclick = () => generarSiguienteRonda(torneoId, rondaMaxima, partidosRondaActiva); } else { btnSiguiente.style.display = "none"; }
    });
}

function rechazarReporte(torneoId, partidoId) {
    if(confirm("¿Deseas rechazar este reporte? El partido volverá a quedar pendiente.")) {
        db.collection('torneos').doc(torneoId).collection('llaves').doc(partidoId).update({ reporte_pendiente: firebase.firestore.FieldValue.delete() });
    }
}

function setGanador(torneoId, partidoId, ganador) {
    if(confirm(`¿Confirmas que ${ganador} avanza de ronda?`)) { 
        db.collection('torneos').doc(torneoId).collection('llaves').doc(partidoId).update({ 
            ganador: ganador, reporte_pendiente: firebase.firestore.FieldValue.delete()
        }).then(() => {
            // Notificar al ganador
            enviarNotificacion(ganador, "El Kage aprobó el reporte. ¡Has avanzado de ronda!");
        }); 
    }
}

async function generarSiguienteRonda(torneoId, rondaActual, partidos) {
    const ganadores = partidos.map(p => p.ganador);
    if(ganadores.length === 1) {
        const campeon = ganadores[0];
        await db.collection('torneos').doc(torneoId).update({ estado: 'finalizado', campeon: campeon });
        
        db.collection('ninjas').where('nick', '==', campeon).get().then(snap => {
            if(!snap.empty) {
                const docId = snap.docs[0].id;
                const userData = snap.docs[0].data();
                const xpActual = userData.xp || 0;
                
                db.collection('ninjas').doc(docId).update({ xp: xpActual + 100 });
                
                if(userData.clan && userData.clan !== "") {
                    db.collection('clanes').doc(userData.clan).update({ xp: firebase.firestore.FieldValue.increment(100) });
                }
            }
        });
        
        enviarNotificacion(campeon, `¡ERES EL CAMPEÓN! Se te han otorgado +100 XP a ti y a tu Escuadrón.`);
        
        alert(`¡EL TORNEO HA FINALIZADO! CAMPEÓN: ${campeon}. Se le han otorgado +100 XP a él y a su Escuadrón.`);
        window.location.hash = "#admin";
        return;
    }
    const nuevosPartidos = [];
    for (let i = 0; i < ganadores.length; i += 2) {
        if (ganadores[i + 1]) { nuevosPartidos.push({ p1: ganadores[i], p2: ganadores[i + 1], ganador: "", ronda: rondaActual + 1 }); } 
        else { nuevosPartidos.push({ p1: ganadores[i], p2: "BYE", ganador: ganadores[i], ronda: rondaActual + 1 }); }
    }
    const batch = db.batch(); const llavesRef = db.collection('torneos').doc(torneoId).collection('llaves'); const time = new Date().getTime();
    nuevosPartidos.forEach((p, index) => { const newDoc = llavesRef.doc(`partido_r${rondaActual + 1}_${index}_${time}`); batch.set(newDoc, p); });
    await batch.commit(); 
    
    // Notificar a los que avanzaron
    ganadores.forEach(g => {
        enviarNotificacion(g, `La Ronda ${rondaActual + 1} ha sido generada. ¡Prepárate para tu próxima batalla!`);
    });

    alert(`¡Ronda ${rondaActual + 1} generada con éxito!`);
}

function verLlaves(torneoId, torneoNombre) {
    const contenedor = document.getElementById('contenedor-llaves-texto'); const contenedorCampeon = document.getElementById('contenedor-campeon');
    document.getElementById('llaves-titulo').innerText = `Llaves: ${torneoNombre}`;
    contenedor.innerHTML = '<p style="color: #888;">Leyendo los pergaminos...</p>'; contenedorCampeon.innerHTML = '';
    window.location.hash = "#modal-llaves";
    
    db.collection('torneos').doc(torneoId).get().then(doc => {
        if(doc.exists && doc.data().estado === 'finalizado') { contenedorCampeon.innerHTML = `<div style="background: rgba(255, 215, 0, 0.1); border: 1px solid gold; padding: 15px; text-align: center; border-radius: 8px; margin-bottom: 20px;"><h4 style="color: gold; margin-bottom: 5px;"><i class="fas fa-crown"></i> GRAN CAMPEÓN</h4><strong style="font-size: 1.5rem; cursor:pointer;" onclick="abrirPerfil('${doc.data().campeon}')">${doc.data().campeon}</strong></div>`; }
    });
    
    db.collection('torneos').doc(torneoId).collection('llaves').orderBy('ronda', 'asc').onSnapshot(snap => {
        if(snap.empty) { contenedor.innerHTML = '<p style="color: var(--red);">El Kage aún no ha generado los cruces.</p>'; return; }
        contenedor.innerHTML = ""; let currentRonda = 0;
        
        snap.forEach(doc => {
            const p = doc.data();
            if (p.ronda !== currentRonda) { contenedor.innerHTML += `<div style="font-weight:bold; color:var(--blue); margin-top:20px; border-bottom:1px solid #333; padding-bottom:5px; text-transform: uppercase;">RONDA ${p.ronda}</div>`; currentRonda = p.ronda; }
            
            const colorP1 = p.ganador === p.p1 ? 'color: var(--green); font-weight: bold;' : (p.ganador !== "" ? 'color: #555; text-decoration: line-through;' : 'color: white;');
            const colorP2 = p.ganador === p.p2 ? 'color: var(--green); font-weight: bold;' : (p.ganador !== "" && p.p2 !== "BYE" ? 'color: #555; text-decoration: line-through;' : 'color: white;');
            
            let botonAccionHTML = "";
            if (p.ganador === "" && p.p2 !== "BYE") {
                if (p.reporte_pendiente) {
                    botonAccionHTML = `<div style="font-size: 0.7rem; color: gold; text-align: center; margin-top: 8px; border-top: 1px dashed #333; padding-top: 5px;"><i class="fas fa-clock"></i> Revisión pendiente del Kage...</div>`;
                } else if (currentUserName !== "Ninja Anónimo" && (currentUserName === p.p1 || currentUserName === p.p2)) {
                    botonAccionHTML = `<div style="text-align: center; margin-top: 8px; border-top: 1px dashed #333; padding-top: 5px;"><button class="btn-primary" style="padding: 4px 10px; font-size: 0.7rem; background: var(--blue); color: black;" onclick="abrirModalReporte('${torneoId}', '${doc.id}', '${p.p1}', '${p.p2}')"><i class="fas fa-flag"></i> Cargar Resultado</button></div>`;
                }
            }

            contenedor.innerHTML += `
                <div style="background: #111; padding: 12px; margin-top: 10px; border-radius: 5px; border: 1px solid #222;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="${colorP1}; cursor:pointer;" onclick="abrirPerfil('${p.p1}')">${p.p1}</span>
                        <span style="color: #444; font-size: 0.8rem; font-weight: bold;">VS</span>
                        <span style="${colorP2}; cursor:pointer;" onclick="abrirPerfil('${p.p2}')">${p.p2}</span>
                    </div>
                    ${botonAccionHTML}
                </div>
            `;
        });
    });
}

function abrirModalReporte(torneoId, partidoId, p1, p2) {
    document.getElementById('rep-torneo-id').value = torneoId;
    document.getElementById('rep-partido-id').value = partidoId;
    const selectGanador = document.getElementById('rep-ganador');
    selectGanador.innerHTML = `<option value="" disabled selected>Selecciona al ganador...</option><option value="${p1}">${p1}</option><option value="${p2}">${p2}</option>`;
    document.getElementById('modal-reporte').style.display = 'flex';
}

function mostrarTabAdmin(tabId) {
    const tabs = ['tab-torneos', 'tab-byakugan', 'tab-llaves-admin', 'tab-pagos', 'tab-ban'];
    tabs.forEach(t => { const el = document.getElementById(t); if(el) el.style.display = 'none'; });
    document.getElementById(tabId).style.display = 'block';
    const botones = document.querySelectorAll('#admin .btn-filter');
    botones.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}
