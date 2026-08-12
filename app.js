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

// ==========================================
// MERCADO (CATÁLOGO)
// ==========================================
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
                    
                    if(data.banned) {
                        alert("Has sido expulsado de la Arena.");
                        auth.signOut();
                        return;
                    }

                    miPerfilActual = data; 
                    currentUserName = data.nick; 
                    miClan = data.clan || ""; 
                    miComunidad = data.comunidad || "";
                    misRyos = data.ryos || 0; 
                    miPlan = data.plan || "genin";
                    miInventario = data.inventario || []; 
                    miEquipamiento = data.equipado || { borde: '', colorChat: '', pin: '' };

                    if(userDisplay) { 
                        userDisplay.innerText = currentUserName; 
                        userDisplay.href = "#"; 
                    }
                    
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
                    } else if (miComunidad !== "") {
                        escucharChatComunidad(miComunidad);
                    }

                    if(esAdmin || miPlan === 'jonin' || miPlan === 'kasekage') {
                        if(adminNav) adminNav.style.display = 'block';
                        if(adminSection) adminSection.style.display = 'block';
                        
                        document.getElementById('titulo-panel-admin').innerText = esAdmin ? 'Centro de Mando del Creador' : 'Panel de Organización';
                        document.getElementById('btn-admin-nav').innerText = esAdmin ? 'Creador' : 'Organizador';
                        
                        const adminElements = document.querySelectorAll('.admin-only');
                        adminElements.forEach(el => {
                            el.style.display = esAdmin ? 'inline-block' : 'none';
                        });

                        if(!esAdmin && miPlan === 'jonin') {
                            document.getElementById('opt-3v3').disabled = true;
                            document.getElementById('opt-5v5').disabled = true;
                            document.getElementById('opt-liga').disabled = true;
                        } else if (!esAdmin && miPlan === 'kasekage') {
                            document.getElementById('opt-liga').disabled = true;
                        }

                        cargarTorneosParaAdminLlaves();
                        cargarListaBorrarTorneosAdmin(); 
                    }
                } else {
                    window.location.hash = "#modal-registro-nick";
                }
            });
            escucharNotificaciones();
        } else {
            currentUserName = "Héroe Anónimo";
            if(userDisplay) { 
                userDisplay.innerText = "Ingresar"; 
                userDisplay.href = "#modal-login"; 
            }
            document.getElementById('btn-notif').style.display = 'none';
        }
    });

    const loginBtn = document.getElementById('login-google');
    if(loginBtn) { 
        loginBtn.addEventListener('click', () => { 
            auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); 
        }); 
    }
    
    const loginFbBtn = document.getElementById('login-facebook');
    if(loginFbBtn) {
        loginFbBtn.addEventListener('click', () => {
            auth.signInWithPopup(new firebase.auth.FacebookAuthProvider());
        });
    }

    const formNick = document.getElementById('form-registro-nick');
    if(formNick) {
        formNick.addEventListener('submit', (e) => {
            e.preventDefault();
            const nuevoNick = document.getElementById('nuevo-nick').value.trim();
            db.collection('ninjas').doc(currentUserId).set({
                nick: nuevoNick, 
                xp: 0, 
                ryos: 100, 
                torneosGanados: 0, 
                rango: "Guerrero", 
                clan: "", 
                comunidad: "", 
                plan: "genin", 
                banned: false,
                inventario: [], 
                equipado: {borde: '', colorChat: '', pin: ''}, 
                fotoPerfil: "", 
                bio: "",
                redSocial: "", 
                email_oculto: auth.currentUser.email || "anonimo@mblarg.com", 
                fecha_registro: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                alert("¡Identidad creada! +100 Diamantes de bienvenida.");
                window.location.hash = "#";
                window.location.reload();
            });
        });
    }

    const formReporte = document.getElementById('form-reporte');
    if(formReporte) {
        formReporte.addEventListener('submit', async (e) => {
            e.preventDefault();
            const torneoId = document.getElementById('rep-torneo-id').value;
            const partidoId = document.getElementById('rep-partido-id').value;
            const ganador = document.getElementById('rep-ganador').value;
            const fileInput = document.getElementById('rep-prueba-file');
            const file = fileInput ? fileInput.files[0] : null;
            const btnSubmit = document.getElementById('btn-enviar-reporte');

            if(!file || !ganador) return alert("Debes seleccionar al ganador y adjuntar la captura (foto) de prueba.");

            btnSubmit.innerText = "SUBIENDO PRUEBA...";
            btnSubmit.disabled = true;

            try {
                const storageRef = storage.ref(`reportes/${torneoId}_${partidoId}_${Date.now()}`);
                await storageRef.put(file);
                const capturaUrl = await storageRef.getDownloadURL();

                await db.collection('torneos').doc(torneoId).collection('llaves').doc(partidoId).update({
                    reporte: {
                        ganador: ganador,
                        capturaUrl: capturaUrl,
                        reportadoPor: currentUserName,
                        timestamp: new Date().getTime()
                    }
                });

                alert("¡Reporte enviado con éxito! El Kage verificará la imagen.");
                document.getElementById('modal-reporte').style.display = 'none';
            } catch (error) {
                console.error("Error al reportar:", error);
                alert("Hubo un error al subir la prueba. Intenta nuevamente.");
            } finally {
                btnSubmit.innerText = "ENVIAR REPORTE AL KAGE";
                btnSubmit.disabled = false;
            }
        });
    }

    escucharPersonalizacion();
    escucharTicker();
    escucharStreamYDiscordGlobal(); 
    cargarTorneosDesdeNube();
    cargarSorteos(); 
    cargarHallOfFame();
    cargarVideosAbismo();
    cargarTopClanes();
    cargarAnunciosGremio();
    cargarTopIndividualBingo();
    escucharTabernaGlobal();
    configurarAdminForms();
    cargarTopComunidades();
});

// ==========================================
// NUEVO: SISTEMA DE LOGIN MANUAL Y REPORTES
// ==========================================
window.abrirModalReporte = function(torneoId, partidoId, p1, p2) {
    document.getElementById('rep-torneo-id').value = torneoId;
    document.getElementById('rep-partido-id').value = partidoId;
    
    const optP1 = document.getElementById('opt-p1');
    const optP2 = document.getElementById('opt-p2');
    optP1.value = p1; optP1.innerText = "Ganó " + p1;
    optP2.value = p2; optP2.innerText = "Ganó " + p2;
    
    document.getElementById('rep-ganador').value = "";
    document.getElementById('rep-prueba-file').value = "";
    
    document.getElementById('modal-reporte').style.display = 'flex';
};

window.cambiarSeccionAuth = function(mostrarRegistro) {
    document.getElementById('login-normal-section').style.display = mostrarRegistro ? 'none' : 'block';
    document.getElementById('register-manual-section').style.display = mostrarRegistro ? 'block' : 'none';
};

window.registrarUsuarioManual = function() {
    const user = document.getElementById('reg-usuario').value.trim().toLowerCase();
    const pass = document.getElementById('reg-pass').value.trim();
    if(user.length < 4 || pass.length < 6) {
        return alert("El usuario requiere mínimo 4 letras y la contraseña mínimo 6 caracteres.");
    }
    const emailFalso = `${user}@mblarg.com`;
    auth.createUserWithEmailAndPassword(emailFalso, pass).then(() => {
        alert("¡Cuenta creada exitosamente!");
        window.location.hash = "#modal-registro-nick";
    }).catch(err => {
        alert("Error: Es posible que el nombre de usuario ya esté en uso o la clave sea muy débil.");
    });
};

window.autenticarUsuarioManual = function() {
    const user = document.getElementById('login-email-falso').value.trim().toLowerCase();
    const pass = document.getElementById('login-pass').value.trim();
    if(!user || !pass) return alert("Completa todos los campos para ingresar.");
    const emailFalso = user.includes('@') ? user : `${user}@mblarg.com`;
    
    auth.signInWithEmailAndPassword(emailFalso, pass).then(() => {
        alert("Acceso concedido a la Arena.");
        window.location.hash = "#";
    }).catch(err => {
        alert("Credenciales incorrectas o el usuario no existe.");
    });
};

// ==========================================
// NUEVO: BORRADO DE TORNEOS Y RESET BINGO
// ==========================================
window.cargarListaBorrarTorneosAdmin = function() {
    const cont = document.getElementById('admin-lista-borrar-torneos');
    if(!cont) return;
    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        cont.innerHTML = "";
        if(snap.empty) {
            cont.innerHTML = "<p style='color:#666; font-size:0.85rem;'>No hay torneos registrados en el sistema.</p>";
            return;
        }
        snap.forEach(doc => {
            const d = doc.data();
            cont.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.4); padding:10px; border-radius:5px; border:1px solid #222; font-size:0.85rem; margin-bottom: 5px;">
                    <span style="color:white;">${d.nombre} (${d.formato})</span>
                    <button class="btn-primary" style="background:var(--red); color:white; padding:4px 12px; font-size:0.75rem; border:none; cursor:pointer;" onclick="borrarTorneoDefinitivo('${doc.id}','${d.nombre}')"><i class="fas fa-trash"></i> BORRAR</button>
                </div>`;
        });
    });
};

window.borrarTorneoDefinitivo = function(id, nombre) {
    if(confirm(`⚠️ ¿ESTÁS SEGURO?\nVas a eliminar permanentemente "${nombre}". Esto borrará sus llaves y todos los datos asociados.`)) {
        db.collection('torneos').doc(id).delete().then(() => {
            alert("Torneo purgado con éxito.");
        });
    }
};

window.reiniciarTopBingo = async function() {
    if(!confirm("🚨 ¡ADVERTENCIA MÁXIMA!\n¿Deseas reiniciar el ranking del Libro Bingo? Esto pondrá los XP de todos los jugadores en 0. Sus Diamantes, Inventarios y Clanes quedarán intactos.")) return;
    if(!confirm("¿Confirmas la acción para iniciar la Nueva Temporada competitiva?")) return;
    
    try {
        const snap = await db.collection('ninjas').get();
        const batch = db.batch();
        snap.forEach(doc => {
            batch.update(doc.ref, { xp: 0 });
        });
        await batch.commit();
        alert("🏆 ¡Ranking reiniciado! Temporada iniciada con éxito.");
    } catch(e) {
        alert("Error al reiniciar: " + e.message);
    }
};

// ==========================================
// PERSONALIZACIÓN DINÁMICA
// ==========================================
function escucharPersonalizacion() {
    db.collection('configuracion').doc('personalizacion').onSnapshot(doc => {
        if(doc.exists) {
            const data = doc.data();
            const bgVideo = document.getElementById('main-bg-video');
            const bgImage = document.getElementById('main-bg-image');
            
            if (data.bgTipo === 'imagen') {
                if(bgVideo) bgVideo.style.display = 'none';
                if(bgImage) { bgImage.style.display = 'block'; bgImage.src = data.bgUrl || ''; }
            } else {
                if(bgImage) bgImage.style.display = 'none';
                if(bgVideo) { bgVideo.style.display = 'block'; bgVideo.src = data.bgUrl || 'https://raw.githubusercontent.com/Matiasmj7/mbl-world/main/bingo_bg_video.mp4'; }
            }
            
            if (data.colorAcento) {
                document.documentElement.style.setProperty('--blue', data.colorAcento);
                const colorInput = document.getElementById('cfg-color-acento');
                if (colorInput) colorInput.value = data.colorAcento;
            }

            const redes = ['wa', 'ds', 'fb', 'tt', 'ig', 'yt'];
            redes.forEach(red => {
                const linkEl = document.getElementById(`link-soc-${red}`);
                const inputEl = document.getElementById(`cfg-link-${red}`);
                if(data.linksSociales && data.linksSociales[red]) {
                    if(linkEl) linkEl.href = data.linksSociales[red];
                    if(inputEl) inputEl.value = data.linksSociales[red];
                }
            });

            const secciones = ['stream', 'fama', 'ligas', 'planes', 'torneos', 'bingo', 'comunidades', 'sorteos', 'abismo', 'gremio', 'tienda'];
            secciones.forEach(sec => {
                const sectionEl = document.getElementById(sec);
                const menuEl = document.getElementById(`menu-${sec === 'bingo' ? 'registro-bingo' : sec}`);
                if (data.visibilidad && typeof data.visibilidad[sec] !== 'undefined') {
                    const isVisible = data.visibilidad[sec];
                    if (sectionEl) sectionEl.style.display = isVisible ? 'block' : 'none';
                    if (menuEl) menuEl.style.display = isVisible ? '' : 'none';
                    const checkAdmin = document.getElementById(`vis-cfg-${sec}`);
                    if (checkAdmin) checkAdmin.checked = isVisible;
                }
                const titleEl = document.getElementById(`head-${sec}`);
                if (titleEl && data.titulos && data.titulos[sec]) {
                    const icon = titleEl.querySelector('i');
                    titleEl.innerHTML = (icon ? icon.outerHTML + ' ' : '') + data.titulos[sec];
                    const inputAdmin = document.getElementById(`title-cfg-${sec}`);
                    if(inputAdmin) inputAdmin.value = data.titulos[sec];
                }
            });
        }
    });
}

// ==========================================
// STREAM Y DISCORD GLOBAL
// ==========================================
function escucharStreamYDiscordGlobal() {
    const iframeStream = document.getElementById('stream-frame');
    const iframeDiscord = document.getElementById('chat-externo-frame');
    const statusText = document.getElementById('status-stream');
    
    if(!iframeStream || !statusText || !iframeDiscord) return;
    
    db.collection('configuracion').doc('global_media').onSnapshot(doc => {
        if(doc.exists) {
            const data = doc.data();
            const plat = data.plataforma || 'kick';
            const id = data.id || 'matias_mj7';
            const discordUrl = data.discordUrl || 'https://e.widgetbot.io/channels/299881420891881473/299881420891881473'; 
            let finalSrc = "";

            if (plat === 'kick') { 
                finalSrc = `https://player.kick.com/${id}`; 
                statusText.innerHTML = `<i class="fas fa-satellite-dish" style="color:var(--green);"></i> EN VIVO DESDE KICK: <strong style="color:white;">${id}</strong>`; 
            } else if (plat === 'youtube') { 
                finalSrc = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&rel=0`; 
                statusText.innerHTML = `<i class="fab fa-youtube" style="color:var(--red);"></i> PROMOCIÓN YOUTUBE`; 
            } else if (plat === 'tiktok') { 
                finalSrc = `https://www.tiktok.com/embed/v2/${id}`; 
                statusText.innerHTML = `<i class="fab fa-tiktok"></i> PROMOCIÓN TIKTOK`; 
            } else if (plat === 'twitch') { 
                finalSrc = `https://player.twitch.tv/?channel=${id}&parent=${window.location.hostname}`; 
                statusText.innerHTML = `<i class="fab fa-twitch" style="color:#9146ff;"></i> EN VIVO TWITCH: <strong style="color:white;">${id}</strong>`; 
            }

            if(iframeStream.src !== finalSrc) iframeStream.src = finalSrc;
            if(iframeDiscord.src !== discordUrl) iframeDiscord.src = discordUrl;
        } else {
            iframeStream.src = `https://player.kick.com/matias_mj7`;
            statusText.innerHTML = `<i class="fas fa-satellite-dish" style="color:var(--green);"></i> EN VIVO DESDE KICK: <strong style="color:white;">matias_mj7</strong>`;
        }
    });
}

function extraerIdLimpio(urlCruda, plataforma) {
    let id = urlCruda.trim();
    try { 
        if (plataforma === 'twitch') { if (id.includes('twitch.tv/')) id = id.split('twitch.tv/')[1].split('?')[0].replace('/', ''); } 
        else if (plataforma === 'youtube') { if (id.includes('v=')) id = id.split('v=')[1].split('&')[0]; else if (id.includes('youtu.be/')) id = id.split('youtu.be/')[1].split('?')[0]; else if (id.includes('/live/')) id = id.split('/live/')[1].split('?')[0]; } 
        else if (plataforma === 'kick') { if (id.includes('kick.com/')) id = id.split('kick.com/')[1].split('?')[0].replace('/', ''); } 
        else if (plataforma === 'tiktok') { if (id.includes('/video/')) id = id.split('/video/')[1].split('?')[0]; } 
    } catch(e) {}
    return id;
}

// ==========================================
// SORTEOS Y RULETA
// ==========================================
function cargarSorteos() {
    const listaSorteos = document.getElementById('lista-sorteos');
    if(!listaSorteos) return;
    
    db.collection('sorteos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        listaSorteos.innerHTML = '';
        if(snap.empty) {
            listaSorteos.innerHTML = '<p style="color: #ccc; grid-column: 1 / -1; text-align: center;">No hay sorteos activos en este momento.</p>';
            return;
        }

        const esAdmin = (auth.currentUser?.email === ADMIN_EMAIL);

        snap.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            const inscritos = data.participantes ? data.participantes.length : 0;
            const yaInscrito = data.participantes && data.participantes.includes(currentUserName);
            
            let btnTexto = data.precio > 0 ? `PARTICIPAR (${data.precio} D)` : "ENTRAR GRATIS";
            let btnColor = "var(--blue)";
            let btnDisabled = "";

            if (data.estado !== 'abierto') {
                btnTexto = "SORTEO CERRADO";
                btnColor = "gray";
                btnDisabled = "disabled";
            } else if (yaInscrito) {
                btnTexto = "YA ESTÁS PARTICIPANDO";
                btnColor = "var(--green)";
                btnDisabled = "disabled";
            }
            
            let adminHTML = "";
            if (esAdmin && data.estado === 'abierto') {
                adminHTML = `<button class="btn-primary" style="width:100%; margin-top:10px; background:#ff00ff; color:white;" onclick="ejecutarSorteo('${id}', '${data.premio}', ${data.cantidadGanadores})"><i class="fas fa-dice"></i> SORTEAR AHORA</button>`;
            }

            let ganadoresHTML = "";
            if (data.estado === 'cerrado' && data.ganadores) {
                ganadoresHTML = `<div style="margin-top:10px; padding:10px; background:rgba(255,0,255,0.1); border:1px dashed #ff00ff; border-radius:5px;"><strong style="color:#ff00ff;"><i class="fas fa-crown"></i> Ganador/es:</strong><br><span style="color:white; font-weight:bold;">${data.ganadores.join(', ')}</span></div>`;
            }

            listaSorteos.innerHTML += `
                <div class="card-t container-glass" style="border-color: #ff00ff !important; box-shadow: 0 0 15px rgba(255,0,255,0.2);">
                    <span style="color:#ff00ff; font-weight:bold; font-size: 0.8rem; background: rgba(255, 0, 255, 0.1); padding: 4px 10px; border-radius: 4px; border: 1px solid #ff00ff; display: inline-block; margin-bottom: 10px;">EVENTO ESPECIAL</span>
                    <h3 style="margin-bottom: 10px;">Premio: <span style="color:gold;">${data.premio}</span></h3>
                    <p style="font-size:0.9rem; margin-bottom:5px;"><i class="fas fa-gem"></i> Entrada: <strong style="color:var(--green);">${data.precio === 0 ? 'GRATIS' : data.precio + ' Diamantes'}</strong></p>
                    <p style="font-size:0.9rem; color:#aaa; margin-bottom:10px;"><i class="fas fa-users"></i> Participantes: ${inscritos}</p>
                    ${ganadoresHTML}
                    <div style="margin-top: auto;">
                        <button class="btn-primary" style="width:100%; background: ${btnColor}; color: ${btnDisabled ? '#555' : 'black'};" onclick="unirseSorteo('${id}', ${data.precio}, '${data.estado}')" ${btnDisabled}>${btnTexto}</button>
                        ${adminHTML}
                    </div>
                </div>
            `;
        });
    });
}

window.unirseSorteo = function(sorteoId, precio, estado) {
    if(estado !== 'abierto') return;
    if(currentUserName === "Héroe Anónimo") { alert("Debes iniciar sesión para participar."); return; }

    if (precio > 0) {
        if (misRyos < precio) { alert("No tienes suficientes Diamantes para este sorteo."); return; }
        if (!confirm(`¿Estás seguro de gastar ${precio} Diamantes en este ticket?`)) return;
        
        db.collection('ninjas').doc(currentUserId).update({
            ryos: firebase.firestore.FieldValue.increment(-precio)
        });
    }

    db.collection('sorteos').doc(sorteoId).update({
        participantes: firebase.firestore.FieldValue.arrayUnion(currentUserName)
    }).then(() => {
        alert("¡Ticket asegurado! Mucha suerte.");
    });
};

window.ejecutarSorteo = function(sorteoId, premioNombre, cantidadGanadores) {
    db.collection('sorteos').doc(sorteoId).get().then(doc => {
        let participantes = doc.data().participantes || [];
        if(participantes.length === 0) return alert("No hay nadie inscrito en el sorteo.");
        
        document.getElementById('modal-ruleta').style.display = 'flex';
        const spanNombre = document.getElementById('nombre-ruleta');
        const divGanadores = document.getElementById('ganadores-lista');
        const btnCerrar = document.getElementById('btn-cerrar-ruleta');
        
        document.getElementById('ruleta-premio').innerText = "SORTEANDO: " + premioNombre.toUpperCase();
        divGanadores.style.display = 'none';
        btnCerrar.style.display = 'none';
        spanNombre.classList.add('ruleta-blur');
        
        let iteracion = 0;
        let intervalo = setInterval(() => {
            spanNombre.innerText = participantes[Math.floor(Math.random() * participantes.length)];
            iteracion++;
            
            if(iteracion > 30) {
                clearInterval(intervalo);
                spanNombre.classList.remove('ruleta-blur');
                
                let ganadores = [];
                let pool = [...participantes];
                
                for(let i=0; i<cantidadGanadores; i++) {
                    if(pool.length === 0) break;
                    let index = Math.floor(Math.random() * pool.length);
                    ganadores.push(pool[index]);
                    pool.splice(index, 1);
                }

                spanNombre.innerText = "¡Sorteo Finalizado!";
                divGanadores.innerHTML = "GANADORES:<br>" + ganadores.join('<br>');
                divGanadores.style.display = 'block';
                btnCerrar.style.display = 'block';
                
                db.collection('sorteos').doc(sorteoId).update({
                    estado: 'cerrado',
                    ganadores: ganadores
                });

                ganadores.forEach(ganador => {
                    enviarNotificacion(ganador, `🎉 ¡FELICIDADES! Acabas de ganar el sorteo por: ${premioNombre}. Comunícate con un Admin.`);
                });
            }
        }, 100);
    });
};

// ==========================================
// COMUNIDADES / ALIANZAS
// ==========================================
window.crearComunidad = function() {
    const nombre = document.getElementById('input-crear-comunidad').value.trim();
    if(!nombre || currentUserName === "Héroe Anónimo") return;
    
    db.collection('comunidades').doc(nombre).get().then(doc => {
        if(doc.exists) {
            alert("Ya existe una Alianza con ese nombre.");
        } else {
            db.collection('comunidades').doc(nombre).set({
                nombre: nombre,
                lider: currentUserName,
                miembros: [currentUserName],
                creacion: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                db.collection('ninjas').doc(currentUserId).update({ comunidad: nombre });
                alert("¡Alianza fundada con éxito!");
            });
        }
    });
};

window.unirseComunidad = function() {
    const nombre = document.getElementById('input-unirse-comunidad').value.trim();
    if(!nombre || currentUserName === "Héroe Anónimo") return;

    db.collection('comunidades').doc(nombre).get().then(doc => {
        if(!doc.exists) {
            alert("No existe ninguna Alianza con ese nombre.");
        } else {
            db.collection('comunidades').doc(nombre).update({
                miembros: firebase.firestore.FieldValue.arrayUnion(currentUserName)
            }).then(() => {
                db.collection('ninjas').doc(currentUserId).update({ comunidad: nombre });
                alert("Te has unido a la Alianza.");
            });
        }
    });
};

window.abandonarComunidad = function() {
    if(confirm("¿Estás seguro de abandonar tu Alianza?")) {
        db.collection('comunidades').doc(miComunidad).get().then(doc => {
            if(doc.exists) {
                const data = doc.data();
                if(data.lider === currentUserName && data.miembros.length > 1) {
                    alert("Eres el líder. Debes nombrar a otro líder antes de irte o ser el último en salir.");
                    return;
                }
                if(data.miembros.length === 1) {
                    db.collection('comunidades').doc(miComunidad).delete();
                } else {
                    db.collection('comunidades').doc(miComunidad).update({
                        miembros: firebase.firestore.FieldValue.arrayRemove(currentUserName)
                    });
                }
                db.collection('ninjas').doc(currentUserId).update({ comunidad: "" }).then(() => {
                    window.location.reload();
                });
            }
        });
    }
};

function cargarTopComunidades() {
    const lista = document.getElementById('lista-top-comunidades');
    if(!lista) return;

    db.collection('comunidades').onSnapshot(snap => {
        let comunidades = [];
        snap.forEach(doc => comunidades.push(doc.data()));
        
        comunidades.sort((a, b) => b.miembros.length - a.miembros.length);
        
        lista.innerHTML = "";
        comunidades.slice(0, 5).forEach((com, index) => {
            let color = index === 0 ? 'gold' : (index === 1 ? 'silver' : (index === 2 ? '#cd7f32' : '#333'));
            lista.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.5); padding:10px; margin-bottom:5px; border-left:3px solid ${color};">
                    <div>
                        <strong>${index + 1}. ${com.nombre}</strong><br>
                        <span style="font-size:0.7rem; color:#888;">Líder: ${com.lider}</span>
                    </div>
                    <div style="color:var(--purple); font-weight:bold;">
                        <i class="fas fa-users"></i> ${com.miembros.length}
                    </div>
                </div>
            `;
        });
    });
}

function escucharChatComunidad(nombreComunidad) {
    if(!nombreComunidad) return;
    const cont = document.getElementById('chat-comunidad-container');
    if(!cont) return;

    if(unsubscribeChatComunidad) {
        unsubscribeChatComunidad();
    }

    unsubscribeChatComunidad = db.collection('chat_comunidades')
        .where('comunidad', '==', nombreComunidad)
        .orderBy('timestamp')
        .limit(50)
        .onSnapshot(snap => {
            cont.innerHTML = '';
            snap.forEach(doc => {
                const data = doc.data();
                
                let estiloColor = "color: var(--purple);";
                if(data.colorEstilo) {
                    const itemTienda = CATALOGO_TIENDA.find(i => i.id === data.colorEstilo);
                    if(itemTienda) estiloColor = itemTienda.estilo;
                }
                
                if(data.usuario === 'Matías' || data.usuario === 'Kage') {
                    estiloColor = "color: var(--red); text-shadow: 0 0 5px red;";
                }

                cont.innerHTML += `
                    <div style="margin-bottom:8px; font-size:0.85rem;">
                        <strong style="${estiloColor} cursor:pointer;" onclick="abrirPerfil('${data.usuario}')">${data.usuario}:</strong> 
                        <span style="color:#ddd; word-break:break-all;">${data.texto}</span>
                    </div>`;
            });
            cont.scrollTop = cont.scrollHeight;
        });
}

window.enviarMensajeComunidad = function() {
    const input = document.getElementById('chat-input-comunidad');
    const texto = input.value.trim();
    if(!texto || currentUserName === "Héroe Anónimo") return;

    let targetComunidad = miComunidad;
    if(auth.currentUser?.email === ADMIN_EMAIL) {
        targetComunidad = document.getElementById('kage-comunidad-selector').value;
    }

    if(!targetComunidad) return;

    db.collection('chat_comunidades').add({
        comunidad: targetComunidad,
        usuario: currentUserName,
        texto: texto,
        colorEstilo: miEquipamiento.colorChat || '',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    input.value = '';
};

function cargarSelectorComunidadesKage() {
    const selector = document.getElementById('kage-comunidad-selector');
    db.collection('comunidades').onSnapshot(snap => {
        selector.innerHTML = "<option value='' disabled selected>Selecciona una Alianza para vigilar...</option>";
        snap.forEach(doc => {
            selector.innerHTML += `<option value="${doc.id}">${doc.id}</option>`;
        });
    });
}

window.cambiarChatComunidadKage = function() {
    const seleccion = document.getElementById('kage-comunidad-selector').value;
    if(seleccion) {
        escucharChatComunidad(seleccion);
    }
};

// ==========================================
// TIENDA Y MERCADO
// ==========================================
function renderizarTienda() {
    const catalogoHTML = document.getElementById('catalogo-tienda');
    if(!catalogoHTML) return;
    
    catalogoHTML.innerHTML = "";
    
    CATALOGO_TIENDA.forEach(item => {
        const loTiene = miInventario.includes(item.id);
        const estaEquipado = (miEquipamiento.borde === item.id || miEquipamiento.colorChat === item.id || miEquipamiento.pin === item.id);
        
        let botonHTML = "";
        
        if (currentUserName === "Héroe Anónimo") {
            botonHTML = `<button class="btn-primary" style="width:100%; background:#444;">INICIA SESIÓN</button>`;
        } else if (estaEquipado) {
            botonHTML = `<button class="btn-primary" style="width:100%; background:var(--green); color:black;" disabled>EQUIPADO</button>`;
        } else if (loTiene) {
            botonHTML = `<button class="btn-primary" style="width:100%;" onclick="equiparObjeto('${item.id}', '${item.tipo}')">EQUIPAR</button>`;
        } else {
            botonHTML = `<button class="btn-primary" style="width:100%;" onclick="comprarObjeto('${item.id}', ${item.precio})">ADQUIRIR (${item.precio} D)</button>`;
        }

        let previewVisual = "";
        if (item.tipo === 'borde') {
            previewVisual = `<div style="width:40px; height:40px; border-radius:50%; ${item.estilo} margin:0 auto 10px auto; background:#222;"></div>`;
        } else if (item.tipo === 'colorChat') {
            previewVisual = `<div style="${item.estilo} font-weight:bold; margin-bottom:10px;">${currentUserName}</div>`;
        } else if (item.tipo === 'pin') {
            previewVisual = `<div style="font-size:1.5rem; margin-bottom:10px;">${item.icon}</div>`;
        }

        catalogoHTML.innerHTML += `
            <div class="container-glass" style="text-align:center; padding:15px; border: 1px solid #222; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    ${previewVisual}
                    <h4 style="color:white; margin-bottom:5px;">${item.nombre}</h4>
                    <p style="font-size:0.75rem; color:#888; margin-bottom:15px;">${item.desc}</p>
                </div>
                ${botonHTML}
            </div>
        `;
    });
}

window.comprarObjeto = function(itemId, precio) {
    if(currentUserName === "Héroe Anónimo") return;
    
    if (misRyos < precio) {
        alert("No tienes suficientes Diamantes para adquirir este objeto.");
        return;
    }

    if (confirm("¿Seguro que deseas gastar tus Diamantes en este artículo?")) {
        db.collection('ninjas').doc(currentUserId).update({
            ryos: misRyos - precio,
            inventario: firebase.firestore.FieldValue.arrayUnion(itemId)
        });
    }
};

window.equiparObjeto = function(itemId, tipo) {
    const nuevosEquipos = { ...miEquipamiento };
    nuevosEquipos[tipo] = itemId;
    
    db.collection('ninjas').doc(currentUserId).update({
        equipado: nuevosEquipos
    }).then(() => {
        alert("¡Objeto equipado exitosamente!");
    });
};

window.misionDiaria = function() {
    if (currentUserName === "Héroe Anónimo" || trabajando) return;
    
    db.collection('ninjas').doc(currentUserId).get().then(doc => {
        const data = doc.data();
        const hoy = new Date().toLocaleDateString('es-AR');
        
        let conteoDiario = data.trabajosHoy || 0;
        let fechaUltimo = data.fechaTrabajo || "";

        if (fechaUltimo === hoy) {
            if (conteoDiario >= 3) {
                alert("Has completado todas tus misiones por hoy. Vuelve mañana.");
                return;
            }
            conteoDiario++;
        } else {
            fechaUltimo = hoy;
            conteoDiario = 1;
        }

        trabajando = true;
        const btn = document.getElementById('btn-trabajar');
        btn.innerText = "Reclamando recompensa...";
        
        setTimeout(() => {
            db.collection('ninjas').doc(currentUserId).update({
                ryos: firebase.firestore.FieldValue.increment(10),
                trabajosHoy: conteoDiario,
                fechaTrabajo: fechaUltimo
            }).then(() => {
                trabajando = false;
                btn.innerHTML = "<i class='fas fa-gem'></i> Misión Diaria (+10 Diamantes)";
                alert(`¡Misión completada! Has ganado 10 Diamantes. (Misión ${conteoDiario}/3 de hoy)`);
            });
        }, 1500);
    });
};

// ==========================================
// TORNEOS Y LIGAS
// ==========================================
window.filtrarTorneos = function(filtro, evento) {
    currentFilter = filtro;
    const botones = document.querySelectorAll('#torneos .btn-filter');
    botones.forEach(b => b.classList.remove('active'));
    if (evento) evento.target.classList.add('active');
    cargarTorneosDesdeNube();
};

function cargarTorneosDesdeNube() {
    const listaTorneos = document.getElementById('lista-torneos');
    const listaLigas = document.getElementById('lista-ligas');
    
    if(!listaTorneos || !listaLigas) return;
    
    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        listaTorneos.innerHTML = '';
        listaLigas.innerHTML = '';
        
        snap.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            
            if (data.tipo === 'liga') {
                listaLigas.innerHTML += generarTarjetaEventoHTML(data, id, true);
            } else {
                if (currentFilter === 'todos' || data.formato === currentFilter) {
                    listaTorneos.innerHTML += generarTarjetaEventoHTML(data, id, false);
                }
            }
        });
    });
}

function generarTarjetaEventoHTML(data, id, esLiga) {
    const esIndividual = (data.formato === '1v1');
    const inscritos = esIndividual ? (data.lista_inscriptos ? data.lista_inscriptos.length : 0) : (data.lista_equipos ? data.lista_equipos.length : 0);
    const cuposTotales = data.cuposTotales || 0;
    
    let yaInscrito = false;
    
    if (esIndividual) {
        yaInscrito = data.lista_inscriptos && data.lista_inscriptos.includes(currentUserName);
    } else {
        if (data.lista_equipos) {
            data.lista_equipos.forEach(eq => {
                if(eq.miembros && eq.miembros.includes(currentUserName)) yaInscrito = true;
            });
        }
    }
    
    let btnTexto = esIndividual ? "UNIRSE AL COMBATE" : "VER ESCUADRAS";
    let statusClass = "status-open";
    let statusTexto = "ABIERTO";

    if (data.estado === 'iniciado') {
        btnTexto = "EVENTO EN CURSO";
        statusClass = "status-progress";
        statusTexto = "EN CURSO";
    } else if (data.estado === 'finalizado') {
        btnTexto = "EVENTO CERRADO";
        statusClass = "status-closed";
        statusTexto = "FINALIZADO";
    } else if (yaInscrito) {
        btnTexto = "YA ESTÁS INSCRIPTO";
    }

    const bordeColor = esLiga ? 'gold' : 'var(--blue)';

    return `
        <div class="card-t container-glass" style="${esLiga ? 'border-color: gold !important;' : ''} position:relative; overflow:hidden;">
            ${data.privado ? '<div style="position:absolute; top:10px; right:10px; color:var(--red); font-size:1.2rem;" title="Evento Privado"><i class="fas fa-lock"></i></div>' : ''}
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
                <span style="color:${bordeColor}; border: 1px solid ${bordeColor}; padding: 3px 8px; font-size: 0.75rem; border-radius: 4px; font-weight:bold; letter-spacing:1px;">
                    ${data.formato.toUpperCase()}
                </span>
                <span class="${statusClass}" style="font-size:0.75rem; font-weight:bold;">${statusTexto}</span>
            </div>
            
            <h3 style="margin-bottom: 15px; font-size:1.3rem; line-height:1.2;">${data.nombre}</h3>
            
            <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                <p style="font-size:0.85rem; color:#ccc; margin-bottom:5px;"><i class="fas fa-calendar-alt" style="color:var(--blue); width:20px;"></i> ${data.fecha || 'Por definir'}</p>
                <p style="font-size:0.85rem; color:#ccc; margin-bottom:5px;"><i class="fas fa-users" style="color:var(--blue); width:20px;"></i> Cupos: <strong>${inscritos}</strong> / ${cuposTotales}</p>
                <p style="font-size:0.85rem; color:#ccc; margin-bottom:0;"><i class="fas fa-trophy" style="color:gold; width:20px;"></i> Premio: <strong style="color:var(--green);">${data.premio || 'Gloria'}</strong></p>
            </div>
            
            <div style="display: flex; gap: 8px; margin-top: auto;">
                <button class="btn-primary" style="flex: 2; background: ${yaInscrito ? 'var(--green)' : 'var(--blue)'}; color: black; font-size:0.8rem; padding:10px 5px;" 
                        onclick="unirseTorneo('${id}', '${data.estado}')" 
                        ${data.estado !== 'abierto' || yaInscrito ? 'disabled' : ''}>
                    ${btnTexto}
                </button>
                <button class="btn-secondary" style="flex: 1; font-size:0.8rem; padding:10px 5px;" onclick="verLlaves('${id}', '${data.nombre}')">
                    CRUCES
                </button>
            </div>
        </div>
    `;
}

// ==========================================
// FUNCIONES DE INSCRIPCIÓN Y EQUIPOS
// ==========================================
window.unirseTorneo = function(torneoId, estado) {
    if (estado !== "abierto") return;
    if (currentUserName === "Héroe Anónimo") {
        window.location.hash = "#modal-login";
        return;
    }

    db.collection('torneos').doc(torneoId).get().then(doc => {
        const data = doc.data();
        
        if (data.formato === '1v1') {
            if ((data.lista_inscriptos?.length || 0) >= data.cuposTotales) {
                alert("El torneo ya está lleno.");
                return;
            }
            doc.ref.update({
                lista_inscriptos: firebase.firestore.FieldValue.arrayUnion(currentUserName)
            }).then(() => alert("¡Te has inscrito con éxito!"));
        } else {
            abrirModalEquipos(torneoId, data.formato);
        }
    });
};

window.abrirModalEquipos = function(torneoId, formato) {
    document.getElementById('eq-torneo-id').value = torneoId;
    document.getElementById('eq-formato').value = formato;
    document.getElementById('modal-equipos').style.display = 'flex';
    cargarListaEquiposTorneo(torneoId, formato);
};

function cargarListaEquiposTorneo(torneoId, formato) {
    const contenedor = document.getElementById('lista-equipos-torneo');
    const limitePorEquipo = parseInt(formato.charAt(0));

    db.collection('torneos').doc(torneoId).onSnapshot(doc => {
        if (!doc.exists) return;
        contenedor.innerHTML = "";
        const data = doc.data();
        const equipos = data.lista_equipos || [];

        let usuarioYaEnEquipo = false;
        equipos.forEach(eq => {
            if (eq.miembros && eq.miembros.includes(currentUserName)) {
                usuarioYaEnEquipo = true;
            }
        });

        equipos.forEach(eq => {
            const estaLleno = eq.miembros.length >= limitePorEquipo;
            let btnAction = "";

            if (usuarioYaEnEquipo) {
                btnAction = `<button class="btn-secondary" disabled style="padding: 5px 10px; font-size:0.8rem;">YA EN ESCUADRA</button>`;
            } else if (estaLleno) {
                btnAction = `<button class="btn-secondary" disabled style="padding: 5px 10px; font-size:0.8rem;">LLENO</button>`;
            } else if (eq.pass && eq.pass !== "") {
                btnAction = `<button class="btn-primary" style="padding: 5px 10px; font-size:0.8rem;" onclick="abrirModalPassEquipo('${torneoId}', '${eq.nombre}')"><i class="fas fa-lock"></i> CLAVE</button>`;
            } else {
                btnAction = `<button class="btn-primary" style="background:var(--green); color:black; padding: 5px 10px; font-size:0.8rem;" onclick="unirseEquipoTorneo('${torneoId}', '${eq.nombre}')">UNIRSE</button>`;
            }

            contenedor.innerHTML += `
                <div style="background:#111; padding:12px; margin-bottom:8px; border-radius:5px; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:var(--blue); font-size:1.1rem;">${eq.nombre}</strong>
                        <br>
                        <span style="font-size:0.8rem; color:#aaa;">Miembros: <span style="color:white;">${eq.miembros.join(', ')}</span> (${eq.miembros.length}/${limitePorEquipo})</span>
                    </div>
                    <div>${btnAction}</div>
                </div>
            `;
        });
    });
}

window.crearEquipoTorneo = function() {
    const torneoId = document.getElementById('eq-torneo-id').value;
    const nombreEquipo = document.getElementById('eq-nombre').value.trim();
    const passEquipo = document.getElementById('eq-pass').value.trim();

    if (!nombreEquipo) return alert("Debes ingresar un nombre para tu escuadra.");

    db.collection('torneos').doc(torneoId).get().then(doc => {
        const data = doc.data();
        let equipos = data.lista_equipos || [];
        
        let usuarioYaEnEquipo = false;
        equipos.forEach(eq => {
            if (eq.miembros && eq.miembros.includes(currentUserName)) usuarioYaEnEquipo = true;
        });

        if (usuarioYaEnEquipo) return alert("Ya perteneces a una escuadra en este torneo.");
        if (equipos.length >= data.cuposTotales) return alert("Ya no hay cupos para nuevas escuadras.");

        equipos.push({
            nombre: nombreEquipo,
            pass: passEquipo,
            miembros: [currentUserName]
        });

        doc.ref.update({ lista_equipos: equipos }).then(() => {
            document.getElementById('eq-nombre').value = "";
            document.getElementById('eq-pass').value = "";
            alert("¡Escuadra fundada! Espera a tus compañeros.");
        });
    });
};

window.abrirModalPassEquipo = function(torneoId, nombreEq) {
    document.getElementById('join-eq-torneo-id').value = torneoId;
    document.getElementById('join-eq-nombre').value = nombreEq;
    document.getElementById('join-eq-pass-input').value = "";
    document.getElementById('modal-pass-equipo').style.display = 'flex';
};

window.confirmarUnionEquipoPrivado = function() {
    const torneoId = document.getElementById('join-eq-torneo-id').value;
    const nombreEq = document.getElementById('join-eq-nombre').value;
    const claveIngresada = document.getElementById('join-eq-pass-input').value.trim();

    db.collection('torneos').doc(torneoId).get().then(doc => {
        const equipos = doc.data().lista_equipos || [];
        const equipoDestino = equipos.find(e => e.nombre === nombreEq);

        if (equipoDestino && equipoDestino.pass === claveIngresada) {
            unirseEquipoTorneo(torneoId, nombreEq, equipos);
            document.getElementById('modal-pass-equipo').style.display = 'none';
        } else {
            alert("Contraseña incorrecta. Pídele la clave correcta al capitán.");
        }
    });
};

window.unirseEquipoTorneo = function(torneoId, nombreEq, equiposYaCargados = null) {
    const procesarUnion = (equipos) => {
        const limitePorEquipo = parseInt(document.getElementById('eq-formato').value.charAt(0));
        let actualizado = false;

        for (let i = 0; i < equipos.length; i++) {
            if (equipos[i].nombre === nombreEq && equipos[i].miembros.length < limitePorEquipo) {
                equipos[i].miembros.push(currentUserName);
                actualizado = true;
                break;
            }
        }

        if (actualizado) {
            db.collection('torneos').doc(torneoId).update({ lista_equipos: equipos }).then(() => {
                alert(`¡Te has unido exitosamente a la escuadra ${nombreEq}!`);
            });
        } else {
            alert("No se pudo unir. Puede que la escuadra ya esté llena.");
        }
    };

    if (equiposYaCargados) {
        procesarUnion(equiposYaCargados);
    } else {
        db.collection('torneos').doc(torneoId).get().then(doc => {
            procesarUnion(doc.data().lista_equipos || []);
        });
    }
};

// ==========================================
// VISUALIZADOR DE LLAVES Y SALAS (RESTAURADO)
// ==========================================
window.verLlaves = function(torneoId, torneoNombre) {
    document.getElementById('llaves-titulo').innerText = `Pergamino de Cruces: ${torneoNombre}`;
    const contenedorText = document.getElementById('contenedor-llaves-texto');
    const contenedorCampeon = document.getElementById('contenedor-campeon');
    
    contenedorText.innerHTML = "<p style='text-align:center; color:white;'>Desenrollando pergaminos...</p>";
    contenedorCampeon.innerHTML = "";
    window.location.hash = "#modal-llaves";

    // Necesitamos traer el torneo para ver los equipos (si aplica) y poder mostrar la sala
    db.collection('torneos').doc(torneoId).get().then(docTorneo => {
        if (!docTorneo.exists) return;
        const torneoData = docTorneo.data();

        if (torneoData.campeon) {
            contenedorCampeon.innerHTML = `
                <div style="background: rgba(255,215,0,0.1); border: 2px solid gold; padding: 20px; text-align: center; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 0 15px rgba(255,215,0,0.3);">
                    <i class="fas fa-trophy" style="font-size: 3rem; color: gold; margin-bottom: 10px;"></i>
                    <h2 style="color: gold; margin: 0;">CAMPEÓN DEFINITIVO</h2>
                    <h1 style="color: white; margin: 10px 0; font-size: 2.5rem; text-transform: uppercase; letter-spacing: 2px;">${torneoData.campeon}</h1>
                </div>
            `;
        }

        db.collection('torneos').doc(torneoId).collection('llaves').orderBy('ronda', 'asc').onSnapshot(snap => {
            contenedorText.innerHTML = "";
            
            if (snap.empty) {
                contenedorText.innerHTML = "<p style='text-align:center; color: var(--red); font-weight:bold;'>Los cruces aún no han sido generados por el Kage.</p>";
                return;
            }

            let currentRonda = 0;
            let htmlBuffer = "";

            snap.forEach(doc => {
                const partido = doc.data();
                const partidoId = doc.id;
                
                if (partido.ronda !== currentRonda) {
                    if (currentRonda !== 0) htmlBuffer += "</div>"; 
                    currentRonda = partido.ronda;
                    htmlBuffer += `
                        <h4 style="color: var(--blue); margin: 20px 0 10px 0; border-bottom: 1px solid #333; padding-bottom: 5px;">Ronda ${currentRonda}</h4>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                    `;
                }

                let p1Style = partido.ganador === partido.p1 ? "color: var(--green); font-weight:bold;" : "color: white;";
                let p2Style = partido.ganador === partido.p2 ? "color: var(--green); font-weight:bold;" : "color: white;";
                
                if(partido.ganador && partido.ganador !== partido.p1) p1Style = "color: #555; text-decoration: line-through;";
                if(partido.ganador && partido.ganador !== partido.p2) p2Style = "color: #555; text-decoration: line-through;";

                let estadoTexto = partido.ganador ? `<span style="color:var(--green); font-size:0.8rem;"><i class="fas fa-check-circle"></i> Victoria: ${partido.ganador}</span>` : `<span style="color:var(--red); font-size:0.8rem;"><i class="fas fa-clock"></i> Combate Pendiente</span>`;

                // VERIFICAR SI SOY PARTICIPANTE PARA MOSTRAR LA SALA Y REPORTE
                let soyParticipante = false;
                if (torneoData.formato === '1v1') {
                    if (currentUserName === partido.p1 || currentUserName === partido.p2) soyParticipante = true;
                } else {
                    const eq1 = (torneoData.lista_equipos || []).find(e => e.nombre === partido.p1);
                    const eq2 = (torneoData.lista_equipos || []).find(e => e.nombre === partido.p2);
                    if (eq1 && eq1.miembros && eq1.miembros.includes(currentUserName)) soyParticipante = true;
                    if (eq2 && eq2.miembros && eq2.miembros.includes(currentUserName)) soyParticipante = true;
                }

                let salaHtml = "";
                let reportarHtml = "";

                if (soyParticipante && partido.p2 !== "BYE") {
                    if (partido.salaId) {
                        salaHtml = `
                            <div style="background: rgba(0,210,255,0.1); padding: 8px; margin-top: 10px; border-radius: 4px; border: 1px dashed var(--blue); display: flex; justify-content: space-around; font-size: 0.85rem;">
                                <span style="color: white;">ID Sala: <strong style="color: var(--blue); user-select: all;">${partido.salaId}</strong></span>
                                <span style="color: white;">Pass: <strong style="color: var(--blue); user-select: all;">${partido.salaPass || 'Sin Pass'}</strong></span>
                            </div>
                        `;
                    }
                    if (!partido.ganador) {
                        reportarHtml = `
                            <button class="btn-secondary" style="width: 100%; margin-top: 10px; font-size: 0.8rem; border-color: #ff00ff; color: #ff00ff;" onclick="abrirModalReporte('${torneoId}', '${partidoId}', '${partido.p1}', '${partido.p2}')"><i class="fas fa-camera"></i> REPORTAR RESULTADO</button>
                        `;
                    }
                }

                htmlBuffer += `
                    <div style="background: #111; border: 1px solid #333; padding: 15px; border-radius: 8px; display: flex; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1; text-align: right; ${p1Style} font-size: 1.1rem;">${partido.p1}</div>
                            <div style="padding: 0 15px; color: #666; font-size: 0.8rem; font-weight: bold;">VS</div>
                            <div style="flex: 1; text-align: left; ${p2Style} font-size: 1.1rem;">${partido.p2}</div>
                            <div style="flex: 1; text-align: right;">${estadoTexto}</div>
                        </div>
                        ${salaHtml}
                        ${reportarHtml}
                    </div>
                `;
            });
            
            if (currentRonda !== 0) htmlBuffer += "</div>";
            contenedorText.innerHTML = htmlBuffer;
        });
    });
};

// ==========================================
// ABISMO (VIDEOS Y LIKES)
// ==========================================
function cargarVideosAbismo() {
    const listaAbismo = document.getElementById('lista-abismo');
    if(!listaAbismo) return;

    db.collection('abismo_videos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        listaAbismo.innerHTML = '';
        snap.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            const esMio = (data.usuario === currentUserName);
            const esAdmin = (auth.currentUser?.email === ADMIN_EMAIL);
            
            let urlThumbnail = "https://via.placeholder.com/480x270/111111/00d2ff?text=Clip+Ninja";
            
            if (data.plataforma === 'youtube') {
                const videoId = data.url.split('embed/')[1];
                urlThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }

            let btnBorrar = (esMio || esAdmin) ? `<button class="btn-delete-abismo" onclick="borrarVideoAbismo('${id}', event)">PURGAR</button>` : '';

            let comentariosHTML = "";
            if (data.comentarios && data.comentarios.length > 0) {
                const ultimos = data.comentarios.slice(-3);
                comentariosHTML = ultimos.map(c => `<div class="comentario-box"><strong>${c.usuario}:</strong> ${c.texto}</div>`).join('');
            }

            listaAbismo.innerHTML += `
                <div class="container-glass" style="padding: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <strong style="color: white; cursor: pointer;" onclick="abrirPerfil('${data.usuario}')"><i class="fas fa-user-ninja" style="color:var(--blue);"></i> ${data.usuario}</strong>
                    </div>
                    
                    <div class="video-preview-card" id="cont-${id}" onclick="activarVideo('${id}', '${data.url}')">
                        ${btnBorrar}
                        <img src="${urlThumbnail}" class="thumbnail-img">
                        <div class="play-overlay"><i class="fas fa-play-circle"></i></div>
                    </div>

                    <div style="margin-top: 10px; display: flex; align-items: center; gap: 15px;">
                        <button style="background: none; border: none; color: var(--red); font-size: 1.2rem; cursor: pointer;" onclick="darLikeVideo('${id}', '${data.usuario}')">
                            <i class="fas fa-heart"></i> <span style="font-size: 1rem; color: white;">${data.likes || 0}</span>
                        </button>
                    </div>

                    <div style="margin-top: 10px;">
                        ${comentariosHTML}
                        <form onsubmit="comentarVideo(event, '${id}', '${data.usuario}')" class="comentario-input-group">
                            <input type="text" id="coment-${id}" class="comentario-input" placeholder="Comentar técnica...">
                            <button type="submit" class="comentario-btn"><i class="fas fa-paper-plane"></i></button>
                        </form>
                    </div>
                </div>
            `;
        });
    });
}

window.activarVideo = function(id, url) {
    const contenedor = document.getElementById(`cont-${id}`);
    contenedor.innerHTML = `<iframe src="${url}?autoplay=1" style="width: 100%; aspect-ratio: 16/9; border: none;" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
};

window.borrarVideoAbismo = function(id, event) {
    event.stopPropagation();
    if(confirm("¿Estás seguro de que quieres borrar este clip del Abismo?")) {
        db.collection('abismo_videos').doc(id).delete();
    }
};

window.darLikeVideo = function(id, autor) {
    if(currentUserName === "Héroe Anónimo") return;
    db.collection('abismo_videos').doc(id).update({
        likes: firebase.firestore.FieldValue.increment(1)
    });
    if (autor !== currentUserName) {
        enviarNotificacion(autor, `${currentUserName} reconoció tu habilidad en el Abismo (Like).`);
    }
};

window.comentarVideo = function(event, id, autor) {
    event.preventDefault();
    if(currentUserName === "Héroe Anónimo") return;
    const input = document.getElementById(`coment-${id}`);
    const texto = input.value.trim();
    
    if (texto) {
        db.collection('abismo_videos').doc(id).update({
            comentarios: firebase.firestore.FieldValue.arrayUnion({
                usuario: currentUserName,
                texto: texto,
                timestamp: new Date().getTime()
            })
        }).then(() => {
            input.value = "";
            if (autor !== currentUserName) {
                enviarNotificacion(autor, `${currentUserName} comentó tu técnica en el Abismo.`);
            }
        });
    }
};

const formAbismo = document.getElementById('form-abismo');
if (formAbismo) {
    formAbismo.addEventListener('submit', (e) => {
        e.preventDefault();
        if (currentUserName === "Héroe Anónimo") { alert("Inicia sesión para subir al Abismo."); return; }
        
        let url = document.getElementById('video-url').value;
        let embedUrl = "";
        let plataforma = "";

        if (url.includes("youtube.com/shorts/")) {
            const id = url.split("shorts/")[1].split("?")[0];
            embedUrl = `https://www.youtube.com/embed/${id}`;
            plataforma = "youtube";
        } else if (url.includes("tiktok.com/")) {
            let id = "";
            if (url.includes("/video/")) id = url.split("/video/")[1].split("?")[0];
            else id = url; 
            embedUrl = `https://www.tiktok.com/embed/v2/${id}`;
            plataforma = "tiktok";
        } else {
            alert("Por favor, usa un enlace válido de YouTube Shorts o TikTok.");
            return;
        }

        db.collection('abismo_videos').add({
            usuario: currentUserName,
            url: embedUrl,
            plataforma: plataforma,
            likes: 0,
            comentarios: [],
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            document.getElementById('form-abismo').reset();
            alert("¡Tu técnica ha sido compartida en el Abismo!");
        });
    });
}

// ==========================================
// SALÓN DE LA FAMA
// ==========================================
function cargarHallOfFame() {
    const podio = document.getElementById('podio-leyendas');
    if(!podio) return;

    db.collection('ninjas').where('torneosGanados', '>', 0).orderBy('torneosGanados', 'desc').limit(3).onSnapshot(snap => {
        if(snap.empty) {
            podio.innerHTML = "<p style='color:#666; width: 100%; text-align: center;'>El salón aguarda a las primeras leyendas...</p>";
            return;
        }

        let leyendas = [];
        snap.forEach(doc => leyendas.push(doc.data()));

        podio.innerHTML = "";
        if (leyendas[1]) podio.innerHTML += crearCartaPodio(leyendas[1], 2);
        if (leyendas[0]) podio.innerHTML += crearCartaPodio(leyendas[0], 1);
        if (leyendas[2]) podio.innerHTML += crearCartaPodio(leyendas[2], 3);
    });
}

function crearCartaPodio(ninja, rank) {
    let imgSrc = ninja.fotoPerfil && ninja.fotoPerfil !== "" ? ninja.fotoPerfil : `https://ui-avatars.com/api/?name=${ninja.nick}&background=random`;
    let bordeEstilo = "";
    
    if(ninja.equipado && ninja.equipado.borde) {
        const itemBorde = CATALOGO_TIENDA.find(i => i.id === ninja.equipado.borde);
        if(itemBorde) bordeEstilo = itemBorde.estilo;
    }

    return `
        <div class="podium-spot rank-${rank}" style="position: relative; cursor:pointer;" onclick="abrirPerfil('${ninja.nick}')">
            <div class="crown" style="display: ${rank === 1 ? 'block' : 'none'}; position: absolute; top: -30px; left: 50%; transform: translateX(-50%); font-size: 2rem; color: gold; filter: drop-shadow(0 0 10px gold); z-index: 10;"><i class="fas fa-crown"></i></div>
            <img src="${imgSrc}" style="${bordeEstilo}">
            <h4>${rank}° Lugar</h4>
            <h5>${ninja.nick}</h5>
            <p><i class="fas fa-trophy"></i> ${ninja.torneosGanados} Copas</p>
        </div>
    `;
}

// ==========================================
// GREMIO (CLANES Y ANUNCIOS)
// ==========================================
window.abrirModalClan = function() {
    if (currentUserName === "Héroe Anónimo") return window.location.hash = "#modal-login";
    document.getElementById('modal-clan').style.display = 'flex';
    if (miClan !== "") {
        document.getElementById('vista-sin-clan').style.display = 'none';
        document.getElementById('vista-con-clan').style.display = 'block';
        document.getElementById('clan-nombre-display').innerText = miClan;
        
        db.collection('clanes').doc(miClan).onSnapshot(doc => {
            if(doc.exists) {
                const data = doc.data();
                document.getElementById('clan-xp-display').innerText = data.xp || 0;
                const lista = document.getElementById('lista-miembros-clan');
                lista.innerHTML = "";
                data.miembros.forEach(m => {
                    lista.innerHTML += `<li style="padding: 5px; border-bottom: 1px solid #333; color: white;"><i class="fas fa-user-ninja" style="color:var(--blue);"></i> ${m}</li>`;
                });
            }
        });
    } else {
        document.getElementById('vista-sin-clan').style.display = 'block';
        document.getElementById('vista-con-clan').style.display = 'none';
    }
};

window.crearClan = function() {
    const nombreClan = document.getElementById('input-crear-clan').value.trim();
    if (!nombreClan) return;
    
    db.collection('clanes').doc(nombreClan).get().then(doc => {
        if (doc.exists) {
            alert("El nombre de escuadrón ya está registrado en la aldea.");
        } else {
            db.collection('clanes').doc(nombreClan).set({
                nombre: nombreClan,
                miembros: [currentUserName],
                xp: 0,
                lider: currentUserName
            }).then(() => {
                db.collection('ninjas').doc(currentUserId).update({ clan: nombreClan });
                alert("¡Escuadrón fundado con honor!");
            });
        }
    });
};

window.unirseClan = function() {
    const nombreClan = document.getElementById('input-unirse-clan').value.trim();
    if (!nombreClan) return;

    db.collection('clanes').doc(nombreClan).get().then(doc => {
        if (!doc.exists) {
            alert("Este escuadrón no existe en los registros.");
        } else {
            doc.ref.update({
                miembros: firebase.firestore.FieldValue.arrayUnion(currentUserName)
            }).then(() => {
                db.collection('ninjas').doc(currentUserId).update({ clan: nombreClan });
                alert("Te has unido al escuadrón.");
            });
        }
    });
};

window.abandonarClan = function() {
    if (confirm("¿Estás seguro de abandonar a tus camaradas?")) {
        db.collection('clanes').doc(miClan).update({
            miembros: firebase.firestore.FieldValue.arrayRemove(currentUserName)
        }).then(() => {
            db.collection('ninjas').doc(currentUserId).update({ clan: "" });
            document.getElementById('modal-clan').style.display = 'none';
            alert("Has abandonado el escuadrón.");
        });
    }
};

function cargarTopClanes() {
    const listaClanes = document.getElementById('lista-top-clanes');
    if(!listaClanes) return;
    db.collection('clanes').orderBy('xp', 'desc').limit(5).onSnapshot(snap => {
        listaClanes.innerHTML = "";
        snap.forEach((doc, index) => {
            const data = doc.data();
            let colorRank = "white";
            if(index === 0) colorRank = "gold";
            if(index === 1) colorRank = "silver";
            if(index === 2) colorRank = "#cd7f32";

            listaClanes.innerHTML += `
                <div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(0,0,0,0.5); margin-bottom: 5px; border-radius: 5px; border-left: 3px solid ${colorRank};">
                    <span style="font-weight: bold; color: ${colorRank};">${index + 1}. ${data.nombre}</span>
                    <span style="color: gold; font-weight: bold;">${data.xp} XP</span>
                </div>
            `;
        });
    });
}

const formAnuncio = document.getElementById('form-anuncio');
if(formAnuncio) {
    formAnuncio.addEventListener('submit', (e) => {
        e.preventDefault();
        if (currentUserName === "Héroe Anónimo") return;
        
        db.collection('anuncios_gremio').add({
            usuario: currentUserName,
            busco: document.getElementById('a-busco').value,
            soy: document.getElementById('a-soy').value,
            mensaje: document.getElementById('a-mensaje').value,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            document.getElementById('form-anuncio').reset();
            document.getElementById('modal-anuncio').style.display = 'none';
            alert("Anuncio clavado en el tablón.");
        });
    });
}

function cargarAnunciosGremio() {
    const listaAnuncios = document.getElementById('lista-anuncios');
    if(!listaAnuncios) return;
    db.collection('anuncios_gremio').orderBy('timestamp', 'desc').limit(10).onSnapshot(snap => {
        listaAnuncios.innerHTML = "";
        snap.forEach(doc => {
            const data = doc.data();
            listaAnuncios.innerHTML += `
                <div style="background: rgba(0,0,0,0.4); padding: 12px; border-radius: 5px; border: 1px solid #333; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <strong style="color: var(--blue); cursor:pointer;" onclick="abrirPerfil('${data.usuario}')"><i class="fas fa-user-ninja"></i> ${data.usuario}</strong>
                    </div>
                    <div style="font-size: 0.85rem; color: #ccc; margin-bottom: 5px;">
                        <span style="color: var(--green);">[Busca]:</span> ${data.busco} <br>
                        <span style="color: gold;">[Es]:</span> ${data.soy}
                    </div>
                    <p style="font-size: 0.9rem; color: white; font-style: italic;">"${data.mensaje}"</p>
                </div>
            `;
        });
    });
}

window.abrirModalAnuncio = function() {
    if (currentUserName === "Héroe Anónimo") { window.location.hash = "#modal-login"; return; }
    document.getElementById('modal-anuncio').style.display = 'flex';
};

// ==========================================
// TABERNA GLOBAL (CHAT)
// ==========================================
function escucharTabernaGlobal() {
    const contenedor = document.getElementById('chat-messages-container');
    if(!contenedor) return;

    db.collection('taberna').orderBy('timestamp').limit(50).onSnapshot(snap => {
        contenedor.innerHTML = '';
        snap.forEach(doc => {
            const data = doc.data();
            
            let estiloColor = "color: var(--blue);";
            if (data.colorEstilo) {
                const itemTienda = CATALOGO_TIENDA.find(i => i.id === data.colorEstilo);
                if (itemTienda) estiloColor = itemTienda.estilo;
            }

            if (data.usuario === 'Matías' || data.usuario === 'Admin' || data.usuario === 'Kage') {
                estiloColor = "color: var(--red); text-shadow: 0 0 5px red;";
            }

            contenedor.innerHTML += `
                <div style="margin-bottom: 8px; font-size: 0.9rem; word-wrap: break-word;">
                    <strong style="${estiloColor} cursor:pointer;" onclick="abrirPerfil('${data.usuario}')">${data.usuario}:</strong> 
                    <span style="color: #eee;">${data.texto}</span>
                </div>
            `;
        });
        contenedor.scrollTop = contenedor.scrollHeight;
    });

    const btnSend = document.getElementById('btn-send-chat');
    if(btnSend) {
        btnSend.onclick = () => {
            const input = document.getElementById('chat-input-text');
            if(input.value.trim() && currentUserName !== "Héroe Anónimo") {
                db.collection('taberna').add({
                    usuario: currentUserName,
                    texto: input.value.trim(),
                    colorEstilo: miEquipamiento.colorChat || '',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                input.value = '';
            }
        };
    }
}

window.limpiarTaberna = async function() {
    if(confirm("¿Estás seguro de quemar todos los pergaminos de la taberna global?")) {
        const snap = await db.collection('taberna').get();
        const batch = db.batch();
        snap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        alert("La taberna ha sido vaciada.");
    }
};

// ==========================================
// PERFILES Y LIBRO BINGO
// ==========================================
function cargarTopIndividualBingo() {
    const lista = document.getElementById('ranking-dinamico');
    if(!lista) return;

    db.collection('ninjas').orderBy('xp', 'desc').limit(10).onSnapshot(snap => {
        lista.innerHTML = "";
        let posicion = 1;
        snap.forEach(doc => {
            const data = doc.data();
            let colorPos = posicion === 1 ? 'gold' : (posicion === 2 ? 'silver' : (posicion === 3 ? '#cd7f32' : 'white'));
            
            lista.innerHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 5px; margin-bottom: 5px; cursor: pointer; border-left: 3px solid ${colorPos}; transition: background 0.3s;" onclick="abrirPerfil('${data.nick}')">
                    <span style="font-weight: bold; color: ${colorPos};">${posicion}. ${data.nick}</span>
                    <span style="color: gold; font-weight: bold;">${data.xp || 0} XP</span>
                </div>
            `;
            posicion++;
        });
    });
}

window.abrirPerfil = async function(nickBuscado) {
    if(!nickBuscado) return;
    window.location.hash = '#modal-perfil';
    
    document.getElementById('perfil-nick').innerText = "Buscando chakra...";
    document.getElementById('perfil-bio').innerText = "";
    document.getElementById('perfil-clan').innerText = "";
    document.getElementById('perfil-comunidad').innerText = "";
    document.getElementById('btn-editar-perfil-container').style.display = 'none';

    try {
        const snapshot = await db.collection('ninjas').where('nick', '==', nickBuscado).get();
        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            
            let rangoTexto = "GUERRERO";
            if(data.plan === 'jonin') rangoTexto = "ÉPICO";
            if(data.plan === 'kasekage') rangoTexto = "MÍTICO";
            if(data.nick === 'Matías' || data.email_oculto === ADMIN_EMAIL) rangoTexto = "KAGE SUPREMO";

            document.getElementById('perfil-nick').innerText = data.nick;
            document.getElementById('perfil-rango').innerText = rangoTexto;
            document.getElementById('perfil-xp').innerText = `${data.xp || 0} XP`;
            document.getElementById('perfil-campeonatos').innerText = data.torneosGanados || 0;
            
            document.getElementById('perfil-bio').innerText = data.bio && data.bio.trim() !== "" ? `"${data.bio}"` : '"Un guerrero rodeado de misterio..."';
            
            document.getElementById('perfil-clan').innerHTML = data.clan ? `<i class="fas fa-shield-alt"></i> Escuadrón: ${data.clan}` : '';
            document.getElementById('perfil-comunidad').innerHTML = data.comunidad ? `<i class="fas fa-users"></i> Alianza: ${data.comunidad}` : '';
            
            const redesCont = document.getElementById('perfil-redes-container');
            if (data.redSocial && data.redSocial.trim() !== "") {
                redesCont.innerHTML = `<a href="${data.redSocial}" target="_blank" class="btn-secondary" style="font-size:0.8rem; border-color:#E1306C; color:#E1306C;"><i class="fab fa-instagram"></i> Red Social</a>`;
            } else {
                redesCont.innerHTML = "";
            }

            let imgSrc = data.fotoPerfil && data.fotoPerfil !== "" ? data.fotoPerfil : `https://ui-avatars.com/api/?name=${data.nick}&background=random`;
            const avatarEl = document.getElementById('perfil-avatar');
            avatarEl.src = imgSrc;
            avatarEl.style = "width:100px; height:100px; border-radius:50%; object-fit:cover; margin-bottom:10px;"; 
            
            document.getElementById('perfil-pin-container').innerHTML = "";

            if (data.equipado) {
                if (data.equipado.borde) {
                    const itemBorde = CATALOGO_TIENDA.find(i => i.id === data.equipado.borde);
                    if(itemBorde) avatarEl.style = `width:100px; height:100px; border-radius:50%; object-fit:cover; margin-bottom:10px; ${itemBorde.estilo}`;
                }
                if (data.equipado.pin) {
                    const itemPin = CATALOGO_TIENDA.find(i => i.id === data.equipado.pin);
                    if(itemPin) document.getElementById('perfil-pin-container').innerHTML = itemPin.icon;
                }
            }

            if (data.nick === currentUserName) {
                document.getElementById('btn-editar-perfil-container').style.display = 'block';
            }

        } else {
            document.getElementById('perfil-nick').innerText = "Ninja no encontrado";
        }
    } catch (e) {
        console.error("Error al buscar perfil:", e);
    }
};

window.abrirModalEditarPerfil = function() {
    document.getElementById('modal-editar-perfil').style.display = 'flex';
    document.getElementById('edit-bio').value = miPerfilActual.bio || "";
    document.getElementById('edit-redes').value = miPerfilActual.redSocial || "";
};

const formEditarPerfil = document.getElementById('form-editar-perfil');
if(formEditarPerfil) {
    formEditarPerfil.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = document.getElementById('edit-foto-file').files[0];
        const bio = document.getElementById('edit-bio').value.trim();
        const red = document.getElementById('edit-redes').value.trim();
        const btn = document.getElementById('btn-guardar-perfil');
        
        btn.innerText = "Sincronizando Chakra...";
        btn.disabled = true;

        try {
            let updateData = { bio: bio, redSocial: red };

            if (file) {
                const storageRef = storage.ref(`avatars/${currentUserId}_${Date.now()}`);
                await storageRef.put(file);
                const url = await storageRef.getDownloadURL();
                updateData.fotoPerfil = url;
            }

            await db.collection('ninjas').doc(currentUserId).update(updateData);
            alert("¡Perfil actualizado correctamente!");
            document.getElementById('modal-editar-perfil').style.display = 'none';
            abrirPerfil(currentUserName);
        } catch (error) {
            alert("Error al actualizar el perfil.");
            console.error(error);
        } finally {
            btn.innerText = "GUARDAR CAMBIOS";
            btn.disabled = false;
        }
    });
}

// ==========================================
// ADMINISTRACIÓN: GESTIÓN DE TORNEOS (KAGE)
// ==========================================
window.mostrarTabAdmin = function(tabId) {
    const tabs = ['tab-torneos', 'tab-llaves-admin', 'tab-moderacion', 'tab-banco', 'tab-gestion', 'tab-personalizacion'];
    tabs.forEach(t => {
        document.getElementById(t).style.display = 'none';
    });
    document.getElementById(tabId).style.display = 'block';
};

window.inscribirJugadorManual = function() {
    const nick = document.getElementById('input-inscribir-manual').value.trim();
    const torneoId = document.getElementById('input-torneo-manual-id').value;
    const formato = document.getElementById('input-torneo-manual-formato').value;
    const equipo = document.getElementById('input-equipo-manual').value.trim();

    if(!nick || !torneoId) return;

    db.collection('torneos').doc(torneoId).get().then(doc => {
        const data = doc.data();
        
        if (formato === '1v1') {
            doc.ref.update({
                lista_inscriptos: firebase.firestore.FieldValue.arrayUnion(nick)
            });
        } else {
            if(!equipo) return alert("Debe especificar el nombre del equipo.");
            let equipos = data.lista_equipos || [];
            let equipoEncontrado = false;
            
            for(let i=0; i<equipos.length; i++) {
                if (equipos[i].nombre.toLowerCase() === equipo.toLowerCase()) {
                    equipos[i].miembros.push(nick);
                    equipoEncontrado = true;
                    break;
                }
            }
            if(!equipoEncontrado) {
                equipos.push({ nombre: equipo, pass: "", miembros: [nick] });
            }
            doc.ref.update({ lista_equipos: equipos });
        }
        alert("El jugador ha sido inscrito manualmente.");
        document.getElementById('input-inscribir-manual').value = "";
        if(document.getElementById('input-equipo-manual')) {
            document.getElementById('input-equipo-manual').value = "";
        }
    });
};

function configurarAdminForms() {
    
    const formTorneo = document.getElementById('form-torneo');
    if(formTorneo) {
        formTorneo.addEventListener('submit', (e) => {
            e.preventDefault();
            db.collection('torneos').add({
                nombre: document.getElementById('t-nombre').value,
                fecha: document.getElementById('t-fecha').value,
                cuposTotales: parseInt(document.getElementById('t-cupos').value),
                premio: document.getElementById('t-premio').value,
                formato: document.getElementById('t-formato').value,
                tipo: document.getElementById('t-tipo').value,
                privado: document.getElementById('t-privado').checked,
                creador: currentUserName,
                lista_inscriptos: [],
                lista_equipos: [],
                estado: "abierto",
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                document.getElementById('form-torneo').reset();
                alert("¡Evento publicado en el tablón!");
            });
        });
    }

    const formConfig = document.getElementById('form-config-personalizacion');
    if(formConfig) {
        formConfig.addEventListener('submit', (e) => {
            e.preventDefault();
            const bgTipo = document.getElementById('cfg-bg-tipo').value;
            const bgUrl = document.getElementById('cfg-bg-url').value;
            const colorAcento = document.getElementById('cfg-color-acento').value;
            
            const linksSociales = {
                wa: document.getElementById('cfg-link-wa').value,
                ds: document.getElementById('cfg-link-ds').value,
                fb: document.getElementById('cfg-link-fb').value,
                tt: document.getElementById('cfg-link-tt').value,
                ig: document.getElementById('cfg-link-ig').value,
                yt: document.getElementById('cfg-link-yt').value
            };

            const visibilidad = {
                stream: document.getElementById('vis-cfg-stream').checked,
                fama: document.getElementById('vis-cfg-fama').checked,
                ligas: document.getElementById('vis-cfg-ligas').checked,
                planes: document.getElementById('vis-cfg-planes').checked,
                torneos: document.getElementById('vis-cfg-torneos').checked,
                bingo: document.getElementById('vis-cfg-bingo').checked,
                comunidades: document.getElementById('vis-cfg-comunidades').checked,
                sorteos: document.getElementById('vis-cfg-sorteos').checked,
                abismo: document.getElementById('vis-cfg-abismo').checked,
                gremio: document.getElementById('vis-cfg-gremio').checked,
                tienda: document.getElementById('vis-cfg-tienda').checked
            };

            const titulos = {
                stream: document.getElementById('title-cfg-stream').value || "Visión del Byakugan",
                fama: document.getElementById('title-cfg-fama').value || "Salón de la Fama",
                ligas: document.getElementById('title-cfg-ligas').value || "Ligas Mensuales",
                planes: document.getElementById('title-cfg-planes').value || "Pases de Batalla",
                torneos: document.getElementById('title-cfg-torneos').value || "Torneos Relámpago",
                bingo: document.getElementById('title-cfg-bingo').value || "Libro Bingo",
                comunidades: document.getElementById('title-cfg-comunidades').value || "Comunidades Aliadas",
                sorteos: document.getElementById('title-cfg-sorteos').value || "Sorteos de la Aldea",
                abismo: document.getElementById('title-cfg-abismo').value || "Archivos del Abismo",
                gremio: document.getElementById('title-cfg-gremio').value || "Gremio y Escuadrones",
                tienda: document.getElementById('title-cfg-tienda').value || "Mercado de la Aldea"
            };

            db.collection('configuracion').doc('personalizacion').update({
                bgTipo, bgUrl, colorAcento, linksSociales, visibilidad, titulos
            }).then(() => alert("¡Configuración global y redes sociales actualizadas!"));
        });
    }
}

function cargarTorneosParaAdminLlaves() {
    const listaModAdmin = document.getElementById('admin-lista-torneos-llaves');
    if(!listaModAdmin) return;

    const esAdminSupremo = (auth.currentUser?.email === ADMIN_EMAIL);

    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        listaModAdmin.innerHTML = '';
        snap.forEach(doc => {
            const data = doc.data();
            if (!esAdminSupremo && data.creador !== currentUserName) return;

            const esIndividual = data.formato === '1v1';
            const numInscritos = esIndividual ? (data.lista_inscriptos?.length || 0) : (data.lista_equipos?.length || 0);
            
            let accionHtml = "";

            if (data.estado === 'abierto') {
                accionHtml = `<button class="btn-primary" style="background:var(--blue); color:black;" onclick="generarLlaves('${doc.id}', '${data.nombre}')">GENERAR CRUCES INICIALES</button>`;
            } else if (data.estado === 'iniciado') {
                accionHtml = `<button class="btn-secondary" style="border-color: gold; color: gold;" onclick="abrirAdminPartidos('${doc.id}', '${data.nombre}', '${data.creador}', '${data.formato}')">GESTIONAR PARTIDOS</button>`;
            } else {
                accionHtml = `<span style="color:var(--red); font-weight:bold;">FINALIZADO</span>`;
            }

            listaModAdmin.innerHTML += `
                <div style="background: rgba(0,0,0,0.5); border: 1px solid #333; padding: 15px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="color:white; font-size:1.1rem;">${data.nombre}</strong><br>
                        <span style="font-size:0.85rem; color:#aaa;">Inscritos: ${numInscritos} / ${data.cuposTotales} | Estado: ${data.estado}</span>
                    </div>
                    <div>${accionHtml}</div>
                </div>
            `;
        });
    });
}

window.generarLlaves = async function(torneoId, torneoNombre) {
    if(!confirm("¿Estás seguro de generar los cruces? Ya no se podrán inscribir más ninjas ni equipos.")) return;

    const torneoRef = db.collection('torneos').doc(torneoId);
    const torneoDoc = await torneoRef.get();
    const data = torneoDoc.data();

    let participantes = [];
    if (data.formato === '1v1') {
        participantes = data.lista_inscriptos || [];
    } else {
        participantes = (data.lista_equipos || []).map(eq => eq.nombre);
    }

    if (participantes.length < 2) return alert("Se necesitan al menos 2 participantes para generar combates.");

    participantes = participantes.sort(() => Math.random() - 0.5);
    
    const partidos = [];
    for (let i = 0; i < participantes.length; i += 2) {
        if (participantes[i+1]) {
            partidos.push({ p1: participantes[i], p2: participantes[i+1], ganador: "", ronda: 1 });
        } else {
            partidos.push({ p1: participantes[i], p2: "BYE", ganador: participantes[i], ronda: 1 });
        }
    }

    const batch = db.batch();
    const llavesRef = torneoRef.collection('llaves');

    const viejasLlaves = await llavesRef.get();
    viejasLlaves.forEach(doc => batch.delete(doc.ref));

    partidos.forEach((partido, index) => {
        const nuevoDoc = llavesRef.doc(`partido_${index + 1}`);
        batch.set(nuevoDoc, partido);
    });

    batch.update(torneoRef, { estado: "iniciado", campeon: "" });
    await batch.commit();

    alert("¡Los cruces han sido forjados! El torneo ha comenzado.");
};

window.abrirAdminPartidos = function(torneoId, torneoNombre, creador, formato) {
    document.getElementById('admin-partidos-titulo').innerText = `Tribunal Kage: ${torneoNombre}`;
    window.location.hash = "#modal-admin-partidos";
    
    document.getElementById('input-torneo-manual-id').value = torneoId;
    document.getElementById('input-torneo-manual-formato').value = formato;
    
    const inputEquipoManual = document.getElementById('input-equipo-manual');
    if (formato === '1v1') {
        inputEquipoManual.style.display = 'none';
    } else {
        inputEquipoManual.style.display = 'block';
    }

    db.collection('torneos').doc(torneoId).collection('llaves').orderBy('ronda', 'desc').onSnapshot(snap => {
        const contenedor = document.getElementById('contenedor-admin-partidos');
        contenedor.innerHTML = "";
        
        let todosTienenGanador = true;
        let partidosRondaActual = 0;
        let ganadoresParaSiguienteRonda = [];
        let rondaMasAlta = 1;

        snap.forEach(doc => {
            const partido = doc.data();
            const partidoId = doc.id;
            
            if (partido.ronda > rondaMasAlta) rondaMasAlta = partido.ronda;

            let accionHtml = "";
            if (partido.ganador) {
                accionHtml = `<span style="color:var(--green); font-weight:bold;"><i class="fas fa-check"></i> ${partido.ganador}</span>`;
            } else {
                todosTienenGanador = false;
                accionHtml = `
                    <button class="btn-secondary" style="padding: 5px 10px; font-size: 0.8rem; margin-right:5px;" onclick="setGanadorManual('${torneoId}', '${partidoId}', '${partido.p1}')">Gana ${partido.p1}</button>
                    <button class="btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="setGanadorManual('${torneoId}', '${partidoId}', '${partido.p2}')">Gana ${partido.p2}</button>
                `;
            }

            // NUEVO: VISUALIZACIÓN DE REPORTE Y PRUEBA (FOTO)
            let reporteHtml = "";
            if (partido.reporte) {
                reporteHtml = `
                    <div style="background: rgba(255,215,0,0.1); padding: 10px; margin-top: 10px; border: 1px dashed gold; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color:gold; font-size:0.85rem;"><i class="fas fa-exclamation-circle"></i> <strong>${partido.reporte.reportadoPor}</strong> reportó victoria de: <strong>${partido.reporte.ganador}</strong></span>
                        <a href="${partido.reporte.capturaUrl}" target="_blank" class="btn-primary" style="padding: 5px 10px; font-size: 0.75rem; background: gold; color: black;"><i class="fas fa-image"></i> VER PRUEBA</a>
                    </div>
                `;
            }

            // NUEVO: ASIGNACIÓN DE SALAS
            let salaHtml = "";
            if (!partido.ganador && partido.p2 !== "BYE") {
                salaHtml = `
                    <div style="margin-top:10px; display:flex; gap:5px;">
                        <input type="text" id="sala-id-${partidoId}" placeholder="ID de Sala" value="${partido.salaId || ''}" style="flex:1; padding:6px; background:#000; color:white; border:1px solid #333; font-size: 0.8rem;">
                        <input type="text" id="sala-pass-${partidoId}" placeholder="Contraseña" value="${partido.salaPass || ''}" style="flex:1; padding:6px; background:#000; color:white; border:1px solid #333; font-size: 0.8rem;">
                        <button onclick="guardarSala('${torneoId}', '${partidoId}')" class="btn-secondary" style="padding:6px 12px; font-size:0.8rem; border-color: var(--blue); color: var(--blue);">FIJAR SALA</button>
                    </div>
                `;
            }

            contenedor.innerHTML += `
                <div style="background: rgba(0,0,0,0.5); border: 1px solid var(--blue); padding: 15px; border-radius: 8px; margin-bottom: 10px; margin-top:5px;">
                    <span style="color:#aaa; font-size:0.8rem; display:block; margin-bottom:5px;">Ronda ${partido.ronda}</span>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color:white; font-size:1.1rem; font-weight:bold;">${partido.p1} <span style="color:#666;">VS</span> ${partido.p2}</span>
                        <div>${accionHtml}</div>
                    </div>
                    ${reporteHtml}
                    ${salaHtml}
                </div>
            `;
        });

        snap.forEach(doc => {
            if (doc.data().ronda === rondaMasAlta) {
                partidosRondaActual++;
                if(doc.data().ganador) ganadoresParaSiguienteRonda.push(doc.data().ganador);
            }
        });

        const btnSiguienteRonda = document.getElementById('btn-siguiente-ronda');
        
        if (todosTienenGanador && snap.size > 0) {
            if (partidosRondaActual === 1 && ganadoresParaSiguienteRonda.length === 1) {
                btnSiguienteRonda.style.display = 'block';
                btnSiguienteRonda.innerText = `CORONAR A ${ganadoresParaSiguienteRonda[0]} COMO CAMPEÓN`;
                btnSiguienteRonda.style.background = 'gold';
                btnSiguienteRonda.style.color = 'black';
                btnSiguienteRonda.onclick = () => declararCampeon(torneoId, ganadoresParaSiguienteRonda[0]);
            } else if (partidosRondaActual > 1 && ganadoresParaSiguienteRonda.length === partidosRondaActual) {
                btnSiguienteRonda.style.display = 'block';
                btnSiguienteRonda.innerText = "GENERAR SIGUIENTE RONDA (Sorteo)";
                btnSiguienteRonda.style.background = 'var(--blue)';
                btnSiguienteRonda.style.color = 'black';
                btnSiguienteRonda.onclick = () => generarSiguienteRonda(torneoId, ganadoresParaSiguienteRonda, rondaMasAlta + 1);
            } else {
                btnSiguienteRonda.style.display = 'none';
            }
        } else {
            btnSiguienteRonda.style.display = 'none';
        }
    });
};

window.guardarSala = function(torneoId, partidoId) {
    const salaId = document.getElementById(`sala-id-${partidoId}`).value.trim();
    const salaPass = document.getElementById(`sala-pass-${partidoId}`).value.trim();
    db.collection('torneos').doc(torneoId).collection('llaves').doc(partidoId).update({
        salaId: salaId,
        salaPass: salaPass
    }).then(() => {
        alert("Datos de la sala actualizados. Los jugadores ya pueden verlos en la llave.");
    });
};

window.setGanadorManual = function(torneoId, partidoId, ganadorName) {
    if (confirm(`¿Declarar a ${ganadorName} como vencedor de este combate?`)) {
        db.collection('torneos').doc(torneoId).collection('llaves').doc(partidoId).update({
            ganador: ganadorName
        });
    }
};

window.generarSiguienteRonda = async function(torneoId, ganadores, nuevaRonda) {
    if(!confirm("¿Avanzar a la siguiente ronda con los vencedores actuales?")) return;

    let competidores = ganadores.sort(() => Math.random() - 0.5);
    const partidosNuevos = [];
    
    for (let i = 0; i < competidores.length; i += 2) {
        if (competidores[i+1]) {
            partidosNuevos.push({ p1: competidores[i], p2: competidores[i+1], ganador: "", ronda: nuevaRonda });
        } else {
            partidosNuevos.push({ p1: competidores[i], p2: "BYE", ganador: competidores[i], ronda: nuevaRonda });
        }
    }

    const llavesRef = db.collection('torneos').doc(torneoId).collection('llaves');
    
    for(let i = 0; i < partidosNuevos.length; i++) {
        await llavesRef.add(partidosNuevos[i]);
    }
    
    alert(`Ronda ${nuevaRonda} forjada exitosamente.`);
};

window.declararCampeon = async function(torneoId, campeonName) {
    if(!confirm(`¿Coronar a ${campeonName} como Campeón Definitivo y finalizar el evento?`)) return;

    await db.collection('torneos').doc(torneoId).update({
        estado: 'finalizado',
        campeon: campeonName
    });

    const torneoData = (await db.collection('torneos').doc(torneoId).get()).data();
    
    if (torneoData.formato === '1v1') {
        const snap = await db.collection('ninjas').where('nick', '==', campeonName).get();
        if (!snap.empty) {
            const expGanada = torneoData.tipo === 'liga' ? 100 : 50;
            snap.docs[0].ref.update({
                torneosGanados: firebase.firestore.FieldValue.increment(1),
                xp: firebase.firestore.FieldValue.increment(expGanada)
            });
        }
    } else {
        const equipoSnap = torneoData.lista_equipos.find(eq => eq.nombre === campeonName);
        if (equipoSnap && equipoSnap.miembros) {
            const expGanada = torneoData.tipo === 'liga' ? 100 : 50;
            for(let miembro of equipoSnap.miembros) {
                const ninjaQ = await db.collection('ninjas').where('nick', '==', miembro).get();
                if(!ninjaQ.empty) {
                    ninjaQ.docs[0].ref.update({
                        torneosGanados: firebase.firestore.FieldValue.increment(1),
                        xp: firebase.firestore.FieldValue.increment(expGanada)
                    });
                }
            }
            const clanQ = await db.collection('clanes').where('nombre', '==', campeonName).get();
            if(!clanQ.empty) {
                clanQ.docs[0].ref.update({
                    xp: firebase.firestore.FieldValue.increment(expGanada * 2)
                });
            }
        }
    }

    alert(`¡${campeonName} HA SIDO CORONADO CAMPEÓN DE LA ARENA!`);
    window.location.hash = "#";
};

window.banearUsuario = function() {
    const nickBuscado = document.getElementById('gestion-nick').value.trim();
    if(!nickBuscado) return;
    if(confirm(`¿Desterrar a ${nickBuscado} de la Arena de forma permanente?`)) {
        db.collection('ninjas').where('nick', '==', nickBuscado).get().then(snap => {
            if(!snap.empty) {
                snap.docs[0].ref.update({ banned: true });
                alert("Ninja desterrado.");
            } else {
                alert("No se encontró al ninja.");
            }
        });
    }
};

window.gestionarPlan = function(nuevoPlan) {
    const nickBuscado = document.getElementById('gestion-nick').value.trim();
    if(!nickBuscado) return;
    db.collection('ninjas').where('nick', '==', nickBuscado).get().then(snap => {
        if(!snap.empty) {
            snap.docs[0].ref.update({ plan: nuevoPlan });
            alert(`Rango ${nuevoPlan.toUpperCase()} otorgado a ${nickBuscado}.`);
        } else {
            alert("No se encontró al ninja en los registros.");
        }
    });
};

const formBancoKage = document.getElementById('form-banco-kage');
if (formBancoKage) {
    formBancoKage.addEventListener('submit', (e) => {
        e.preventDefault();
        const nickDestino = document.getElementById('banco-usuario').value.trim();
        const monto = parseInt(document.getElementById('banco-monto').value);

        if(!nickDestino || isNaN(monto)) return;

        db.collection('ninjas').where('nick', '==', nickDestino).get().then(snap => {
            if(!snap.empty) {
                snap.docs[0].ref.update({
                    ryos: firebase.firestore.FieldValue.increment(monto)
                }).then(() => {
                    alert(`Transferencia de tesorería exitosa: ${monto} Diamantes a ${nickDestino}.`);
                    document.getElementById('form-banco-kage').reset();
                    enviarNotificacion(nickDestino, `El Kage te ha enviado ${monto} Diamantes a tu billetera.`);
                });
            } else {
                alert("No se encontró al ninja destinatario.");
            }
        });
    });
}

const formConfigTicker = document.getElementById('form-config-ticker');
if(formConfigTicker) {
    formConfigTicker.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = document.getElementById('input-ticker').value;
        db.collection('configuracion').doc('ticker').set({ mensaje: msg }).then(() => alert("Alerta Global Lanzada."));
    });
}

const formConfigStream = document.getElementById('form-config-stream');
if(formConfigStream) {
    formConfigStream.addEventListener('submit', (e) => {
        e.preventDefault();
        const plat = document.getElementById('stream-plataforma-admin').value;
        const idCrudo = document.getElementById('stream-id-admin').value;
        const idLimpio = extraerIdLimpio(idCrudo, plat);
        const urlDiscord = document.getElementById('discord-url-admin').value;

        db.collection('configuracion').doc('global_media').update({
            plataforma: plat,
            id: idLimpio,
            discordUrl: urlDiscord
        }).then(() => alert("Señal de Transmisión Sincronizada con la aldea."));
    });
}

const formSorteoAdmin = document.getElementById('form-crear-sorteo');
if (formSorteoAdmin) {
    formSorteoAdmin.addEventListener('submit', (e) => {
        e.preventDefault();
        const premio = document.getElementById('s-premio').value;
        const precio = parseInt(document.getElementById('s-precio').value);
        const ganadores = parseInt(document.getElementById('s-ganadores').value);
        
        db.collection('sorteos').add({
            premio: premio,
            precio: precio,
            cantidadGanadores: ganadores,
            estado: 'abierto',
            participantes: [],
            ganadores: [],
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert("¡Sorteo Mágico lanzado a la comunidad!");
            formSorteoAdmin.reset();
        });
    });
}

// ==========================================
// AVISOS Y ALERTAS (NOTIFICACIONES)
// ==========================================
function escucharTicker() {
    db.collection('configuracion').doc('ticker').onSnapshot(doc => {
        if(doc.exists) {
            const data = doc.data();
            document.getElementById('ticker-contenido').innerHTML = `<span class="ticker-item"><i class="fas fa-bullhorn"></i> ALERTA DEL KAGE: <span style="color: var(--blue); font-weight: bold;">${data.mensaje}</span></span>`;
        }
    });
}

function enviarNotificacion(usuario, textoMensaje) {
    if (!usuario || usuario === "Héroe Anónimo") return;
    db.collection('notificaciones').add({
        para: usuario,
        texto: textoMensaje,
        leida: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

function escucharNotificaciones() {
    const badge = document.getElementById('notif-badge');
    const contenedorHTML = document.getElementById('lista-notificaciones-contenido');
    if(!contenedorHTML) return;

    db.collection('notificaciones').where('para', '==', currentUserName).orderBy('timestamp', 'desc').onSnapshot(snap => {
        let noLeidas = 0;
        contenedorHTML.innerHTML = "";
        
        if (snap.empty) {
            contenedorHTML.innerHTML = "<p style='color:#888; text-align:center;'>El cuervo no ha traído mensajes nuevos.</p>";
            badge.style.display = 'none';
            return;
        }

        snap.forEach(doc => { 
            const data = doc.data(); if(!data.leida) noLeidas++; 
            const bg = data.leida ? '#0a0a0f' : '#1a1a24'; const border = data.leida ? '1px solid #222' : '1px solid var(--blue)'; 
            contenedorHTML.innerHTML += `<div style="background: ${bg}; border: ${border}; padding: 10px; border-radius: 5px; margin-bottom: 8px; font-size: 0.85rem;"><i class="fas fa-envelope" style="color: var(--blue); margin-right: 5px;"></i> ${data.texto}</div>`; 
        });
        if(noLeidas > 0) { badge.innerText = noLeidas; badge.style.display = 'inline-block'; } else { badge.style.display = 'none'; }
    });
}

window.abrirNotificaciones = function(e) { 
    e.preventDefault(); 
    document.getElementById('modal-notificaciones').style.display = 'flex'; 
    db.collection('notificaciones').where('para', '==', currentUserName).where('leida', '==', false).get().then(snap => { 
        const batch = db.batch(); 
        snap.forEach(doc => { batch.update(doc.ref, { leida: true }); }); 
        batch.commit(); 
    }); 
};

// ==========================================
// UTILIDADES (CERRAR MODALES, SESIÓN)
// ==========================================
window.cerrarModalPerfil = function(e) { if(e) e.preventDefault(); history.back(); };
window.cerrarSesion = function() { auth.signOut().then(() => window.location.reload()); };
