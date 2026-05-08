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

const ADMIN_EMAIL = "matias.moto7@gmail.com";
let currentUserName = "Ninja Anónimo";
let currentUserId = null;
let miClan = "";
let miComunidad = ""; // NUEVO: Para el sistema de Alianzas
let misRyos = 0;
let miPlan = "genin";
let miInventario = [];
let miEquipamiento = { borde: '', colorChat: '', pin: '' };
let currentFilter = 'todos'; 
let trabajando = false; 
let miPerfilActual = {};
let unsubscribeChatComunidad = null; // Para gestionar el chat privado

// ==========================================
// MERCADO
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
// INICIALIZACIÓN
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
                        alert("Has sido expulsado de la aldea.");
                        auth.signOut();
                        return;
                    }

                    miPerfilActual = data; 
                    currentUserName = data.nick; 
                    miClan = data.clan || ""; 
                    miComunidad = data.comunidad || ""; // Carga la comunidad
                    misRyos = data.ryos || 0; 
                    miPlan = data.plan || "genin";
                    miInventario = data.inventario || []; 
                    miEquipamiento = data.equipado || { borde: '', colorChat: '', pin: '' };

                    if(userDisplay) { userDisplay.innerText = currentUserName; userDisplay.href = "#"; }
                    document.getElementById('user-greeting').innerText = currentUserName;
                    document.getElementById('mi-nick-bingo').innerText = currentUserName;
                    document.getElementById('mi-rango-bingo').innerText = data.rango || 'Guerrero';
                    document.getElementById('mi-xp-bingo').innerText = `${data.xp || 0} XP`;
                    document.getElementById('mi-ryos-bingo').innerHTML = `<i class="fas fa-coins"></i> ${misRyos} Ryos`;
                    document.getElementById('tienda-mis-ryos').innerHTML = `${misRyos} Ryos`;
                    
                    document.getElementById('btn-notif').style.display = 'inline-block';
                    renderizarTienda();
                    
                    // ======================================
                    // LÓGICA DE COMUNIDADES (UI Y CHAT)
                    // ======================================
                    const esAdmin = (user.email === ADMIN_EMAIL);
                    
                    if (miComunidad !== "") {
                        document.getElementById('vista-sin-comunidad').style.display = 'none';
                        document.getElementById('vista-con-comunidad').style.display = 'flex';
                        document.getElementById('nombre-mi-comunidad').innerText = miComunidad;
                    } else {
                        document.getElementById('vista-sin-comunidad').style.display = 'block';
                        document.getElementById('vista-con-comunidad').style.display = 'none';
                    }

                    if (esAdmin) {
                        // El Kage ve el panel de comunidad forzado para poder espiar
                        document.getElementById('vista-sin-comunidad').style.display = 'none';
                        document.getElementById('vista-con-comunidad').style.display = 'flex';
                        document.getElementById('nombre-mi-comunidad').innerText = "Vigilancia Kage";
                        document.getElementById('kage-comunidad-selector-container').style.display = 'block';
                        document.getElementById('btn-abandonar-comunidad').style.display = 'none';
                        cargarSelectorComunidadesKage();
                    } else if (miComunidad !== "") {
                        escucharChatComunidad(miComunidad);
                    }

                    // ======================================
                    // LÓGICA DE ROLES PARA EL PANEL CREADOR/KAGE
                    // ======================================
                    if(esAdmin || miPlan === 'jonin' || miPlan === 'kasekage') {
                        if(adminNav) adminNav.style.display = 'block';
                        if(adminSection) adminSection.style.display = 'block';
                        
                        document.getElementById('titulo-panel-admin').innerText = esAdmin ? 'Centro de Mando Kage' : 'Panel de Creador';
                        document.getElementById('btn-admin-nav').innerText = esAdmin ? 'Kage' : 'Creador';
                        
                        const adminElements = document.querySelectorAll('.admin-only');
                        adminElements.forEach(el => el.style.display = esAdmin ? 'inline-block' : 'none');

                        // Restricciones de Creador
                        if(!esAdmin && miPlan === 'jonin') {
                            document.getElementById('opt-3v3').disabled = true;
                            document.getElementById('opt-5v5').disabled = true;
                            document.getElementById('opt-liga').disabled = true;
                        } else if (!esAdmin && miPlan === 'kasekage') {
                            document.getElementById('opt-liga').disabled = true;
                        }

                        cargarTorneosParaAdminLlaves();
                    }
                } else {
                    window.location.hash = "#modal-registro-nick";
                }
            });
            escucharNotificaciones();
        } else {
            currentUserName = "Ninja Anónimo";
            if(userDisplay) { userDisplay.innerText = "Ingresar"; userDisplay.href = "#modal-login"; }
            document.getElementById('btn-notif').style.display = 'none';
        }
    });

    const loginBtn = document.getElementById('login-google');
    if(loginBtn) { loginBtn.addEventListener('click', () => { auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); }); }

    const formNick = document.getElementById('form-registro-nick');
    if(formNick) {
        formNick.addEventListener('submit', (e) => {
            e.preventDefault();
            const nuevoNick = document.getElementById('nuevo-nick').value.trim();
            db.collection('ninjas').doc(currentUserId).set({
                nick: nuevoNick, xp: 0, ryos: 100, torneosGanados: 0, rango: "Guerrero", clan: "", comunidad: "", plan: "genin", banned: false,
                inventario: [], equipado: {borde: '', colorChat: '', pin: ''}, fotoPerfil: "", bio: "",
                redSocial: "", email_oculto: auth.currentUser.email, fecha_registro: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                alert("¡Identidad Ninja creada! +100 Ryos de bienvenida.");
                window.location.hash = "#";
                window.location.reload();
            });
        });
    }

    escucharTicker();
    cargarTorneosDesdeNube();
    cargarHallOfFame();
    cargarVideosAbismo();
    cargarTopClanes();
    cargarAnunciosGremio();
    cargarTopIndividualBingo();
    escucharTabernaGlobal();
    configurarAdminForms();
    cargarTopComunidades(); // NUEVO
});

// ==========================================
// COMUNIDADES ALIADAS (NUEVO SISTEMA)
// ==========================================
function crearComunidad() {
    if (currentUserName === "Ninja Anónimo") return alert("Ingresa primero.");
    const nombre = document.getElementById('input-crear-comunidad').value.trim(); if(!nombre) return;
    
    db.collection('comunidades').doc(nombre).get().then(doc => {
        if(doc.exists) { alert("Esa Comunidad ya existe en la Arena."); }
        else {
            db.collection('comunidades').doc(nombre).set({ 
                nombre: nombre, lider: currentUserName, miembros: [currentUserName], creacion: firebase.firestore.FieldValue.serverTimestamp() 
            }).then(() => { 
                db.collection('ninjas').doc(currentUserId).update({ comunidad: nombre }); 
                alert("¡Has fundado tu propia Comunidad!"); 
            });
        }
    });
}

function unirseComunidad() {
    if (currentUserName === "Ninja Anónimo") return alert("Ingresa primero.");
    const nombre = document.getElementById('input-unirse-comunidad').value.trim(); if(!nombre) return;
    
    db.collection('comunidades').doc(nombre).get().then(doc => {
        if(!doc.exists) { alert("Esta Comunidad no fue encontrada en los pergaminos."); }
        else { 
            db.collection('comunidades').doc(nombre).update({ miembros: firebase.firestore.FieldValue.arrayUnion(currentUserName) }).then(() => { 
                db.collection('ninjas').doc(currentUserId).update({ comunidad: nombre }); 
                alert(`¡Te has unido a ${nombre}!`); 
            }); 
        }
    });
}

function abandonarComunidad() {
    if(confirm("¿Abandonar tu Comunidad Aliada?")) {
        db.collection('comunidades').doc(miComunidad).get().then(doc => {
            if(doc.exists) {
                const data = doc.data();
                if(data.lider === currentUserName && data.miembros.length > 1) { alert("Eres el líder. La comunidad no puede quedarse sin cabeza a menos que quede vacía."); return; }
                if(data.miembros.length === 1) { db.collection('comunidades').doc(miComunidad).delete(); }
                else { db.collection('comunidades').doc(miComunidad).update({ miembros: firebase.firestore.FieldValue.arrayRemove(currentUserName) }); }
                db.collection('ninjas').doc(currentUserId).update({ comunidad: "" }).then(() => { alert("Has abandonado la Comunidad."); window.location.reload(); });
            }
        });
    }
}

function cargarTopComunidades() {
    const lista = document.getElementById('lista-top-comunidades'); if(!lista) return;
    db.collection('comunidades').onSnapshot(snap => {
        let comunidades = [];
        snap.forEach(doc => comunidades.push(doc.data()));
        comunidades.sort((a, b) => b.miembros.length - a.miembros.length); // Ordenar por cantidad de miembros
        
        lista.innerHTML = "";
        if(comunidades.length === 0) { lista.innerHTML = "<p style='color:#666; text-align:center;'>Ninguna alianza forjada aún.</p>"; return; }
        
        comunidades.slice(0, 5).forEach((d, index) => {
            let color = "#333"; if(index === 0) color = "gold"; else if(index === 1) color = "silver"; else if(index === 2) color = "#cd7f32";
            lista.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.5); padding:12px; border-radius:5px; border-left:3px solid ${color}; margin-bottom: 8px;">
                    <div><strong style="color: white; font-size: 1.1rem;">${index + 1}. ${d.nombre}</strong> <br> <span style="font-size:0.75rem; color:#888;"><i class="fas fa-crown" style="color: gold;"></i> Líder: ${d.lider}</span></div>
                    <div style="color:var(--purple); font-weight:bold; font-size:1rem;"><i class="fas fa-users"></i> ${d.miembros.length} Ninjas</div>
                </div>`;
        });
    });
}

// CHAT PRIVADO COMUNIDAD
function escucharChatComunidad(comunidadNombre) {
    if (!comunidadNombre) return;
    const chatContainer = document.getElementById('chat-comunidad-container');
    if(!chatContainer) return;
    
    if (unsubscribeChatComunidad) unsubscribeChatComunidad(); // Detener escucha anterior
    
    unsubscribeChatComunidad = db.collection('chat_comunidades')
        .where('comunidad', '==', comunidadNombre)
        .orderBy('timestamp')
        .limit(50)
        .onSnapshot(snap => {
            chatContainer.innerHTML = '';
            snap.forEach(doc => {
                const d = doc.data();
                let estiloNombre = "color: var(--purple);";
                if (d.colorEstilo !== "") {
                    const itemCat = CATALOGO_TIENDA.find(i => i.id === d.colorEstilo);
                    if(itemCat) estiloNombre = itemCat.estilo;
                }
                if (d.usuario === 'Matías' || d.usuario === 'Kage') { estiloNombre = "color: var(--red); text-shadow: 0 0 5px red;"; }
                
                chatContainer.innerHTML += `
                    <div style="margin-bottom: 8px; border-bottom: 1px solid #111; padding-bottom: 5px; font-size:0.9rem;">
                        <strong style="${estiloNombre} margin-right: 5px; cursor:pointer;" onclick="abrirPerfil('${d.usuario}')">${d.usuario}:</strong> 
                        <span style="color:#ddd; word-break: break-all;">${d.texto}</span>
                    </div>`;
            });
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });
}

function enviarMensajeComunidad() {
    if(currentUserName === "Ninja Anónimo") return alert("Debes identificarte.");
    const input = document.getElementById('chat-input-comunidad');
    const texto = input.value.trim();
    if(!texto) return;

    let targetComunidad = miComunidad;
    if (auth.currentUser?.email === ADMIN_EMAIL) {
        targetComunidad = document.getElementById('kage-comunidad-selector').value;
    }

    if(!targetComunidad) return alert("No estás en ninguna comunidad.");

    db.collection('chat_comunidades').add({ 
        comunidad: targetComunidad, usuario: currentUserName, texto: texto, colorEstilo: miEquipamiento.colorChat || '', timestamp: firebase.firestore.FieldValue.serverTimestamp() 
    });
    input.value = '';
}

function cargarSelectorComunidadesKage() {
    const selector = document.getElementById('kage-comunidad-selector');
    db.collection('comunidades').onSnapshot(snap => {
        selector.innerHTML = "<option value='' disabled selected>Selecciona para espiar...</option>";
        snap.forEach(doc => {
            selector.innerHTML += `<option value="${doc.id}">${doc.id} (${doc.data().miembros.length} ninjas)</option>`;
        });
    });
}

function cambiarChatComunidadKage() {
    const seleccionada = document.getElementById('kage-comunidad-selector').value;
    if(seleccionada) escucharChatComunidad(seleccionada);
}


// ==========================================
// TIENDA Y RYOS
// ==========================================
function renderizarTienda() {
    const catalogo = document.getElementById('catalogo-tienda');
    if(!catalogo) return;
    catalogo.innerHTML = "";
    
    CATALOGO_TIENDA.forEach(item => {
        const loTiene = miInventario.includes(item.id);
        const loTieneEquipado = (miEquipamiento.borde === item.id || miEquipamiento.colorChat === item.id || miEquipamiento.pin === item.id);
        let botonHTML = "";
        
        if (currentUserName === "Ninja Anónimo") {
            botonHTML = `<button class="btn-primary" style="width: 100%; background: #444;" onclick="alert('Debes ingresar.')">IDENTIFÍCATE</button>`;
        } else if (loTieneEquipado) {
            botonHTML = `<button class="btn-primary" style="width: 100%; background: var(--green); color: black;" disabled><i class="fas fa-check"></i> EQUIPADO</button>`;
        } else if (loTiene) {
            botonHTML = `<button class="btn-primary" style="width: 100%; background: var(--blue); color: black;" onclick="equiparObjeto('${item.id}', '${item.tipo}')">EQUIPAR</button>`;
        } else {
            let textoPrecio = auth.currentUser?.email === ADMIN_EMAIL ? "GRATIS (KAGE)" : `ADQUIRIR (${item.precio} R)`;
            botonHTML = `<button class="btn-primary" style="width: 100%;" onclick="comprarObjeto('${item.id}', ${item.precio})"><i class="fas fa-shopping-cart"></i> ${textoPrecio}</button>`;
        }
        
        let previewHTML = "";
        if (item.tipo === 'borde') previewHTML = `<div style="width: 50px; height: 50px; border-radius: 50%; ${item.estilo} margin: 0 auto 10px auto; background: #222;"></div>`;
        if (item.tipo === 'colorChat') previewHTML = `<div style="font-size: 1.2rem; font-weight: bold; ${item.estilo} margin-bottom: 10px;">${currentUserName !== 'Ninja Anónimo' ? currentUserName : 'Ninja'}</div>`;
        if (item.tipo === 'pin') previewHTML = `<div style="font-size: 2rem; margin-bottom: 10px;">${item.icon}</div>`;
        
        catalogo.innerHTML += `
            <div class="container-glass" style="text-align: center;">
                ${previewHTML}
                <h4 style="color: white; margin-bottom: 5px;">${item.nombre}</h4>
                <p style="font-size: 0.8rem; color: #888; margin-bottom: 15px; min-height: 35px;">${item.desc}</p>
                ${botonHTML}
            </div>`;
    });
}

function comprarObjeto(id, precioBase) {
    if(currentUserName === "Ninja Anónimo") return;
    let costoFinal = auth.currentUser.email === ADMIN_EMAIL ? 0 : precioBase;
    if (misRyos < costoFinal) { alert("Ryos insuficientes. Trabaja o gana torneos."); return; }
    if(confirm(`¿Gastar ${costoFinal} Ryos en este artículo?`)) {
        db.collection('ninjas').doc(currentUserId).update({
            ryos: misRyos - costoFinal,
            inventario: firebase.firestore.FieldValue.arrayUnion(id)
        }).then(() => alert("¡Compra exitosa! Revisa tu inventario."));
    }
}

function equiparObjeto(id, tipo) {
    const nuevoEquipamiento = { ...miEquipamiento };
    nuevoEquipamiento[tipo] = id;
    db.collection('ninjas').doc(currentUserId).update({ equipado: nuevoEquipamiento }).then(() => alert("¡Objeto equipado con éxito!"));
}

function misionDiaria() {
    if(currentUserName === "Ninja Anónimo") return alert("Ingresa primero para trabajar.");
    if(trabajando) return;
    
    db.collection('ninjas').doc(currentUserId).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            const hoy = new Date().toLocaleDateString('es-AR');
            let countTrabajosHoy = data.trabajosHoy || 0;
            let fechaUltimoTrabajo = data.fechaTrabajo || "";
            
            if (fechaUltimoTrabajo === hoy) {
                if (countTrabajosHoy >= 3) { alert("Has alcanzado el límite diario (30 Ryos). Vuelve mañana."); return; }
                countTrabajosHoy++;
            } else {
                fechaUltimoTrabajo = hoy; countTrabajosHoy = 1;
            }
            
            trabajando = true;
            const btn = document.getElementById('btn-trabajar');
            btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Trabajando...";
            
            setTimeout(() => {
                db.collection('ninjas').doc(currentUserId).update({
                    ryos: firebase.firestore.FieldValue.increment(10),
                    trabajosHoy: countTrabajosHoy,
                    fechaTrabajo: fechaUltimoTrabajo
                }).then(() => {
                    trabajando = false;
                    btn.innerHTML = "<i class='fas fa-hand-holding-usd'></i> Trabajar (+10 Ryos)";
                    alert(`¡Ganaste 10 Ryos! (${countTrabajosHoy}/3 trabajos hoy)`);
                });
            }, 1500);
        }
    });
}

// ==========================================
// TORNEOS Y LIGAS
// ==========================================
function filtrarTorneos(formato, event) {
    currentFilter = formato;
    const botones = document.querySelectorAll('#torneos .btn-filter');
    botones.forEach(btn => btn.classList.remove('active'));
    if(event) event.target.classList.add('active');
    cargarTorneosDesdeNube();
}

function cargarTorneosDesdeNube() {
    const listaTorneos = document.getElementById('lista-torneos');
    const listaLigas = document.getElementById('lista-ligas');
    if(!listaTorneos || !listaLigas) return;
    
    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        listaTorneos.innerHTML = ''; listaLigas.innerHTML = '';
        let hayTorneos = false; let hayLigas = false;
        
        snap.forEach(doc => {
            const data = doc.data(); const id = doc.id; 
            const esLiga = data.tipo === 'liga';
            
            if(esLiga) {
                hayLigas = true;
                listaLigas.innerHTML += generarTarjetaEventoHTML(data, id, true);
            } else {
                if (currentFilter === 'todos' || data.formato === currentFilter) {
                    hayTorneos = true;
                    listaTorneos.innerHTML += generarTarjetaEventoHTML(data, id, false);
                }
            }
        });
        
        if(!hayTorneos) { listaTorneos.innerHTML = '<p style="color: #ccc; grid-column: 1 / -1; text-align: center;">No hay torneos relámpago con este filtro.</p>'; }
        if(!hayLigas) { listaLigas.innerHTML = '<p style="color: #ccc; grid-column: 1 / -1; text-align: center;">El Kage aún no ha decretado una Liga Mensual...</p>'; }
    });
}

function generarTarjetaEventoHTML(data, id, esLiga) {
    const inscritos = data.lista_inscriptos ? data.lista_inscriptos.length : 0;
    const cupos = data.cuposTotales || 0;
    const estaLleno = inscritos >= cupos;
    const yaInscrito = data.lista_inscriptos && data.lista_inscriptos.includes(currentUserName);
    
    let btnTexto = "UNIRSE A LA BATALLA"; let btnColor = "var(--blue)";
    if (data.estado === "iniciado" || data.estado === "finalizado") { btnTexto = "EVENTO CERRADO"; btnColor = "gray"; }
    else if (yaInscrito) { btnTexto = "YA ESTÁS INSCRIPTO"; btnColor = "var(--green)"; }
    else if (estaLleno) { btnTexto = "CUPOS LLENOS"; btnColor = "gray"; }
    
    const etiquetaPrivado = data.privado ? '<span style="color:#ff0040; font-size:0.7rem; float:right; border:1px solid #ff0040; padding:2px 5px; border-radius:3px;">PRIVADO</span>' : '';
    let nombresPreview = "";
    if(inscritos > 0) {
        const primerosNombres = data.lista_inscriptos.slice(0, 3).map(n => `<span style="cursor:pointer; color:var(--blue);" onclick="abrirPerfil('${n}')">${n}</span>`).join(", ");
        nombresPreview = `<p style="font-size: 0.75rem; color: #888; margin-bottom: 5px;">Ninjas: ${primerosNombres}${inscritos > 3 ? '...' : ''}</p>`;
    }
    
    const borderClase = esLiga ? 'border-color: gold !important; background: linear-gradient(180deg, rgba(255,215,0,0.05) 0%, rgba(10,10,15,0.95) 100%);' : '';
    const badgeColor = esLiga ? 'gold' : 'var(--blue)';
    const colorBtnTex = (btnColor === 'gray' || btnColor === 'var(--blue)') ? 'black' : 'black';
    
    return `
        <div class="card-t container-glass" style="${borderClase}">
            <span style="color:${badgeColor}; font-weight:bold; font-size: 0.8rem; background: rgba(255, 255, 255, 0.1); padding: 4px 10px; border-radius: 4px; border: 1px solid ${badgeColor}; display: inline-block; margin-bottom: 10px;">${esLiga ? 'LIGA MENSUAL' : 'MODO ' + (data.formato || 'Libre').toUpperCase()}</span>
            ${etiquetaPrivado}
            <h3 style="font-size: 1.4rem; border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom:10px; ${esLiga ? 'color: gold;' : ''}">${data.nombre}</h3>
            <p style="font-size: 0.8rem; color: #888; margin-bottom: 8px;">Creado por: ${data.creador || 'Kage'}</p>
            <p style="margin-bottom: 8px; color: #ccc;"><i class="far fa-calendar-alt" style="color: ${badgeColor}; width: 20px;"></i> ${data.fecha || 'A definir'}</p>
            <p style="margin-bottom: 8px; color: #ccc;"><i class="fas fa-users" style="color: ${badgeColor}; width: 20px;"></i> Jugadores: ${inscritos} / ${cupos}</p>
            ${nombresPreview}
            <p style="margin-bottom: 15px; margin-top:10px; color: var(--green); font-weight: bold; background: rgba(57,255,20,0.1); padding: 5px; border-radius: 4px;"><i class="fas fa-trophy"></i> Premio: ${data.premio || 'A definir'}</p>
            <div style="display: flex; gap: 10px; margin-top: auto;">
                <button class="btn-primary" style="flex: 2; padding: 10px; background: ${btnColor}; color: ${colorBtnTex};" onclick="unirseTorneo('${id}', '${data.estado}')" ${estaLleno || yaInscrito || data.estado !== "abierto" ? 'disabled' : ''}>${btnTexto}</button>
                <button class="btn-secondary" style="flex: 1; padding: 10px; background: #222;" onclick="verLlaves('${id}', '${data.nombre}')"><i class="fas fa-sitemap"></i> Llaves</button>
            </div>
        </div>`;
}

function unirseTorneo(torneoId, estado) {
    if(estado !== "abierto") return;
    if(currentUserName === "Ninja Anónimo") { alert("Debes ingresar primero."); window.location.hash = "#modal-login"; return; }
    
    const torneoRef = db.collection('torneos').doc(torneoId);
    torneoRef.get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            const inscritos = data.lista_inscriptos ? data.lista_inscriptos.length : 0;
            if (inscritos >= data.cuposTotales) { alert("El evento ya está lleno."); }
            else {
                torneoRef.update({ lista_inscriptos: firebase.firestore.FieldValue.arrayUnion(currentUserName) }).then(() => alert("¡Inscripto exitosamente!"));
            }
        }
    });
}

// ==========================================
// ABISMO Y SALÓN DE LA FAMA
// ==========================================
function cargarVideosAbismo() {
    const lista = document.getElementById('lista-abismo');
    if(!lista) return;
    
    db.collection('abismo_videos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        lista.innerHTML = '';
        if(snap.empty) { lista.innerHTML = '<p style="color: #ccc; text-align: center; width: 100%;">El Abismo está en silencio. Sube una jugada.</p>'; return; }
        
        snap.forEach(doc => {
            const d = doc.data();
            let reproductorHTML = "";
            if(d.url && d.url.includes('embed')) {
                reproductorHTML = `<iframe src="${d.url}" style="width: 100%; height: 350px; border: none; border-radius: 8px;" allowfullscreen></iframe>`;
            } else {
                reproductorHTML = `<div style="height: 150px; display: flex; align-items: center; justify-content: center; background: #111; border-radius: 8px;"><a href="${d.urlCruda}" target="_blank" class="btn-secondary" style="text-decoration: none;"><i class="fas fa-external-link-alt"></i> Ver en TikTok</a></div>`;
            }
            
            let comentariosHTML = "";
            if (d.comentarios && d.comentarios.length > 0) {
                comentariosHTML = d.comentarios.slice(-3).map(c => `<div class="comentario-box"><strong style="color:var(--blue);">${c.usuario}:</strong> <span style="color:#ddd;">${c.texto}</span></div>`).join('');
            }
            
            lista.innerHTML += `
                <div class="container-glass" style="padding: 15px; border-color: var(--blue) !important;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; cursor: pointer;" onclick="abrirPerfil('${d.usuario}')">
                        <img src="https://ui-avatars.com/api/?name=${d.usuario}&background=random" style="width: 30px; border-radius: 50%; border: 1px solid var(--blue);">
                        <strong style="font-size: 0.9rem; color: white;">${d.usuario}</strong>
                    </div>
                    <div style="margin-bottom: 10px;">${reproductorHTML}</div>
                    <div style="display: flex; justify-content: space-between; border-top: 1px solid #333; padding-top: 10px;">
                        <button style="background: none; border: none; color: #ccc; cursor: pointer; font-size: 1.1rem;" onclick="darLikeVideo('${doc.id}', '${d.usuario}')"><i class="fas fa-heart" style="color: var(--red);"></i> <span style="font-size: 0.9rem; color:white;">${d.likes || 0}</span></button>
                    </div>
                    <div style="margin-top: 10px; border-top: 1px solid #222; padding-top: 10px;">
                        ${comentariosHTML}
                        <form class="comentario-input-group" onsubmit="comentarVideo(event, '${doc.id}', '${d.usuario}')">
                            <input type="text" id="coment-${doc.id}" class="comentario-input" placeholder="Agregar un comentario..." required>
                            <button type="submit" class="comentario-btn">Enviar</button>
                        </form>
                    </div>
                </div>`;
        });
    });
}

function darLikeVideo(videoId, autorVideo) {
    if(currentUserName === "Ninja Anónimo") return alert("Debes estar logueado para dar Like.");
    db.collection('abismo_videos').doc(videoId).update({ likes: firebase.firestore.FieldValue.increment(1) });
    if (autorVideo !== currentUserName) { enviarNotificacion(autorVideo, `A un ninja le gustó tu pergamino en el Abismo.`); }
}

function comentarVideo(e, videoId, autorVideo) {
    e.preventDefault();
    if(currentUserName === "Ninja Anónimo") return alert("Debes ingresar a la aldea para comentar.");
    const input = document.getElementById(`coment-${videoId}`);
    const texto = input.value.trim();
    if(!texto) return;
    
    db.collection('abismo_videos').doc(videoId).update({
        comentarios: firebase.firestore.FieldValue.arrayUnion({
            usuario: currentUserName, texto: texto, timestamp: new Date().getTime()
        })
    }).then(() => {
        input.value = "";
        if(autorVideo !== currentUserName) enviarNotificacion(autorVideo, `${currentUserName} comentó tu video en el Abismo.`);
    });
}

const formAbismo = document.getElementById('form-abismo');
if(formAbismo) {
    formAbismo.addEventListener('submit', (e) => {
        e.preventDefault();
        if(currentUserName === "Ninja Anónimo") return alert("Debes Ingresar.");
        const urlInput = document.getElementById('video-url').value.trim();
        let embedUrl = ""; let plataforma = "desconocida";
        
        if(urlInput.includes('youtube.com') || urlInput.includes('youtu.be')) {
            plataforma = "youtube";
            const id = extraerIdLimpio(urlInput, 'youtube'); embedUrl = `https://www.youtube.com/embed/${id}`;
        } else if(urlInput.includes('tiktok.com')) {
            plataforma = "tiktok";
            const id = extraerIdLimpio(urlInput, 'tiktok'); embedUrl = id ? `https://www.tiktok.com/embed/v2/${id}` : urlInput;
        } else { alert("El Abismo solo acepta pergaminos de YouTube o TikTok."); return; }
        
        db.collection('abismo_videos').add({
            usuario: currentUserName, url: embedUrl, urlCruda: urlInput, plataforma: plataforma, likes: 0, comentarios: [], timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => { alert("¡Pergamino publicado!"); formAbismo.reset(); });
    });
}

function cargarHallOfFame() {
    const podio = document.getElementById('podio-leyendas');
    if(!podio) return;
    db.collection('ninjas').where('torneosGanados', '>', 0).orderBy('torneosGanados', 'desc').limit(3).onSnapshot(snap => {
        if(snap.empty) { podio.innerHTML = '<p style="color: #666; width: 100%; text-align: center;">La historia recién comienza... ¿Quién será el primero en la cima?</p>'; return; }
        let leyendas = []; snap.forEach(doc => { leyendas.push(doc.data()); });
        podio.innerHTML = "";
        if (leyendas[1]) podio.innerHTML += crearCartaPodio(leyendas[1], 2);
        if (leyendas[0]) podio.innerHTML += crearCartaPodio(leyendas[0], 1);
        if (leyendas[2]) podio.innerHTML += crearCartaPodio(leyendas[2], 3);
    });
}

function crearCartaPodio(ninja, rank) {
    let imgSrc = ninja.fotoPerfil && ninja.fotoPerfil !== "" ? ninja.fotoPerfil : `https://ui-avatars.com/api/?name=${ninja.nick}&background=random`;
    let bordeEstilo = "";
    if(ninja.equipado && ninja.equipado.borde) { const b = CATALOGO_TIENDA.find(i => i.id === ninja.equipado.borde); if(b) bordeEstilo = b.estilo; }
    let corona = rank === 1 ? '<i class="fas fa-crown" style="color: gold; font-size: 1.5rem; position: absolute; top: -15px;"></i>' : '';
    return `
        <div class="podium-spot rank-${rank}" style="position: relative; cursor:pointer;" onclick="abrirPerfil('${ninja.nick}')">
            ${corona}
            <img src="${imgSrc}" style="${bordeEstilo}">
            <h4>${rank}° Lugar</h4>
            <h5>${ninja.nick}</h5>
            <p><i class="fas fa-trophy"></i> ${ninja.torneosGanados} Copas</p>
        </div>`;
}

// ==========================================
// GREMIO Y CHAT GLOBAL
// ==========================================
function cargarTopClanes() {
    const lista = document.getElementById('lista-top-clanes'); if(!lista) return;
    db.collection('clanes').orderBy('xp', 'desc').limit(5).onSnapshot(snap => {
        lista.innerHTML = "";
        if(snap.empty) { lista.innerHTML = "<p style='color:#666; text-align:center;'>Aún no hay escuadrones formados.</p>"; return; }
        let puesto = 1;
        snap.forEach(doc => {
            const d = doc.data();
            let color = "#333"; if(puesto === 1) color = "gold"; else if(puesto === 2) color = "silver"; else if(puesto === 3) color = "#cd7f32";
            lista.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.5); padding:12px; border-radius:5px; border-left:3px solid ${color}; margin-bottom: 8px;">
                    <div><strong style="color: white; font-size: 1.1rem;">${puesto}. ${d.nombre}</strong> <br> <span style="font-size:0.75rem; color:#888;"><i class="fas fa-users"></i> ${d.miembros.length} miembros</span></div>
                    <div style="color:gold; font-weight:bold; font-size:1rem;">${d.xp} XP</div>
                </div>`;
            puesto++;
        });
    });
}

function cargarAnunciosGremio() {
    const lista = document.getElementById('lista-anuncios'); if(!lista) return;
    db.collection('anuncios_gremio').orderBy('timestamp', 'desc').limit(15).onSnapshot(snap => {
        lista.innerHTML = "";
        if(snap.empty) { lista.innerHTML = "<p style='color:#888; text-align:center;'>El tablón está vacío.</p>"; return; }
        snap.forEach(doc => {
            const d = doc.data();
            lista.innerHTML += `
                <div style="background:rgba(0,0,0,0.5); padding:15px; border-radius:8px; border-left:3px solid var(--blue); margin-bottom:10px;">
                    <strong style="color:var(--blue); cursor:pointer;" onclick="abrirPerfil('${d.usuario}')"><i class="fas fa-user-ninja"></i> ${d.usuario}</strong>
                    <div style="margin-top: 8px; font-size: 0.9rem;">
                        <span style="color:#ccc;"><strong>Busca:</strong> ${d.busco}</span> | 
                        <span style="color:#ccc;"><strong>Ofrece:</strong> ${d.soy}</span>
                    </div>
                    <p style="color:#888; font-size:0.85rem; font-style:italic; margin-top:8px; border-top: 1px dashed #333; padding-top: 8px;">"${d.mensaje}"</p>
                </div>`;
        });
    });
}

const formAnuncio = document.getElementById('form-anuncio');
if(formAnuncio) {
    formAnuncio.addEventListener('submit', (e) => {
        e.preventDefault();
        if(currentUserName === "Ninja Anónimo") return;
        db.collection('anuncios_gremio').add({
            usuario: currentUserName, busco: document.getElementById('a-busco').value, soy: document.getElementById('a-soy').value,
            mensaje: document.getElementById('a-mensaje').value, timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => { formAnuncio.reset(); window.location.hash = '#gremio'; alert("Anuncio publicado."); });
    });
}

function escucharTabernaGlobal() {
    const chatContainer = document.getElementById('chat-messages-container');
    if(!chatContainer) return;
    db.collection('taberna').orderBy('timestamp').limit(100).onSnapshot(snap => {
        chatContainer.innerHTML = '';
        snap.forEach(doc => {
            const d = doc.data();
            let estiloNombre = "color: var(--blue);";
            if (d.colorEstilo !== "") {
                const itemCat = CATALOGO_TIENDA.find(i => i.id === d.colorEstilo);
                if(itemCat) estiloNombre = itemCat.estilo;
            }
            if (d.usuario === 'Matías' || d.usuario === 'Kage') { estiloNombre = "color: var(--red); text-shadow: 0 0 5px red;"; }
            
            chatContainer.innerHTML += `
                <div style="margin-bottom: 8px; border-bottom: 1px solid #111; padding-bottom: 5px; font-size:0.9rem;">
                    <strong style="${estiloNombre} margin-right: 5px; cursor:pointer;" onclick="abrirPerfil('${d.usuario}')">${d.usuario}:</strong> 
                    <span style="color:#ddd; word-break: break-all;">${d.texto}</span>
                </div>`;
        });
        chatContainer.scrollTop = chatContainer.scrollHeight;
    });

    const btnSend = document.getElementById('btn-send-chat');
    if(btnSend) {
        btnSend.addEventListener('click', () => {
            const input = document.getElementById('chat-input-text');
            if(input.value.trim() && currentUserName !== "Ninja Anónimo") {
                db.collection('taberna').add({ usuario: currentUserName, texto: input.value.trim(), colorEstilo: miEquipamiento.colorChat || '', timestamp: firebase.firestore.FieldValue.serverTimestamp() });
                input.value = '';
            } else if (currentUserName === "Ninja Anónimo") { alert("Debes identificarte primero."); }
        });
    }
}

// ==========================================
// LIBRO BINGO Y PERFILES
// ==========================================
function cargarTopIndividualBingo() {
    const lista = document.getElementById('ranking-dinamico');
    if(!lista) return;
    db.collection('ninjas').orderBy('xp', 'desc').limit(15).onSnapshot(snap => {
        lista.innerHTML = "";
        let puesto = 1;
        snap.forEach(doc => {
            const d = doc.data();
            let colorBorde = '#333'; if(puesto === 1) colorBorde = 'gold'; else if(puesto === 2) colorBorde = 'silver'; else if(puesto === 3) colorBorde = '#cd7f32';
            let colorNombre = 'var(--blue)';
            if(d.equipado && d.equipado.colorChat) { const itemColor = CATALOGO_TIENDA.find(i => i.id === d.equipado.colorChat); if(itemColor) colorNombre = itemColor.estilo; }
            
            lista.innerHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.5); padding: 10px 15px; border-radius: 5px; border-left: 3px solid ${colorBorde}; cursor: pointer; transition: 0.3s;" onclick="abrirPerfil('${d.nick}')">
                    <div><strong>${puesto}. <span style="${colorNombre.includes('color:') ? colorNombre : 'color:'+colorNombre}">${d.nick}</span></strong></div>
                    <div style="font-size: 0.8rem; color: #aaa; text-align: right;">${d.xp || 0} XP<br><span style="color: var(--green);"><i class="fas fa-coins"></i> ${d.ryos || 0}</span></div>
                </div>`;
            puesto++;
        });
    });
}

async function abrirPerfil(nick) {
    const modal = document.getElementById('modal-perfil');
    document.getElementById('perfil-nick').innerText = nick;
    const avatarImg = document.getElementById('perfil-avatar');
    
    avatarImg.src = `https://ui-avatars.com/api/?name=${nick}&background=random`;
    avatarImg.style = "width: 100px; height: 100px; object-fit: cover; border-radius: 50%; border: 2px solid #444; margin-bottom: 10px; transition: 0.3s; background: #111;";
    document.getElementById('perfil-rango').innerText = "Buscando...";
    document.getElementById('perfil-xp').innerText = "...";
    document.getElementById('perfil-campeonatos').innerText = "...";
    document.getElementById('perfil-clan').innerHTML = "";
    document.getElementById('perfil-comunidad').innerHTML = "";
    document.getElementById('perfil-pin-container').innerHTML = "";
    document.getElementById('perfil-bio').innerText = '"Un guerrero misterioso..."';
    document.getElementById('perfil-redes-container').innerHTML = "";
    
    const btnEditar = document.getElementById('btn-editar-perfil-container');
    if (nick === currentUserName && currentUserName !== "Ninja Anónimo") { btnEditar.style.display = 'block'; } else { btnEditar.style.display = 'none'; }
    
    window.location.hash = '#modal-perfil';
    
    try {
        const snapshot = await db.collection('ninjas').where('nick', '==', nick).get();
        if(!snapshot.empty) {
            const data = snapshot.docs[0].data();
            if(data.fotoPerfil && data.fotoPerfil !== "") { avatarImg.src = data.fotoPerfil; }
            if(data.bio && data.bio !== "") { document.getElementById('perfil-bio').innerText = `"${data.bio}"`; }
            if(data.redSocial && data.redSocial !== "") {
                document.getElementById('perfil-redes-container').innerHTML = `<a href="${data.redSocial}" target="_blank" style="color: var(--blue); text-decoration: none; font-size: 0.9rem; border: 1px solid var(--blue); padding: 5px 10px; border-radius: 5px; display: inline-block; margin-top: 10px;"><i class="fas fa-link"></i> Visitar Enlace</a>`;
            }
            
            document.getElementById('perfil-rango').innerText = (data.plan && data.plan !== 'genin') ? data.plan.toUpperCase() : (data.rango || 'Guerrero');
            if(data.plan === 'kasekage') document.getElementById('perfil-rango').style.color = "gold";
            
            document.getElementById('perfil-xp').innerText = `${data.xp || 0} XP`;
            document.getElementById('perfil-campeonatos').innerText = data.torneosGanados || 0;
            if(data.clan && data.clan !== "") { document.getElementById('perfil-clan').innerHTML = `<i class="fas fa-shield-alt"></i> Escuadrón: ${data.clan}`; }
            if(data.comunidad && data.comunidad !== "") { document.getElementById('perfil-comunidad').innerHTML = `<i class="fas fa-handshake"></i> Alianza: ${data.comunidad}`; }
            
            if(data.equipado) {
                if(data.equipado.borde) { const b = CATALOGO_TIENDA.find(i => i.id === data.equipado.borde); if(b) avatarImg.style = `width: 100px; height: 100px; object-fit: cover; border-radius: 50%; margin-bottom: 10px; transition: 0.3s; background: #111; ${b.estilo}`; }
                if(data.equipado.colorChat) { const c = CATALOGO_TIENDA.find(i => i.id === data.equipado.colorChat); if(c) document.getElementById('perfil-nick').style = `margin-bottom: 5px; transition: 0.3s; font-weight: bold; ${c.estilo}`; }
                if(data.equipado.pin) { const p = CATALOGO_TIENDA.find(i => i.id === data.equipado.pin); if(p) document.getElementById('perfil-pin-container').innerHTML = p.icon; }
            }
        }
    } catch(error) { console.error(error); }
}

const formEditarPerfil = document.getElementById('form-editar-perfil');
if(formEditarPerfil) {
    formEditarPerfil.addEventListener('submit', (e) => {
        e.preventDefault();
        db.collection('ninjas').doc(currentUserId).update({
            fotoPerfil: document.getElementById('edit-foto').value.trim(), bio: document.getElementById('edit-bio').value.trim(), redSocial: document.getElementById('edit-redes').value.trim()
        }).then(() => { alert("¡Perfil actualizado con éxito!"); document.getElementById('modal-editar-perfil').style.display = 'none'; abrirPerfil(currentUserName); });
    });
}

function abrirModalClan() {
    if (currentUserName === "Ninja Anónimo") { alert("Identifícate primero."); window.location.hash = "#modal-login"; return; }
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
    const nombre = document.getElementById('input-crear-clan').value.trim(); if(!nombre) return;
    db.collection('clanes').doc(nombre).get().then(doc => {
        if(doc.exists) { alert("Ese Escuadrón ya existe."); }
        else {
            db.collection('clanes').doc(nombre).set({ nombre: nombre, lider: currentUserName, miembros: [currentUserName], xp: 0, creacion: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { db.collection('ninjas').doc(currentUserId).update({ clan: nombre }); alert("¡Escuadrón formado!"); });
        }
    });
}
function unirseClan() {
    const nombre = document.getElementById('input-unirse-clan').value.trim(); if(!nombre) return;
    db.collection('clanes').doc(nombre).get().then(doc => {
        if(!doc.exists) { alert("El Escuadrón no existe."); }
        else { db.collection('clanes').doc(nombre).update({ miembros: firebase.firestore.FieldValue.arrayUnion(currentUserName) }).then(() => { db.collection('ninjas').doc(currentUserId).update({ clan: nombre }); alert("¡Te has unido al Escuadrón!"); }); }
    });
}
function abandonarClan() {
    if(confirm("¿Abandonar tu Escuadrón?")) {
        db.collection('clanes').doc(miClan).get().then(doc => {
            if(doc.exists) {
                const data = doc.data();
                if(data.lider === currentUserName && data.miembros.length > 1) { alert("Eres el líder. Debes nombrar a otro antes de salir o disolver el clan si están vacíos."); return; }
                if(data.miembros.length === 1) { db.collection('clanes').doc(miClan).delete(); }
                else { db.collection('clanes').doc(miClan).update({ miembros: firebase.firestore.FieldValue.arrayRemove(currentUserName) }); }
                db.collection('ninjas').doc(currentUserId).update({ clan: "" }).then(() => { document.getElementById('modal-clan').style.display='none'; alert("Has abandonado el Escuadrón."); });
            }
        });
    }
}

// ==========================================
// ADMIN Y CREADOR (CREACIÓN, LLAVES E INSCRIPCIÓN MANUAL)
// ==========================================
function escucharTicker() {
    db.collection('configuracion').doc('ticker').onSnapshot(doc => {
        if(doc.exists) { document.getElementById('ticker-contenido').innerHTML = `<span class="ticker-item"><i class="fas fa-bullhorn"></i> ALERTA: <span style="color: var(--blue);">${doc.data().mensaje}</span></span> <span class="ticker-item"><i class="fas fa-fire"></i> ¡La Arena está lista!</span>`; }
    });
}

function configurarAdminForms() {
    const formTicker = document.getElementById('form-config-ticker');
    if(formTicker) {
        formTicker.addEventListener('submit', (e) => {
            e.preventDefault();
            db.collection('configuracion').doc('ticker').set({ mensaje: document.getElementById('input-ticker').value, timestamp: firebase.firestore.FieldValue.serverTimestamp() }).then(() => alert("Alerta lanzada."));
        });
    }

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
                lista_inscriptos: [], estado: "abierto", timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => { formTorneo.reset(); alert("¡Evento publicado en la Arena!"); });
        });
    }

    const formBanco = document.getElementById('form-banco-kage');
    if(formBanco) {
        formBanco.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usuarioDestino = document.getElementById('banco-usuario').value.trim();
            const monto = parseInt(document.getElementById('banco-monto').value);
            try {
                const snapshot = await db.collection('ninjas').where('nick', '==', usuarioDestino).get();
                if(snapshot.empty) { alert("Ninja no encontrado."); return; }
                const docId = snapshot.docs[0].id;
                await db.collection('ninjas').doc(docId).update({ ryos: firebase.firestore.FieldValue.increment(monto) });
                alert(`Transferencia completada.`); enviarNotificacion(usuarioDestino, `El Kage te transfirió ${monto} Ryos.`); formBanco.reset();
            } catch(err) { alert("Error: " + err); }
        });
    }
}

// Gestión de Usuarios (SOLO ADMIN)
function banearUsuario() {
    const nick = document.getElementById('gestion-nick').value.trim(); if(!nick) return;
    if(confirm(`¿Expulsar a ${nick} permanentemente?`)) {
        db.collection('ninjas').where('nick', '==', nick).get().then(snap => {
            if(snap.empty) { alert("Ninja no encontrado."); return; }
            snap.docs[0].ref.update({ banned: true }).then(() => alert("Usuario expulsado."));
        });
    }
}
function gestionarPlan(planId) {
    const nick = document.getElementById('gestion-nick').value.trim(); if(!nick) return;
    db.collection('ninjas').where('nick', '==', nick).get().then(snap => {
        if(snap.empty) { alert("Ninja no encontrado."); return; }
        snap.docs[0].ref.update({ plan: planId }).then(() => {
            alert(`Plan ${planId} otorgado a ${nick}.`);
            enviarNotificacion(nick, `El Kage te ha ascendido a ${planId.toUpperCase()}. Disfruta tus beneficios.`);
        });
    });
}

async function limpiarTaberna() {
    if(!confirm("⚠️ ADVERTENCIA: Se borrarán TODOS los mensajes. ¿Proceder?")) return;
    try {
        const snap = await db.collection('taberna').get();
        if (snap.empty) { alert("Taberna vacía."); return; }
        const batch = db.batch(); snap.forEach(doc => { batch.delete(doc.ref); });
        await batch.commit(); alert("Taberna purgada.");
    } catch(e) { alert("Error: " + e.message); }
}

function mostrarTabAdmin(tabId) {
    const tabs = ['tab-torneos', 'tab-llaves-admin', 'tab-moderacion', 'tab-banco', 'tab-gestion'];
    tabs.forEach(t => { const el = document.getElementById(t); if(el) el.style.display = 'none'; });
    document.getElementById(tabId).style.display = 'block';
    const botones = document.querySelectorAll('#admin .btn-filter');
    botones.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// Control de Torneos desde Panel Creador/Kage
function cargarTorneosParaAdminLlaves() {
    const lista = document.getElementById('admin-lista-torneos-llaves'); 
    const esAdmin = (auth.currentUser?.email === ADMIN_EMAIL);
    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => { 
        lista.innerHTML = ''; 
        snap.forEach(doc => { 
            const d = doc.data(); const id = doc.id; 
            
            if(!esAdmin && d.creador !== currentUserName) return;

            let botonesHTML = ''; 
            const etiquetaTipo = d.tipo === 'liga' ? '<span style="color:gold;">[LIGA]</span>' : '<span style="color:var(--blue);">[TORNEO]</span>'; 
            if(d.estado === 'iniciado') { 
                botonesHTML = `<button class="btn-secondary" style="padding: 8px 15px; font-size: 0.8rem; margin-right: 5px;" onclick="abrirAdminPartidos('${id}', '${d.nombre}', '${d.creador}')">ADMINISTRAR</button> <button class="btn-primary" style="background: #444; padding: 8px 15px; font-size: 0.8rem;" onclick="generarLlaves('${id}', '${d.nombre}')">RE-GENERAR</button>`; 
            } else if (d.estado === 'finalizado') { 
                botonesHTML = `<span style="color: gold; font-weight: bold; margin-bottom: 5px; display: block;"><i class="fas fa-crown"></i> CAMPEÓN: ${d.campeon}</span>`; 
            } else { 
                botonesHTML = `<button class="btn-secondary" style="padding: 8px 15px; font-size: 0.8rem; margin-right: 5px;" onclick="abrirAdminPartidos('${id}', '${d.nombre}', '${d.creador}')">INSCRIPCIONES</button> <button class="btn-primary" style="background: var(--blue); color: black; padding: 8px 15px; font-size: 0.8rem; margin-bottom: 5px;" onclick="generarLlaves('${id}', '${d.nombre}')">GENERAR LLAVES</button>`; 
            } 
            lista.innerHTML += `<div style="display: flex; justify-content: space-between; align-items: center; background: #000; padding: 15px; border-radius: 8px; border: 1px solid #222; flex-wrap: wrap; gap: 10px;"><div style="flex: 1; min-width: 150px;"><strong>${etiquetaTipo} ${d.nombre}</strong> <br> <span style="font-size:0.7rem; color:#888;">${d.lista_inscriptos?.length || 0} inscritos</span></div><div style="display: flex; flex-direction: column; align-items: flex-end;">${botonesHTML}</div><div style="width: 100%; margin-top: 5px; border-top: 1px dashed #333; padding-top: 10px;"><button class="btn-secondary" style="background: transparent; color: var(--red); border: 1px solid var(--red); padding: 6px; font-size: 0.7rem; width: 100%;" onclick="borrarTorneo('${id}', '${d.nombre}')"><i class="fas fa-trash"></i> Eliminar Evento</button></div></div>`; 
        }); 
    });
}
function borrarTorneo(torneoId, torneoNombre) { if(confirm(`¿ELIMINAR "${torneoNombre}"?`)) { db.collection('torneos').doc(torneoId).delete().then(() => { alert("Evento borrado."); document.getElementById('contenedor-admin-partidos').innerHTML = ""; document.getElementById('btn-siguiente-ronda').style.display = "none"; }); } }
async function generarLlaves(torneoId, torneoNombre) { 
    if(!confirm(`¿Generar cruces para ${torneoNombre}? Cierra las inscripciones.`)) return; 
    const torneoRef = db.collection('torneos').doc(torneoId); const doc = await torneoRef.get(); const data = doc.data(); let jugadores = data.lista_inscriptos || []; 
    if(jugadores.length < 2) { alert("Mínimo 2 ninjas."); return; } 
    jugadores = jugadores.sort(() => Math.random() - 0.5); const partidos = []; 
    for (let i = 0; i < jugadores.length; i += 2) { if (jugadores[i + 1]) { partidos.push({ p1: jugadores[i], p2: jugadores[i + 1], ganador: "", ronda: 1 }); } else { partidos.push({ p1: jugadores[i], p2: "BYE", ganador: jugadores[i], ronda: 1 }); } } 
    const batch = db.batch(); const llavesRef = torneoRef.collection('llaves'); const viejas = await llavesRef.get(); viejas.forEach(v => batch.delete(v.ref)); 
    partidos.forEach((p, index) => { const newDoc = llavesRef.doc(`partido_${index + 1}`); batch.set(newDoc, p); }); 
    batch.update(torneoRef, { estado: "iniciado", campeon: "" }); await batch.commit(); 
    jugadores.forEach(j => { enviarNotificacion(j, `¡Los cruces están listos en "${torneoNombre}"!`); }); alert("¡Pergaminos de batalla repartidos!"); 
}
function abrirAdminPartidos(torneoId, torneoNombre, creador) { 
    document.getElementById('admin-partidos-titulo').innerText = `Gestión: ${torneoNombre}`; 
    window.location.hash = "#modal-admin-partidos"; 
    
    const secManual = document.getElementById('admin-inscripcion-manual');
    const esAdmin = (auth.currentUser?.email === ADMIN_EMAIL);
    if(creador === currentUserName || esAdmin) {
        secManual.style.display = 'block';
        document.getElementById('input-torneo-manual-id').value = torneoId;
    } else { secManual.style.display = 'none'; }

    db.collection('torneos').doc(torneoId).collection('llaves').orderBy('ronda', 'desc').onSnapshot(snap => { 
        const contenedor = document.getElementById('contenedor-admin-partidos'); const btnSiguiente = document.getElementById('btn-siguiente-ronda'); contenedor.innerHTML = ""; 
        if(snap.empty) { contenedor.innerHTML = "<p>Las llaves no se han generado aún. Puedes agregar jugadores arriba.</p>"; btnSiguiente.style.display = "none"; return; } 
        let rondaMaxima = 1; let partidosRondaActiva = []; let todosTienenGanador = true; 
        snap.forEach(doc => { const p = doc.data(); if(p.ronda > rondaMaxima) rondaMaxima = p.ronda; }); 
        snap.forEach(doc => { const p = doc.data(); if(p.ronda === rondaMaxima) { partidosRondaActiva.push({id: doc.id, ...p}); if(p.ganador === "") todosTienenGanador = false; } }); 
        contenedor.innerHTML = `<h4 style="color: var(--blue); margin-bottom: 10px;">RONDA ${rondaMaxima}</h4>`; 
        partidosRondaActiva.forEach(p => { 
            if(p.ganador !== "") { contenedor.innerHTML += `<div style="background: #111; padding: 10px; margin-bottom: 5px; border-radius: 5px; border-left: 3px solid var(--green);"><span style="color: #888;">${p.p1} vs ${p.p2}</span><br><strong style="color: var(--green);"><i class="fas fa-check"></i> Ganador: ${p.ganador}</strong></div>`; } 
            else if (p.reporte_pendiente) { 
                let pruebaHtml = p.reporte_pendiente.prueba !== 'Sin link' && p.reporte_pendiente.prueba !== 'No adjuntada (Revisar WS)' ? `<a href="${p.reporte_pendiente.prueba}" target="_blank" style="color: var(--blue); font-size: 0.8rem; text-decoration: underline;">Ver Captura</a>` : `<span style="color: #888; font-size: 0.8rem;">Sin captura</span>`; 
                contenedor.innerHTML += `<div style="background: #111; padding: 10px; margin-bottom: 10px; border-radius: 5px; border: 1px solid gold;"><div style="margin-bottom: 5px; font-weight: bold; text-align: center;">${p.p1} <span style="color:var(--red);">VS</span> ${p.p2}</div><div style="background: rgba(255, 215, 0, 0.1); padding: 8px; border-radius: 5px; margin-bottom: 10px; font-size: 0.9rem;"><i class="fas fa-exclamation-triangle" style="color: gold;"></i> <strong>${p.reporte_pendiente.reportadoPor}</strong> reportó victoria para:<br><span style="color: var(--green); font-weight: bold; font-size: 1.1rem;">${p.reporte_pendiente.ganadorPropuesto}</span><br>${pruebaHtml}</div><div style="display: flex; gap: 5px;"><button class="btn-primary" style="flex: 2; padding: 5px; font-size:0.8rem; background: var(--green); color: black;" onclick="setGanador('${torneoId}', '${p.id}', '${p.reporte_pendiente.ganadorPropuesto}')">APROBAR REPORTE</button><button class="btn-secondary" style="flex: 1; padding: 5px; font-size:0.8rem; background: var(--red); color: white; border: none;" onclick="rechazarReporte('${torneoId}', '${p.id}')">Rechazar</button></div></div>`; 
            } else { 
                contenedor.innerHTML += `<div style="background: #111; padding: 10px; margin-bottom: 10px; border-radius: 5px; border: 1px solid var(--blue);"><div style="margin-bottom: 10px; font-weight: bold; text-align: center;">${p.p1} <span style="color:var(--red);">VS</span> ${p.p2}</div><p style="text-align: center; font-size: 0.7rem; color: #888; margin-bottom: 5px;">Esperando reporte...</p><div style="display: flex; gap: 5px;"><button class="btn-secondary" style="flex: 1; padding: 5px; font-size:0.8rem;" onclick="setGanador('${torneoId}', '${p.id}', '${p.p1}')">Forzar: ${p.p1}</button><button class="btn-secondary" style="flex: 1; padding: 5px; font-size:0.8rem;" onclick="setGanador('${torneoId}', '${p.id}', '${p.p2}')">Forzar: ${p.p2}</button></div></div>`; 
            } 
        }); 
        if(todosTienenGanador) { btnSiguiente.style.display = "block"; btnSiguiente.onclick = () => generarSiguienteRonda(torneoId, rondaMaxima, partidosRondaActiva); } else { btnSiguiente.style.display = "none"; } 
    }); 
}

function inscribirJugadorManual() {
    const nick = document.getElementById('input-inscribir-manual').value.trim();
    const tId = document.getElementById('input-torneo-manual-id').value;
    if(!nick || !tId) return;
    db.collection('torneos').doc(tId).update({ lista_inscriptos: firebase.firestore.FieldValue.arrayUnion(nick) }).then(() => {
        alert(`${nick} añadido al torneo.`); document.getElementById('input-inscribir-manual').value = "";
    });
}

function setGanador(torneoId, partidoId, ganador) { if(confirm(`¿Confirma que ${ganador} avanza?`)) { db.collection('torneos').doc(torneoId).collection('llaves').doc(partidoId).update({ ganador: ganador, reporte_pendiente: firebase.firestore.FieldValue.delete() }).then(() => { enviarNotificacion(ganador, "El Juez aprobó el reporte. ¡Avanzas de ronda!"); }); } }
function rechazarReporte(torneoId, partidoId) { if(confirm("¿Rechazar reporte?")) { db.collection('torneos').doc(torneoId).collection('llaves').doc(partidoId).update({ reporte_pendiente: firebase.firestore.FieldValue.delete() }); } }
async function generarSiguienteRonda(torneoId, rondaActual, partidos) {
    const ganadores = partidos.map(p => p.ganador);
    if(ganadores.length === 1) {
        const campeon = ganadores[0]; await db.collection('torneos').doc(torneoId).update({ estado: 'finalizado', campeon: campeon });
        db.collection('ninjas').where('nick', '==', campeon).get().then(snap => {
            if(!snap.empty) { 
                const docId = snap.docs[0].id; const userData = snap.docs[0].data(); 
                db.collection('ninjas').doc(docId).update({ xp: firebase.firestore.FieldValue.increment(100), ryos: firebase.firestore.FieldValue.increment(500), torneosGanados: firebase.firestore.FieldValue.increment(1) }); 
                if(userData.clan && userData.clan !== "") { db.collection('clanes').doc(userData.clan).update({ xp: firebase.firestore.FieldValue.increment(100) }); } 
            }
        });
        enviarNotificacion(campeon, `¡ERES EL CAMPEÓN! Recibiste +100 XP, +500 Ryos y 1 Copa.`); alert(`¡EVENTO FINALIZADO! Campeón: ${campeon}.`); window.location.hash = "#admin"; return;
    }
    const nuevosPartidos = []; for (let i = 0; i < ganadores.length; i += 2) { if (ganadores[i + 1]) { nuevosPartidos.push({ p1: ganadores[i], p2: ganadores[i + 1], ganador: "", ronda: rondaActual + 1 }); } else { nuevosPartidos.push({ p1: ganadores[i], p2: "BYE", ganador: ganadores[i], ronda: rondaActual + 1 }); } } 
    const batch = db.batch(); const llavesRef = db.collection('torneos').doc(torneoId).collection('llaves'); const time = new Date().getTime(); 
    nuevosPartidos.forEach((p, index) => { const newDoc = llavesRef.doc(`partido_r${rondaActual + 1}_${index}_${time}`); batch.set(newDoc, p); }); await batch.commit(); 
    ganadores.forEach(g => { enviarNotificacion(g, `La Ronda ${rondaActual + 1} ha sido generada. ¡Prepárate!`); }); alert(`¡Ronda ${rondaActual + 1} generada!`);
}
function verLlaves(torneoId, torneoNombre) { 
    document.getElementById('llaves-titulo').innerText = `Llaves: ${torneoNombre}`; const contenedor = document.getElementById('contenedor-llaves-texto'); const contenedorCampeon = document.getElementById('contenedor-campeon'); 
    contenedor.innerHTML = '<p style="color: #888;">Leyendo pergaminos...</p>'; contenedorCampeon.innerHTML = ''; window.location.hash = "#modal-llaves"; 
    db.collection('torneos').doc(torneoId).get().then(doc => { if(doc.exists && doc.data().estado === 'finalizado') { contenedorCampeon.innerHTML = `<div style="background: rgba(255, 215, 0, 0.1); border: 1px solid gold; padding: 15px; text-align: center; border-radius: 8px; margin-bottom: 20px;"><h4 style="color: gold; margin-bottom: 5px;"><i class="fas fa-crown"></i> GRAN CAMPEÓN</h4><strong style="font-size: 1.5rem; cursor:pointer;" onclick="abrirPerfil('${doc.data().campeon}')">${doc.data().campeon}</strong></div>`; } }); 
    db.collection('torneos').doc(torneoId).collection('llaves').orderBy('ronda', 'asc').onSnapshot(snap => { 
        if(snap.empty) { contenedor.innerHTML = '<p style="color: var(--red);">El Juez aún no generó los cruces.</p>'; return; } 
        contenedor.innerHTML = ""; let currentRonda = 0; 
        snap.forEach(doc => { 
            const p = doc.data(); 
            if (p.ronda !== currentRonda) { contenedor.innerHTML += `<div style="font-weight:bold; color:var(--blue); margin-top:20px; border-bottom:1px solid #333; padding-bottom:5px;">RONDA ${p.ronda}</div>`; currentRonda = p.ronda; } 
            const colorP1 = p.ganador === p.p1 ? 'color: var(--green); font-weight: bold;' : (p.ganador !== "" ? 'color: #555; text-decoration: line-through;' : 'color: white;'); 
            const colorP2 = p.ganador === p.p2 ? 'color: var(--green); font-weight: bold;' : (p.ganador !== "" && p.p2 !== "BYE" ? 'color: #555; text-decoration: line-through;' : 'color: white;'); 
            let botonAccionHTML = ""; 
            if (p.ganador === "" && p.p2 !== "BYE") { 
                if (p.reporte_pendiente) { botonAccionHTML = `<div style="font-size: 0.7rem; color: gold; text-align: center; margin-top: 8px; border-top: 1px dashed #333; padding-top: 5px;"><i class="fas fa-clock"></i> Revisión pendiente...</div>`; } 
                else if (currentUserName !== "Ninja Anónimo" && (currentUserName === p.p1 || currentUserName === p.p2)) { botonAccionHTML = `<div style="text-align: center; margin-top: 8px; border-top: 1px dashed #333; padding-top: 5px;"><button class="btn-primary" style="padding: 4px 10px; font-size: 0.7rem; background: var(--blue); color: black;" onclick="abrirModalReporte('${torneoId}', '${doc.id}', '${p.p1}', '${p.p2}')"><i class="fas fa-flag"></i> Cargar Resultado</button></div>`; } 
            } 
            contenedor.innerHTML += `<div style="background: #111; padding: 12px; margin-top: 10px; border-radius: 5px; border: 1px solid #222;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="${colorP1}; cursor:pointer;" onclick="abrirPerfil('${p.p1}')">${p.p1}</span><span style="color: #444; font-size: 0.8rem; font-weight: bold;">VS</span><span style="${colorP2}; cursor:pointer;" onclick="abrirPerfil('${p.p2}')">${p.p2}</span></div>${botonAccionHTML}</div>`; 
        }); 
    }); 
}
function abrirModalReporte(torneoId, partidoId, p1, p2) { document.getElementById('rep-torneo-id').value = torneoId; document.getElementById('rep-partido-id').value = partidoId; document.getElementById('rep-ganador').innerHTML = `<option value="" disabled selected>Selecciona al ganador...</option><option value="${p1}">${p1}</option><option value="${p2}">${p2}</option>`; document.getElementById('modal-reporte').style.display = 'flex'; }
const formReporte = document.getElementById('form-reporte');
if(formReporte) {
    formReporte.addEventListener('submit', (e) => {
        e.preventDefault(); const tId = document.getElementById('rep-torneo-id').value; const pId = document.getElementById('rep-partido-id').value; const ganador = document.getElementById('rep-ganador').value; const prueba = document.getElementById('rep-prueba').value.trim() || 'No adjuntada (Revisar WS)'; 
        db.collection('torneos').doc(tId).collection('llaves').doc(pId).update({ reporte_pendiente: { reportadoPor: currentUserName, ganadorPropuesto: ganador, prueba: prueba } }).then(() => { alert("Reporte enviado al Juez."); document.getElementById('modal-reporte').style.display = 'none'; window.location.hash = "#modal-llaves"; }); 
    });
}

// Lógica de Notificaciones
function enviarNotificacion(paraUsuario, mensaje) { if (!paraUsuario || paraUsuario === "Ninja Anónimo") return; db.collection('notificaciones').add({ para: paraUsuario, texto: mensaje, leida: false, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); }
function escucharNotificaciones() {
    const badge = document.getElementById('notif-badge'); const contenedorHTML = document.getElementById('lista-notificaciones-contenido'); if(!badge || !contenedorHTML) return;
    db.collection('notificaciones').where('para', '==', currentUserName).orderBy('timestamp', 'desc').onSnapshot(snap => {
        let noLeidas = 0; contenedorHTML.innerHTML = "";
        if(snap.empty) { contenedorHTML.innerHTML = '<p style="color:#888; text-align:center;">No hay avisos.</p>'; badge.style.display = 'none'; return; }
        snap.forEach(doc => { const data = doc.data(); if(!data.leida) noLeidas++; const bg = data.leida ? '#0a0a0f' : '#1a1a24'; const border = data.leida ? '1px solid #222' : '1px solid var(--blue)'; contenedorHTML.innerHTML += `<div style="background: ${bg}; border: ${border}; padding: 10px; border-radius: 5px; margin-bottom: 8px; font-size: 0.85rem;"><i class="fas fa-envelope" style="color: var(--blue); margin-right: 5px;"></i> ${data.texto}</div>`; });
        if(noLeidas > 0) { badge.innerText = noLeidas; badge.style.display = 'inline-block'; } else { badge.style.display = 'none'; }
    });
}
function abrirNotificaciones(e) {
    e.preventDefault(); document.getElementById('modal-notificaciones').style.display = 'flex';
    db.collection('notificaciones').where('para', '==', currentUserName).where('leida', '==', false).get().then(snap => { const batch = db.batch(); snap.forEach(doc => { batch.update(doc.ref, { leida: true }); }); batch.commit(); });
}

function cerrarModalPerfil(e) { if(e) e.preventDefault(); history.back(); }
function cerrarSesion() { auth.signOut().then(() => window.location.reload()); }
function abrirModalAnuncio(e) { if(e) e.preventDefault(); if(currentUserName === "Ninja Anónimo") { alert("Debes Ingresar."); window.location.hash = "#modal-login"; } else { window.location.hash = "#modal-anuncio"; } }

function cambiarStreamLocal(plataforma, usuarioFuerza = null) {
    const iframe = document.getElementById('stream-frame'); const botones = document.querySelectorAll('.plat-btn');
    let canalAUsar = usuarioFuerza ? usuarioFuerza : 'matias_mj7'; const currentDomain = window.location.hostname; let finalSrc = "";
    if (plataforma === 'twitch') { finalSrc = `https://player.twitch.tv/?channel=${canalAUsar}&parent=${currentDomain}`; } else if (plataforma === 'youtube') { finalSrc = `https://www.youtube.com/embed/${canalAUsar}?autoplay=1`; } else if (plataforma === 'kick') { finalSrc = `https://player.kick.com/${canalAUsar}`; } else if (plataforma === 'tiktok') { finalSrc = `https://www.tiktok.com/embed/v2/${canalAUsar}`; }
    if(iframe) iframe.src = finalSrc;
    botones.forEach(btn => { btn.style.background = '#111'; btn.style.color = 'white'; btn.style.border = '1px solid #444'; });
    let btnActivo = Array.from(botones).find(b => b.innerText.toLowerCase() === plataforma.toLowerCase());
    if(btnActivo) {
        if (plataforma === 'twitch') { btnActivo.style.background = 'var(--blue)'; btnActivo.style.color = '#000'; btnActivo.style.border = 'none';}
        if (plataforma === 'youtube') { btnActivo.style.background = 'var(--red)'; btnActivo.style.color = '#fff'; btnActivo.style.border = 'none';}
        if (plataforma === 'kick') { btnActivo.style.background = 'var(--green)'; btnActivo.style.color = '#000'; btnActivo.style.border = 'none';}
        if (plataforma === 'tiktok') { btnActivo.style.background = '#ff0050'; btnActivo.style.color = '#fff'; btnActivo.style.border = 'none';}
    }
}
function extraerIdLimpio(urlCruda, plataforma) {
    let id = urlCruda.trim();
    try { if (plataforma === 'twitch') { if (id.includes('twitch.tv/')) id = id.split('twitch.tv/')[1].split('?')[0].replace('/', ''); } else if (plataforma === 'youtube') { if (id.includes('v=')) id = id.split('v=')[1].split('&')[0]; else if (id.includes('youtu.be/')) id = id.split('youtu.be/')[1].split('?')[0]; else if (id.includes('/live/')) id = id.split('/live/')[1].split('?')[0]; } else if (plataforma === 'kick') { if (id.includes('kick.com/')) id = id.split('kick.com/')[1].split('?')[0].replace('/', ''); } else if (plataforma === 'tiktok') { if (id.includes('/video/')) id = id.split('/video/')[1].split('?')[0]; } } catch(e) {} return id;
}
