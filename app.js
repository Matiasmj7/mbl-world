// ==========================================
// REGISTRO DE SERVICE WORKER (PWA)
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('App lista para instalarse. Scope:', registration.scope);
            })
            .catch(error => {
                console.log('Error en Service Worker:', error);
            });
    });
}

// ==========================================
// SKELETON LOADERS (estado de carga visual)
// Pinta bloques animados mientras Firestore trae
// los datos reales. En cuanto llega la data, cada
// función de carga sobrescribe este contenido con
// el innerHTML de siempre — no reemplaza lógica,
// solo lo que se ve un instante antes de tener data.
// ==========================================
function mostrarSkeleton(elemento, tipo = 'card', cantidad = 3) {
    if (!elemento) return;
    let piezas = '';
    for (let i = 0; i < cantidad; i++) {
        if (tipo === 'linea') {
            piezas += `
                <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 5px; margin-bottom: 5px; display:flex; justify-content:space-between; gap:15px;">
                    <div class="skeleton skeleton-line" style="width: 55%; margin-bottom:0;"></div>
                    <div class="skeleton skeleton-line" style="width: 20%; margin-bottom:0;"></div>
                </div>
            `;
        } else if (tipo === 'podio') {
            piezas += `<div class="skeleton skeleton-card" style="height: 200px; width: 150px; border-radius: 10px 10px 0 0;"></div>`;
        } else {
            piezas += `<div class="skeleton skeleton-card"></div>`;
        }
    }
    elemento.innerHTML = piezas;
}

// ==========================================
// LIGAS: TABLA DE POSICIONES
// A diferencia de un Torneo (eliminación directa
// por llaves), una Liga es "todos contra todos":
// se calculan puntos a partir de los resultados
// ya cargados, sin importar el orden en que llegan.
// Como en Mobile Legends un partido siempre tiene
// un ganador (no hay empates), sumamos 3 puntos
// por victoria y 0 por derrota — igual criterio
// que usan la mayoría de ligas deportivas.
// ==========================================
function calcularTablaPosiciones(partidos) {
    const stats = {};
    const asegurar = (nombre) => {
        if (!stats[nombre]) stats[nombre] = { nombre, jugados: 0, ganados: 0, perdidos: 0, puntos: 0 };
        return stats[nombre];
    };

    partidos.forEach(partido => {
        if (!partido.p1 || !partido.p2 || partido.p2 === "BYE") return;
        asegurar(partido.p1);
        asegurar(partido.p2);
        if (partido.ganador) {
            const perdedor = (partido.ganador === partido.p1) ? partido.p2 : partido.p1;
            stats[partido.ganador].jugados++;
            stats[partido.ganador].ganados++;
            stats[partido.ganador].puntos += 3;
            if (stats[perdedor]) {
                stats[perdedor].jugados++;
                stats[perdedor].perdidos++;
            }
        }
    });

    return Object.values(stats).sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        if (b.ganados !== a.ganados) return b.ganados - a.ganados;
        return a.nombre.localeCompare(b.nombre);
    });
}

function generarTablaPosicionesHTML(tabla) {
    if (tabla.length === 0) {
        return "<p style='text-align:center; color:#ccc;'>Todavía no hay partidos cargados.</p>";
    }

    const filas = tabla.map((fila, index) => {
        const esLider = index === 0;
        return `
            <tr style="${esLider ? 'background: rgba(255,215,0,0.08);' : ''}">
                <td style="padding:8px; text-align:center; color:${esLider ? 'gold' : '#aaa'}; font-weight:bold;">${index + 1}</td>
                <td style="padding:8px; color:white; font-weight:${esLider ? 'bold' : 'normal'};">${esLider ? '<i class="fas fa-crown" style="color:gold;"></i> ' : ''}${fila.nombre}</td>
                <td style="padding:8px; text-align:center; color:#ccc;">${fila.jugados}</td>
                <td style="padding:8px; text-align:center; color:var(--green);">${fila.ganados}</td>
                <td style="padding:8px; text-align:center; color:var(--red);">${fila.perdidos}</td>
                <td style="padding:8px; text-align:center; color:var(--blue); font-weight:bold;">${fila.puntos}</td>
            </tr>
        `;
    }).join("");

    return `
        <div style="overflow-x:auto; margin-bottom: 25px;">
            <table style="width:100%; border-collapse: collapse; min-width: 420px;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--blue);">
                        <th style="padding:8px; font-size:0.75rem; color:#888; text-transform:uppercase;">#</th>
                        <th style="padding:8px; font-size:0.75rem; color:#888; text-transform:uppercase; text-align:left;">Jugador / Equipo</th>
                        <th style="padding:8px; font-size:0.75rem; color:#888; text-transform:uppercase;">PJ</th>
                        <th style="padding:8px; font-size:0.75rem; color:#888; text-transform:uppercase;">PG</th>
                        <th style="padding:8px; font-size:0.75rem; color:#888; text-transform:uppercase;">PP</th>
                        <th style="padding:8px; font-size:0.75rem; color:#888; text-transform:uppercase;">PTS</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </div>
    `;
}

// Ficha de un partido para el panel de admin (Tribunal Kage). Se usa tanto
// para Torneos (donde se agrupa por ronda) como para Ligas (lista plana),
// para no repetir el mismo bloque de HTML dos veces.
function generarFilaAdminPartidoHTML(torneoId, partido, partidoId, mostrarRonda) {
    let accionHtml = "";
    if (partido.ganador) {
        accionHtml = `<span style="color:var(--green); font-weight:bold;"><i class="fas fa-check"></i> ${partido.ganador}</span>`;
    } else {
        accionHtml = `
            <button class="btn-secondary" style="padding: 5px 10px; font-size: 0.8rem; margin-right:5px;" onclick="setGanadorManual('${torneoId}', '${partidoId}', '${partido.p1}')">Gana ${partido.p1}</button>
            <button class="btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="setGanadorManual('${torneoId}', '${partidoId}', '${partido.p2}')">Gana ${partido.p2}</button>
        `;
    }

    let reporteHtml = "";
    if (partido.reporte) {
        reporteHtml = `
            <div style="background: rgba(255,215,0,0.1); padding: 10px; margin-top: 10px; border: 1px dashed gold; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                <span style="color:gold; font-size:0.85rem;"><i class="fas fa-exclamation-circle"></i> <strong>${partido.reporte.reportadoPor}</strong> reportó victoria de: <strong>${partido.reporte.ganador}</strong></span>
                <a href="${partido.reporte.capturaUrl}" target="_blank" class="btn-primary" style="padding: 5px 10px; font-size: 0.75rem; background: gold; color: black;"><i class="fas fa-image"></i> VER PRUEBA</a>
            </div>
        `;
    }

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

    const rondaLabel = mostrarRonda ? `<span style="color:#aaa; font-size:0.8rem; display:block; margin-bottom:5px;">Ronda ${partido.ronda}</span>` : "";

    return `
        <div style="background: rgba(0,0,0,0.5); border: 1px solid var(--blue); padding: 15px; border-radius: 8px; margin-bottom: 10px; margin-top:5px;">
            ${rondaLabel}
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color:white; font-size:1.1rem; font-weight:bold;">${partido.p1} <span style="color:#666;">VS</span> ${partido.p2}</span>
                <div>${accionHtml}</div>
            </div>
            ${reporteHtml}
            ${salaHtml}
        </div>
    `;
}

// Suma 1 a "torneosJugados" (participación, no victorias) cada vez que un
// ninja se inscribe a un torneo o liga, sin importar cómo se haya inscrito.
async function sumarTorneoJugado(nick) {
    if (!nick) return;
    const ninjaSnap = await db.collection('ninjas').where('nick', '==', nick).get();
    if (!ninjaSnap.empty) {
        ninjaSnap.docs[0].ref.update({
            torneosJugados: firebase.firestore.FieldValue.increment(1)
        });
    }
}

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

// VARIABLES NEXUS STORE
let nexusWhatsapp = "+5492920279201";
let nexusCBU = "0000003100021643816388";
let nexusTitular = "Bruno Jaramillo";

// ==========================================
// MOTOR ELO / MMR (individual)
// ==========================================
// Fórmula Elo estándar (la misma que usa ajedrez/LoL/CS a alto nivel):
// - Cada jugador arranca en ELO_INICIAL.
// - Antes del partido se calcula el "esperado" de cada lado según la
//   diferencia de ELO. Si le ganás a alguien con más ELO que vos, tu
//   "esperado" era bajo -> ganás más puntos. Si le ganás a alguien con
//   menos ELO, tu esperado ya era alto -> ganás pocos puntos.
// - ELO_K controla cuánto se mueve el número por partido (32 es un
//   estándar razonable; más alto = más volátil, más bajo = más estable).
const ELO_INICIAL = 1200;
const ELO_K = 32;

function calcularNuevoElo(miElo, eloRival, gane) {
    const esperado = 1 / (1 + Math.pow(10, (eloRival - miElo) / 400));
    const resultado = gane ? 1 : 0;
    return Math.round(miElo + ELO_K * (resultado - esperado));
}

// Para partidos de equipo (2v2/3v3/5v5) no hay todavía un ELO de equipo
// separado (eso es la Fase 2 - ELO de equipos/clanes). Mientras tanto,
// cada jugador individual se enfrenta "contra el promedio de ELO del
// equipo rival", así el mecanismo de "ganarle a más fuertes da más
// puntos" también aplica en formatos por equipo.
async function obtenerEloPromedioEquipo(nicks) {
    let total = 0, count = 0;
    for (const nick of nicks) {
        const snap = await db.collection('ninjas').where('nick', '==', nick).get();
        if (!snap.empty) {
            total += snap.docs[0].data().elo || ELO_INICIAL;
            count++;
        }
    }
    return count > 0 ? total / count : ELO_INICIAL;
}

// Usa una transacción para evitar condiciones de carrera si dos partidos
// del mismo jugador se cierran casi al mismo tiempo.
async function actualizarEloJugador(nick, eloRival, gane) {
    const snap = await db.collection('ninjas').where('nick', '==', nick).get();
    if (snap.empty) return;
    const ref = snap.docs[0].ref;

    await db.runTransaction(async (t) => {
        const doc = await t.get(ref);
        if (!doc.exists) return;
        const eloActual = doc.data().elo || ELO_INICIAL;
        const nuevoElo = calcularNuevoElo(eloActual, eloRival, gane);
        const historial = doc.data().eloHistorial || [];
        historial.push({ fecha: Date.now(), elo: nuevoElo, delta: nuevoElo - eloActual });

        t.update(ref, {
            elo: nuevoElo,
            eloHistorial: historial.slice(-20) // guardamos solo los últimos 20 movimientos
        });
    });
}

// Actualiza el ELO de un clan directamente (el id del doc en Firestore
// ES el nombre del clan, así que no hace falta query, a diferencia del
// ELO individual que busca por campo 'nick').
async function actualizarEloClan(nombreClan, eloRival, gane) {
    const ref = db.collection('clanes').doc(nombreClan);
    await db.runTransaction(async (t) => {
        const doc = await t.get(ref);
        if (!doc.exists) return;
        const eloActual = doc.data().elo || ELO_INICIAL;
        const nuevoElo = calcularNuevoElo(eloActual, eloRival, gane);
        t.update(ref, { elo: nuevoElo });
    });
}

async function obtenerEloClan(nombreClan) {
    const doc = await db.collection('clanes').doc(nombreClan).get();
    return doc.exists ? (doc.data().elo || ELO_INICIAL) : null;
}

// Si el "equipo" que jugó un partido de torneo coincide en nombre con un
// clan persistente registrado en la aldea, movemos el ELO de ese clan
// también (1 vs 1 entre clanes, sin promediar). Si el equipo no coincide
// con ningún clan (fue armado solo para ese torneo), simplemente no pasa
// nada — no hay clan al que actualizarle nada.
async function actualizarEloEquipoPersistente(nombreEquipo, eloRival, gane) {
    const ref = db.collection('equipos_persistentes').doc(nombreEquipo);
    await db.runTransaction(async (t) => {
        const doc = await t.get(ref);
        if (!doc.exists) return;
        const eloActual = doc.data().elo || ELO_INICIAL;
        const nuevoElo = calcularNuevoElo(eloActual, eloRival, gane);
        t.update(ref, {
            elo: nuevoElo,
            partidasJugadas: firebase.firestore.FieldValue.increment(1),
            partidasGanadas: firebase.firestore.FieldValue.increment(gane ? 1 : 0)
        });
    });
}

async function obtenerEloEquipoPersistente(nombreEquipo) {
    const doc = await db.collection('equipos_persistentes').doc(nombreEquipo).get();
    return doc.exists ? (doc.data().elo || ELO_INICIAL) : null;
}

async function actualizarEloClanesSiCorresponde(nombreEquipoGanador, nombreEquipoPerdedor) {
    const eloClanGanador = await obtenerEloClan(nombreEquipoGanador);
    const eloClanPerdedor = await obtenerEloClan(nombreEquipoPerdedor);

    if (eloClanGanador !== null && eloClanPerdedor !== null) {
        await actualizarEloClan(nombreEquipoGanador, eloClanPerdedor, true);
        await actualizarEloClan(nombreEquipoPerdedor, eloClanGanador, false);
    } else if (eloClanGanador !== null) {
        await actualizarEloClan(nombreEquipoGanador, ELO_INICIAL, true);
    } else if (eloClanPerdedor !== null) {
        await actualizarEloClan(nombreEquipoPerdedor, ELO_INICIAL, false);
    }

    const eloEqGanador = await obtenerEloEquipoPersistente(nombreEquipoGanador);
    const eloEqPerdedor = await obtenerEloEquipoPersistente(nombreEquipoPerdedor);

    if (eloEqGanador !== null && eloEqPerdedor !== null) {
        await actualizarEloEquipoPersistente(nombreEquipoGanador, eloEqPerdedor, true);
        await actualizarEloEquipoPersistente(nombreEquipoPerdedor, eloEqGanador, false);
    } else if (eloEqGanador !== null) {
        await actualizarEloEquipoPersistente(nombreEquipoGanador, ELO_INICIAL, true);
    } else if (eloEqPerdedor !== null) {
        await actualizarEloEquipoPersistente(nombreEquipoPerdedor, ELO_INICIAL, false);
    }
}

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
    { id: 'pin_mitico', nombre: 'Pin Mítico', tipo: 'pin', precio: 500, desc: 'Insignia élite.', icon: '<i class="fas fa-dragon" style="color: #ff0007f; filter: drop-shadow(0 0 5px #ff007f);"></i>' },
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
                    if (document.getElementById('mi-elo-bingo')) document.getElementById('mi-elo-bingo').innerText = `${data.elo || ELO_INICIAL} ELO`;

                    const pj = data.partidasJugadas || 0;
                    const pg = data.partidasGanadas || 0;
                    const wr = pj > 0 ? Math.round((pg / pj) * 100) : 0;
                    if (document.getElementById('mi-stats-bingo')) document.getElementById('mi-stats-bingo').innerText = `${pj} PJ / ${pg} PG`;
                    if (document.getElementById('mi-winrate-bingo')) document.getElementById('mi-winrate-bingo').innerText = `${wr}% WR`;
                    if (document.getElementById('mi-avatar-bingo')) {
                        document.getElementById('mi-avatar-bingo').src = (data.fotoPerfil && data.fotoPerfil !== '') ? data.fotoPerfil : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserName)}&background=random`;
                    }

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

                    const esNexusManager = data.esNexusManager === true;

                    if(esAdmin || miPlan === 'jonin' || miPlan === 'kasekage' || esNexusManager) {
                        if(adminNav) adminNav.style.display = 'block';
                        if(adminSection) adminSection.style.display = 'block';

                        document.getElementById('titulo-panel-admin').innerText = esAdmin ? 'Centro de Mando del Creador' : (esNexusManager && miPlan === 'genin' ? 'Panel Nexus Manager' : 'Panel de Organización');
                        document.getElementById('btn-admin-nav').innerText = esAdmin ? 'Creador' : 'Panel';

                        const adminElements = document.querySelectorAll('.admin-only');
                        adminElements.forEach(el => {
                            el.style.display = esAdmin ? 'inline-block' : 'none';
                        });

                        if (esNexusManager) {
                            const tabNexusBtn = document.querySelector("button[onclick=\"mostrarTabAdmin('tab-nexus')\"]");
                            if (tabNexusBtn) tabNexusBtn.style.display = 'inline-block';
                        }

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
            solicitarPermisoNotificaciones();
        } else {
            currentUserName = "Héroe Anónimo";
            if(userDisplay) {
                userDisplay.innerText = "Ingresar";
                userDisplay.href = "#modal-login";
            }
            document.getElementById('btn-notif').style.display = 'none';
        }
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

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
                elo: ELO_INICIAL,
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

    // Iniciar funciones Nexus
    escucharConfigNexus();
    cargarProductosNexus();
    escucharReferenciasNexus();

    const formRef = document.getElementById('form-crear-referencia');
    if (formRef) {
        formRef.addEventListener('submit', (e) => {
            e.preventDefault();
            if (currentUserName === 'Héroe Anónimo') return alert('Debes iniciar sesión para publicar una referencia.');
            const puntos = parseInt(document.getElementById('ref-puntos').value);
            const comentario = document.getElementById('ref-comentario').value.trim();

            db.collection('nexus_referencias').add({
                usuario: currentUserName,
                puntos: puntos,
                comentario: comentario,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                formRef.reset();
                alert('¡Gracias por tu calificación sobre Nexus Store!');
            });
        });
    }
});

function escucharReferenciasNexus() {
    const cont = document.getElementById('lista-referencias-nexus');
    if (!cont) return;

    db.collection('nexus_referencias').orderBy('timestamp', 'desc').limit(20).onSnapshot(snap => {
        cont.innerHTML = '';
        if (snap.empty) {
            cont.innerHTML = '<p style="color:#888; font-size:0.8rem; font-style:italic;">Aún no hay calificaciones. ¡Sé el primero!</p>';
            return;
        }

        snap.forEach(doc => {
            const data = doc.data();
            const estrellas = '⭐'.repeat(data.puntos || 5);
            cont.innerHTML += `
                <div style="background: rgba(0,0,0,0.4); padding: 8px 12px; border-radius: 5px; border-left: 3px solid #00ffff; font-size: 0.85rem;">
                    <div style="display:flex; justify-content:space-between; margin-bottom: 3px;">
                        <strong style="color:white;">${data.usuario}</strong>
                        <span>${estrellas}</span>
                    </div>
                    <p style="color:#ccc; margin:0;">"${data.comentario}"</p>
                </div>
            `;
        });
    });
}

// ==========================================
// SISTEMA NEXUS STORE (RECARGAS BANCARIAS)
// ==========================================
function escucharConfigNexus() {
    db.collection('configuracion').doc('nexus').onSnapshot(doc => {
        if(doc.exists) {
            const data = doc.data();

            if(data.whatsapp) nexusWhatsapp = data.whatsapp;
            if(data.cbu) nexusCBU = data.cbu;
            if(data.titular) nexusTitular = data.titular;

            if(data.bgImage) {
                const bgEl = document.getElementById('nexus-bg-image');
                if(bgEl) {
                    bgEl.src = data.bgImage;
                    bgEl.style.display = 'block';
                }
            }

            // Actualizar panel admin
            if(document.getElementById('cfg-nexus-wa')) document.getElementById('cfg-nexus-wa').value = data.whatsapp || "";
            if(document.getElementById('cfg-nexus-bg')) document.getElementById('cfg-nexus-bg').value = data.bgImage || "";
            if(document.getElementById('cfg-nexus-cbu')) document.getElementById('cfg-nexus-cbu').value = data.cbu || "";
            if(document.getElementById('cfg-nexus-titular')) document.getElementById('cfg-nexus-titular').value = data.titular || "";

            // Actualizar vista pública del modal
            if(document.getElementById('nexus-display-cbu')) document.getElementById('nexus-display-cbu').innerText = nexusCBU;
            if(document.getElementById('nexus-display-titular')) document.getElementById('nexus-display-titular').innerText = nexusTitular;
        }
    });
}

window.copiarCBUNexus = function(btnElement) {
    navigator.clipboard.writeText(nexusCBU).then(() => {
        const originalText = btnElement.innerText;
        btnElement.innerText = "¡COPIADO!";
        btnElement.style.background = "#00ffff";
        btnElement.style.color = "black";

        setTimeout(() => {
            btnElement.innerText = "COPIAR";
            btnElement.style.background = "transparent";
            btnElement.style.color = "#00ffff";
        }, 2000);
    }).catch(err => {
        alert("No se pudo copiar. Intenta seleccionando el texto manualmente.");
    });
};

function cargarProductosNexus() {
    const listaPublica = document.getElementById('lista-productos-nexus');
    const listaAdmin = document.getElementById('admin-lista-nexus');
    if(!listaPublica) return;
    mostrarSkeleton(listaPublica, 'card', 3);

    db.collection('nexus_productos').orderBy('timestamp', 'asc').onSnapshot(snap => {
        if(listaAdmin) listaAdmin.innerHTML = "";

        if (snap.empty) {
            listaPublica.innerHTML = "<p style='color:#ccc; text-align:center;'>La tienda está reabasteciéndose. Vuelve pronto.</p>";
            return;
        }

        // Agrupamos por categoría para mostrarlas en acordeones y que la
        // tienda no ocupe tanto espacio de una sola vez.
        const categorias = {
            diamantes: { titulo: '<i class="fas fa-gem"></i> Paquetes de Diamantes', html: '' },
            pase: { titulo: '<i class="fas fa-ticket-alt"></i> Pases Semanales / VIP', html: '' }
        };

        snap.forEach(doc => {
            const data = doc.data();
            const id = doc.id;

            let imgIcon = data.img && data.img !== ""
                ? `<img src="${data.img}" style="width:50px; height:50px; object-fit:contain; margin-bottom:10px;">`
                : `<i class="fas fa-gem" style="font-size:2rem; color:#00ffff; margin-bottom:10px; filter: drop-shadow(0 0 10px #00ffff);"></i>`;

            if (data.tipo === 'pase' && (!data.img || data.img === "")) {
                imgIcon = `<i class="fas fa-ticket-alt" style="font-size:2rem; color:gold; margin-bottom:10px; filter: drop-shadow(0 0 10px gold);"></i>`;
            }

            // Renderizado Público (Añadido background transparente)
            const tarjetaHtml = `
                <div class="container-glass plan-card glow-hover" style="border-color: #00ffff; background: transparent; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        ${imgIcon}
                        <h3 style="color: white; font-size:1.4rem;">${data.nombre}</h3>
                        <div class="price" style="color: gold; font-size: 1.6rem; text-shadow: 0 0 5px rgba(255,215,0,0.5);">${data.precio}</div>
                    </div>
                    <button class="btn-primary" style="background: #00ffff; color: black; width: 100%; box-shadow: 0 0 10px #00ffff; margin-top: 15px;" onclick="abrirModalCompraNexus('${data.nombre}', '${data.precio}')">COMPRAR</button>
                </div>
            `;

            const categoria = categorias[data.tipo] ? data.tipo : 'diamantes';
            categorias[categoria].html += tarjetaHtml;

            // Renderizado Admin (sigue siendo una lista plana, no necesita acordeón)
            if(listaAdmin) {
                const imgEsc = (data.img || '').replace(/'/g, "\\'");
                const nomEsc = (data.nombre || '').replace(/'/g, "\\'");
                const precEsc = (data.precio || '').replace(/'/g, "\\'");
                listaAdmin.innerHTML += `
                    <div style="background:rgba(0,0,0,0.5); padding:10px 15px; border:1px solid #333; border-radius:5px; display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                        <div>
                            <strong style="color:#00ffff; font-size: 1.1rem;">${data.nombre}</strong><br>
                            <span style="color:gold;">${data.precio}</span> | <span style="color:#888; font-size:0.8rem;">${data.tipo.toUpperCase()}</span>
                        </div>
                        <div style="display:flex; gap:5px;">
                            <button class="btn-secondary" style="border-color:#00ffff; color:#00ffff; padding:5px 10px; font-size:0.75rem;" onclick="abrirModalEditarProductoNexus('${id}', '${nomEsc}', '${precEsc}', '${data.tipo}', '${imgEsc}')"><i class="fas fa-edit"></i> EDITAR</button>
                            <button class="btn-secondary" style="border-color:var(--red); color:var(--red); padding:5px 10px; font-size:0.75rem;" onclick="borrarProductoNexus('${id}', '${nomEsc}')"><i class="fas fa-trash"></i> BORRAR</button>
                        </div>
                    </div>
                `;
            }
        });

        let htmlFinal = "";
        Object.values(categorias).forEach(cat => {
            if (cat.html === '') return; // no mostramos categorías vacías
            htmlFinal += `
                <details class="nexus-accordion">
                    <summary class="nexus-accordion-summary">${cat.titulo}</summary>
                    <div class="torneos-grid" style="margin-top: 20px;">${cat.html}</div>
                </details>
            `;
        });

        listaPublica.innerHTML = htmlFinal || "<p style='color:#ccc; text-align:center;'>La tienda está reabasteciéndose. Vuelve pronto.</p>";
    });
}

window.abrirModalCompraNexus = function(nombre, precio) {
    document.getElementById('nexus-producto-desc').innerText = "Paquete: " + nombre;
    document.getElementById('nexus-producto-precio').innerText = "Monto a Transferir: " + precio;
    document.getElementById('nexus-item-name').value = nombre;
    document.getElementById('nexus-item-price').value = precio;
    document.getElementById('nexus-player-id').value = "";
    document.getElementById('nexus-player-zone').value = "";
    document.getElementById('modal-compra-nexus').style.display = 'flex';
};

window.enviarPedidoNexus = function() {
    const nombre = document.getElementById('nexus-item-name').value;
    const precio = document.getElementById('nexus-item-price').value;
    const pid = document.getElementById('nexus-player-id').value.trim();
    const pzone = document.getElementById('nexus-player-zone').value.trim();

    if(!pid || !pzone) {
        alert("Por favor, completa tu ID y Servidor para poder enviarte los diamantes.");
        return;
    }

    const mensaje = `Hola Nexus Store ⚡\nQuiero adquirir: *${nombre}* (${precio}).\n\n🎮 Mis datos de Mobile Legends:\nID: *${pid}*\nServer: *${pzone}*\n\nAdjunto mi comprobante de pago a continuación.`;

    // Limpiamos el número de cualquier caracter raro
    const numeroLimpio = nexusWhatsapp.replace(/\D/g, '');
    const urlWa = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;

    window.open(urlWa, '_blank');
    document.getElementById('modal-compra-nexus').style.display = 'none';
};

window.abrirModalEditarProductoNexus = function(id, nombre, precio, tipo, img) {
    document.getElementById('n-edit-prod-id').value = id;
    document.getElementById('n-edit-prod-nombre').value = nombre || "";
    document.getElementById('n-edit-prod-precio').value = precio || "";
    document.getElementById('n-edit-prod-tipo').value = tipo || "diamantes";
    document.getElementById('n-edit-prod-img').value = img || "";
    document.getElementById('modal-editar-producto-nexus').style.display = 'flex';
};

window.borrarProductoNexus = function(id, nombre) {
    if(confirm(`¿Estás seguro de retirar "${nombre}" de la Nexus Store?`)) {
        db.collection('nexus_productos').doc(id).delete();
    }
};

// ==========================================
// SISTEMA DE LOGIN MANUAL Y REPORTES
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
// BORRADO DE TORNEOS Y RESET BINGO
// ==========================================
window.cargarListaBorrarTorneosAdmin = function() {
    const cont = document.getElementById('admin-lista-borrar-torneos');
    if(!cont) return;
    const esAdminSupremo = (auth.currentUser?.email === ADMIN_EMAIL);

    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        cont.innerHTML = "";
        if(snap.empty) {
            cont.innerHTML = "<p style='color:#666; font-size:0.85rem;'>No hay torneos registrados en el sistema.</p>";
            return;
        }
        snap.forEach(doc => {
            const d = doc.data();
            if (esAdminSupremo || d.creador === currentUserName) {
                cont.innerHTML += `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.4); padding:10px; border-radius:5px; border:1px solid #222; font-size:0.85rem; margin-bottom: 5px;">
                        <span style="color:white;">${d.nombre} (${d.formato}) - <small style="color:#aaa;">Creador: ${d.creador || 'Desconocido'}</small></span>
                        <button class="btn-primary" style="background:var(--red); color:white; padding:4px 12px; font-size:0.75rem; border:none; cursor:pointer;" onclick="borrarTorneoDefinitivo('${doc.id}','${d.nombre}')"><i class="fas fa-trash"></i> BORRAR</button>
                    </div>`;
            }
        });
    });
};

window.borrarTorneoDefinitivo = async function(id, nombre) {
    const docRef = db.collection('torneos').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return;
    const creador = docSnap.data().creador;
    const esAdminSupremo = (auth.currentUser?.email === ADMIN_EMAIL);

    if (!esAdminSupremo && creador !== currentUserName) {
        alert("Solo puedes eliminar los torneos creados por ti.");
        return;
    }

    if(confirm(`⚠️ ¿ESTÁS SEGURO?\nVas a eliminar permanentemente "${nombre}". Esto borrará sus llaves y todos los datos asociados.`)) {
        docRef.delete().then(() => {
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

            const secciones = ['stream', 'fama', 'ligas', 'planes', 'torneos', 'bingo', 'comunidades', 'sorteos', 'abismo', 'gremio', 'tienda', 'nexus'];
            secciones.forEach(sec => {
                const sectionEl = document.getElementById(sec === 'nexus' ? 'nexus-store' : sec);
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
        const esOrganizador = esAdmin || miPlan === 'jonin' || miPlan === 'kasekage';

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
            if (esOrganizador) {
                if (data.estado === 'abierto') {
                    adminHTML = `<button class="btn-primary" style="width:100%; margin-top:10px; background:#ff00ff; color:white;" onclick="ejecutarSorteo('${id}', '${data.premio}', ${data.cantidadGanadores})"><i class="fas fa-dice"></i> SORTEAR AHORA</button>`;
                } else if (esAdmin || data.creador === currentUserName) {
                    adminHTML = `<button class="btn-primary" style="width:100%; margin-top:10px; background:var(--red); color:white; border:none;" onclick="borrarSorteo('${id}', '${data.premio}')"><i class="fas fa-trash"></i> BORRAR SORTEO</button>`;
                }
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

window.borrarSorteo = function(sorteoId, premioNombre) {
    if(confirm(`⚠️ ¿Estás seguro de eliminar permanentemente el sorteo por: ${premioNombre}?`)) {
        db.collection('sorteos').doc(sorteoId).delete().then(() => {
            alert("Sorteo eliminado de los registros.");
        });
    }
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

window.concederAccesoNexusManager = function() {
    const nickBuscado = document.getElementById('gestion-nick').value.trim();
    if(!nickBuscado) return;
    db.collection('ninjas').where('nick', '==', nickBuscado).get().then(snap => {
        if(!snap.empty) {
            const actual = snap.docs[0].data().esNexusManager === true;
            snap.docs[0].ref.update({ esNexusManager: !actual });
            alert(`Acceso a Nexus Store Manager ${!actual ? 'OTORGADO' : 'REVOCADO'} para ${nickBuscado}.`);
        } else {
            alert("No se encontró al ninja en los registros.");
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
    mostrarSkeleton(lista, 'linea', 5);

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
            <div class="container-glass plan-card glow-hover" style="text-align:center; padding:15px; border: 1px solid #222; display: flex; flex-direction: column; justify-content: space-between;">
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
    const listaAgenda = document.getElementById('lista-agenda-proximos');

    if(!listaTorneos || !listaLigas) return;
    mostrarSkeleton(listaTorneos, 'card', 3);
    mostrarSkeleton(listaLigas, 'card', 2);
    if (listaAgenda) mostrarSkeleton(listaAgenda, 'card', 3);

    db.collection('torneos').orderBy('timestamp', 'desc').onSnapshot(snap => {
        listaTorneos.innerHTML = '';
        listaLigas.innerHTML = '';
        const eventos = [];

        snap.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            eventos.push({ id, ...data });

            if (data.tipo === 'liga' || data.tipo === 'liga_grupos') {
                listaLigas.innerHTML += generarTarjetaEventoHTML(data, id, true);
            } else {
                if (currentFilter === 'todos' || data.formato === currentFilter) {
                    listaTorneos.innerHTML += generarTarjetaEventoHTML(data, id, false);
                }
            }
        });

        renderizarAgendaProximos(eventos);
    });
}

function obtenerFechaEvento(evento) {
    if (!evento.fechaISO) return null;
    const fecha = new Date(evento.fechaISO);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function formatearFechaEvento(evento) {
    const fecha = obtenerFechaEvento(evento);
    if (!fecha) return evento.fecha || 'Por definir';
    return new Intl.DateTimeFormat('es-AR', {
        weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(fecha);
}

function renderizarAgendaProximos(eventos) {
    const listaAgenda = document.getElementById('lista-agenda-proximos');
    if (!listaAgenda) return;

    const ahora = new Date();
    const limite = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);
    const proximos = eventos
        .map(evento => ({ evento, fecha: obtenerFechaEvento(evento) }))
        .filter(({ evento, fecha }) => fecha && fecha >= ahora && fecha <= limite && evento.estado !== 'finalizado')
        .sort((a, b) => a.fecha - b.fecha);

    if (proximos.length === 0) {
        listaAgenda.innerHTML = "<p style='color:#888; text-align:center; grid-column:1 / -1;'>No hay eventos fechados para los próximos 7 días.</p>";
        return;
    }

    listaAgenda.innerHTML = proximos.map(({ evento, fecha }) => `
        <article class="agenda-evento container-glass">
            <div class="agenda-fecha"><span style="font-size:1.25rem; display:block;">${fecha.getDate()}</span><span style="font-size:0.72rem; text-transform:uppercase;">${fecha.toLocaleDateString('es-AR', { month: 'short' })}</span></div>
            <div>
                <strong style="color:white; display:block; margin-bottom:4px;">${evento.nombre}</strong>
                <span style="color:#aaa; font-size:0.82rem;"><i class="fas fa-clock"></i> ${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · ${evento.formato.toUpperCase()}</span>
            </div>
        </article>
    `).join('');
}

function generarTarjetaEventoHTML(data, id, esLiga) {
    const esIndividual = (data.formato === '1v1');
    const inscritos = esIndividual ? (data.lista_inscriptos ? data.lista_inscriptos.length : 0) : (data.lista_equipos ? data.lista_equipos.length : 0);
    const cuposTotales = data.cuposTotales || 0;

    let yaInscrito = false;
    let participanteCheckIn = null;

    if (esIndividual) {
        yaInscrito = data.lista_inscriptos && data.lista_inscriptos.includes(currentUserName);
        if (yaInscrito) participanteCheckIn = currentUserName;
    } else {
        if (data.lista_equipos) {
            data.lista_equipos.forEach(eq => {
                if(eq.miembros && eq.miembros.includes(currentUserName)) {
                    yaInscrito = true;
                    const capitan = eq.capitan || eq.miembros[0];
                    if (capitan === currentUserName) participanteCheckIn = eq.nombre;
                }
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
    const requiereCheckIn = data.requiereCheckIn === true;
    const checkIns = data.checkIns || [];
    const yaHizoCheckIn = participanteCheckIn && checkIns.includes(participanteCheckIn);

    let checkInAbiertoEfectivo = data.checkInAbierto === true;
    if (requiereCheckIn && data.fechaISO && !checkInAbiertoEfectivo && data.estado === 'abierto') {
        const diffMin = (new Date(data.fechaISO).getTime() - Date.now()) / 60000;
        if (diffMin <= 60 && diffMin >= -180) checkInAbiertoEfectivo = true;
    }

    let checkInHtml = '';

    if (requiereCheckIn) {
        if (data.estado !== 'abierto') {
            checkInHtml = `<p style="font-size:0.75rem; color:#888; margin:0 0 12px;"><i class="fas fa-clipboard-check"></i> Check-in cerrado: ${checkIns.length} confirmado(s).</p>`;
        } else if (!checkInAbiertoEfectivo) {
            checkInHtml = `<p style="font-size:0.75rem; color:#888; margin:0 0 12px;"><i class="fas fa-clipboard-check"></i> Check-in pendiente de apertura por el organizador.</p>`;
        } else if (yaHizoCheckIn) {
            checkInHtml = `<p style="font-size:0.78rem; color:var(--green); font-weight:bold; margin:0 0 12px;"><i class="fas fa-check-circle"></i> Check-in confirmado.</p>`;
        } else if (participanteCheckIn) {
            checkInHtml = `<button class="btn-secondary" style="width:100%; margin:0 0 12px; padding:8px; border-color:var(--green); color:var(--green);" onclick="confirmarCheckIn('${id}')"><i class="fas fa-clipboard-check"></i> CONFIRMAR CHECK-IN</button>`;
        } else if (yaInscrito) {
            checkInHtml = `<p style="font-size:0.75rem; color:#aaa; margin:0 0 12px;"><i class="fas fa-user-shield"></i> El capitán debe confirmar el check-in del equipo.</p>`;
        } else {
            checkInHtml = `<p style="font-size:0.75rem; color:#aaa; margin:0 0 12px;"><i class="fas fa-clipboard-check"></i> Se requiere check-in para jugar.</p>`;
        }
    }

    return `
        <div class="card-t container-glass glow-hover" style="${esLiga ? 'border-color: gold !important;' : ''} position:relative; overflow:hidden;">
            ${data.privado ? '<div style="position:absolute; top:10px; right:10px; color:var(--red); font-size:1.2rem;" title="Evento Privado"><i class="fas fa-lock"></i></div>' : ''}

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
                <span style="color:${bordeColor}; border: 1px solid ${bordeColor}; padding: 3px 8px; font-size: 0.75rem; border-radius: 4px; font-weight:bold; letter-spacing:1px;">
                    ${data.formato.toUpperCase()}
                </span>
                <span class="${statusClass}" style="font-size:0.75rem; font-weight:bold;">${statusTexto}</span>
            </div>

            <h3 style="margin-bottom: 15px; font-size:1.3rem; line-height:1.2;">${data.nombre}</h3>

            <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                <p style="font-size:0.85rem; color:#ccc; margin-bottom:5px;"><i class="fas fa-calendar-alt" style="color:var(--blue); width:20px;"></i> ${formatearFechaEvento(data)}</p>
                <p style="font-size:0.85rem; color:#ccc; margin-bottom:5px;"><i class="fas fa-users" style="color:var(--blue); width:20px;"></i> Cupos: <strong>${inscritos}</strong> / ${cuposTotales}</p>
                <p style="font-size:0.85rem; color:#ccc; margin-bottom:0;"><i class="fas fa-trophy" style="color:gold; width:20px;"></i> Premio: <strong style="color:var(--green);">${data.premio || 'Gloria'}</strong></p>
            </div>
            ${checkInHtml}

            <div style="display: flex; gap: 8px; margin-top: auto;">
                <button class="btn-primary" style="flex: 2; background: ${yaInscrito ? 'var(--green)' : 'var(--blue)'}; color: black; font-size:0.8rem; padding:10px 5px;"
                        onclick="unirseTorneo('${id}', '${data.estado}')"
                        ${data.estado !== 'abierto' || yaInscrito ? 'disabled' : ''}>
                    ${btnTexto}
                </button>
                <button class="btn-secondary" style="flex: 1.2; font-size:0.8rem; padding:10px 5px;" onclick="verLlaves('${id}', '${data.nombre}')">
                    ${esLiga ? '<i class="fas fa-list-ol"></i> RANKING LIGA' : 'CRUCES'}
                </button>
            </div>
        </div>
    `;
}

window.confirmarCheckIn = async function(torneoId) {
    if (currentUserName === "Héroe Anónimo") return window.location.hash = "#modal-login";

    const torneoRef = db.collection('torneos').doc(torneoId);
    const torneoSnap = await torneoRef.get();
    if (!torneoSnap.exists) return;
    const torneo = torneoSnap.data();

    let autoCheckInAbierto = torneo.checkInAbierto === true;
    if (torneo.requiereCheckIn && torneo.fechaISO && !autoCheckInAbierto && torneo.estado === 'abierto') {
        const diffMin = (new Date(torneo.fechaISO).getTime() - Date.now()) / 60000;
        if (diffMin <= 60 && diffMin >= -180) autoCheckInAbierto = true;
    }

    if (torneo.estado !== 'abierto' || !torneo.requiereCheckIn || !autoCheckInAbierto) {
        return alert("El check-in no está abierto para este evento.");
    }

    let participante = null;
    if (torneo.formato === '1v1') {
        if ((torneo.lista_inscriptos || []).includes(currentUserName)) participante = currentUserName;
    } else {
        const equipo = (torneo.lista_equipos || []).find(eq => eq.miembros && eq.miembros.includes(currentUserName));
        const capitan = equipo && (equipo.capitan || equipo.miembros[0]);
        if (equipo && capitan === currentUserName) participante = equipo.nombre;
    }

    if (!participante) return alert("Debes estar inscripto; en equipos, el check-in lo confirma el capitán.");
    await torneoRef.update({ checkIns: firebase.firestore.FieldValue.arrayUnion(participante) });
    alert("¡Check-in confirmado! Ya quedaste listo para los cruces.");
};

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
            }).then(() => {
                alert("¡Te has inscrito con éxito!");
                sumarTorneoJugado(currentUserName);
            });
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
            capitan: currentUserName,
            miembros: [currentUserName]
        });

        doc.ref.update({ lista_equipos: equipos }).then(async () => {
            document.getElementById('eq-nombre').value = "";
            document.getElementById('eq-pass').value = "";

            const eqRef = db.collection('equipos_persistentes').doc(nombreEquipo);
            const eqDoc = await eqRef.get();
            if (!eqDoc.exists) {
                await eqRef.set({
                    nombre: nombreEquipo,
                    capitan: currentUserName,
                    elo: ELO_INICIAL,
                    partidasJugadas: 0,
                    partidasGanadas: 0,
                    creado: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

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
                sumarTorneoJugado(currentUserName);
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
// VISUALIZADOR DE LLAVES Y SALAS
// ==========================================
// ==========================================
// COMPARTIR RESULTADOS (WhatsApp)
// ==========================================
// Arma el texto tipo "⚔️ Matias7 venció a XPlayer en la Final del
// Torneo MBL Arg Semana 12". Si el ganador de este partido es el
// campeón del torneo (y no es liga, que no tiene "final" única), lo
// etiqueta como Final; si no, usa el número de ronda.
function generarTextoCompartir(ganador, perdedor, partido, torneoNombre, torneoData) {
    const tipoTexto = torneoData.tipo === 'liga' ? 'la Liga' : 'el Torneo';
    let etapa = `la Ronda ${partido.ronda} de ${tipoTexto} ${torneoNombre}`;
    if (torneoData.campeon && ganador === torneoData.campeon && torneoData.tipo !== 'liga') {
        etapa = `la Final de ${tipoTexto} ${torneoNombre}`;
    }
    return `⚔️ ${ganador} venció a ${perdedor} en ${etapa}`;
}

function generarTextoCompartirCampeon(campeonNombre, torneoNombre, torneoData) {
    const tipoTexto = torneoData.tipo === 'liga' ? 'la Liga' : 'el Torneo';
    return `🏆 ¡${campeonNombre} es el Campeón Definitivo de ${tipoTexto} ${torneoNombre}!`;
}

// wa.me sin número de destino abre el selector de contacto/grupo de
// WhatsApp con el texto ya cargado, listo para reenviar a cualquier lado.
function botonCompartirWhatsapp(texto, extraStyle = '') {
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    return `<a href="${url}" target="_blank" class="btn-secondary" style="width:100%; margin-top:8px; font-size:0.75rem; padding:6px; border-color:#25D366; color:#25D366; text-decoration:none; display:block; text-align:center; ${extraStyle}"><i class="fab fa-whatsapp"></i> COMPARTIR RESULTADO</a>`;
}

window.verLlaves = function(torneoId, torneoNombre) {
    document.getElementById('llaves-titulo').innerText = `Pergamino de Cruces: ${torneoNombre}`;
    const contenedorText = document.getElementById('contenedor-llaves-texto');
    const contenedorCampeon = document.getElementById('contenedor-campeon');

    contenedorText.innerHTML = "<p style='text-align:center; color:white;'>Desenrollando pergaminos...</p>";
    contenedorCampeon.innerHTML = "";
    window.location.hash = "#modal-llaves";

    db.collection('torneos').doc(torneoId).get().then(async docTorneo => {
        if (!docTorneo.exists) return;
        const torneoData = docTorneo.data();

        if (torneoData.campeon) {
            contenedorCampeon.innerHTML = `
                <div style="background: rgba(255,215,0,0.1); border: 2px solid gold; padding: 20px; text-align: center; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 0 15px rgba(255,215,0,0.3);">
                    <i class="fas fa-trophy" style="font-size: 3rem; color: gold; margin-bottom: 10px;"></i>
                    <h2 style="color: gold; margin: 0;">CAMPEÓN DEFINITIVO</h2>
                    <h1 style="color: white; margin: 10px 0; font-size: 2.5rem; text-transform: uppercase; letter-spacing: 2px;">${torneoData.campeon}</h1>
                    ${botonCompartirWhatsapp(generarTextoCompartirCampeon(torneoData.campeon, torneoNombre, torneoData), 'max-width:280px; margin-left:auto; margin-right:auto;')}
                </div>
            `;
        }

        // Para formato 1v1 traemos las fotos de perfil una sola vez, para
        // mostrarlas junto al nombre en cada cruce. En formato por equipos
        // no aplica (un equipo no tiene una única foto de jugador).
        let fotosPorNick = {};
        if (torneoData.formato === '1v1') {
            const ninjasSnap = await db.collection('ninjas').get();
            ninjasSnap.forEach(doc => {
                const n = doc.data();
                if (!n.nick) return;
                fotosPorNick[n.nick] = (n.fotoPerfil && n.fotoPerfil !== "") ? n.fotoPerfil : `https://ui-avatars.com/api/?name=${encodeURIComponent(n.nick)}&background=random`;
            });
        }

        // Arma la ficha de un partido (usada tanto por el bracket de Torneo
        // como por el fixture de Liga, para no repetir la lógica dos veces).
        const construirFichaPartido = (partido, partidoId, sinConector) => {
            let p1Clase = "bracket-player";
            let p2Clase = "bracket-player";
            if (partido.ganador === partido.p1) p1Clase += " ganador";
            if (partido.ganador === partido.p2) p2Clase += " ganador";
            if (partido.ganador && partido.ganador !== partido.p1) p1Clase += " perdedor";
            if (partido.ganador && partido.ganador !== partido.p2) p2Clase += " perdedor";

            let estadoTexto = partido.ganador
                ? `<span style="color:var(--green); font-size:0.75rem;"><i class="fas fa-check-circle"></i> ${partido.ganador}</span>`
                : `<span style="color:var(--red); font-size:0.75rem;"><i class="fas fa-clock"></i> Pendiente</span>`;

            let compartirHtml = "";
            if (partido.ganador && partido.p2 !== "BYE") {
                const perdedorPartido = (partido.ganador === partido.p1) ? partido.p2 : partido.p1;
                const textoCompartir = generarTextoCompartir(partido.ganador, perdedorPartido, partido, torneoNombre, torneoData);
                compartirHtml = botonCompartirWhatsapp(textoCompartir);
            }

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
                        <div style="background: rgba(0,210,255,0.1); padding: 8px; margin-top: 10px; border-radius: 4px; border: 1px dashed var(--blue); display: flex; justify-content: space-around; font-size: 0.8rem;">
                            <span style="color: white;">Sala: <strong style="color: var(--blue); user-select: all;">${partido.salaId}</strong></span>
                            <span style="color: white;">Pass: <strong style="color: var(--blue); user-select: all;">${partido.salaPass || 'Sin Pass'}</strong></span>
                        </div>
                    `;
                }
                if (!partido.ganador) {
                    reportarHtml = `
                        <button class="btn-secondary" style="width: 100%; margin-top: 10px; font-size: 0.75rem; padding: 8px; border-color: #ff00ff; color: #ff00ff;" onclick="abrirModalReporte('${torneoId}', '${partidoId}', '${partido.p1}', '${partido.p2}')"><i class="fas fa-camera"></i> REPORTAR RESULTADO</button>
                    `;
                }
            }

            const fotoP1 = fotosPorNick[partido.p1] ? `<img src="${fotosPorNick[partido.p1]}" style="width:26px; height:26px; border-radius:50%; object-fit:cover; margin-right:8px; border:1px solid #333;">` : "";
            const fotoP2 = fotosPorNick[partido.p2] ? `<img src="${fotosPorNick[partido.p2]}" style="width:26px; height:26px; border-radius:50%; object-fit:cover; margin-right:8px; border:1px solid #333;">` : "";

            return `
                <div class="bracket-match ${sinConector ? 'bracket-match-last' : ''} neon-card">
                    <div class="neon-card-content">
                        <div class="vs-match-container">
                            <div class="team-red ${p1Clase}">${fotoP1}${partido.p1}</div>
                            <div class="vs-badge">VS</div>
                            <div class="team-blue ${p2Clase}">${fotoP2}${partido.p2}</div>
                        </div>
                        <div style="text-align:center; margin-top:8px;">${estadoTexto}</div>
                        ${salaHtml}
                        ${reportarHtml}
                        ${compartirHtml}
                    </div>
                </div>
            `;
        };

        db.collection('torneos').doc(torneoId).collection('llaves').orderBy('ronda', 'asc').onSnapshot(snap => {
            contenedorText.innerHTML = "";

            if (snap.empty) {
                contenedorText.innerHTML = "<p style='text-align:center; color: var(--red); font-weight:bold;'>Los cruces aún no han sido generados por el Kage.</p>";
                return;
            }

            if (torneoData.tipo === 'liga' || torneoData.tipo === 'liga_grupos') {
                const partidosLiga = [];
                snap.forEach(doc => partidosLiga.push({ id: doc.id, ...doc.data() }));

                let html = "";

                if (torneoData.tipo === 'liga_grupos') {
                    const partidosA = partidosLiga.filter(p => p.grupo === 'A');
                    const partidosB = partidosLiga.filter(p => p.grupo === 'B');
                    const partidoFinal = partidosLiga.find(p => p.isFinal);

                    const tablaA = calcularTablaPosiciones(partidosA);
                    const tablaB = calcularTablaPosiciones(partidosB);

                    html += "<h4 style='color: gold; margin-bottom: 10px;'><i class='fas fa-trophy'></i> GRUPO A</h4>";
                    html += generarTablaPosicionesHTML(tablaA);

                    html += "<h4 style='color: #00ffff; margin: 20px 0 10px 0;'><i class='fas fa-trophy'></i> GRUPO B</h4>";
                    html += generarTablaPosicionesHTML(tablaB);

                    if (partidoFinal) {
                        html += "<h4 style='color: #ff00ff; margin: 25px 0 15px 0; border-top: 1px solid #333; padding-top: 15px;'><i class='fas fa-crown'></i> GRAN FINAL</h4>";
                        html += construirFichaPartido(partidoFinal, partidoFinal.id, true);
                    }

                    html += "<h4 style='color: var(--blue); margin: 25px 0 15px 0; border-bottom: 1px solid #333; padding-bottom:8px;'>Fixture de la Fase de Grupos</h4>";
                    html += "<div style='display:flex; flex-direction:column; gap:12px;'>";
                    partidosLiga.filter(p => !p.isFinal).forEach(partido => {
                        html += construirFichaPartido(partido, partido.id, true);
                    });
                    html += "</div>";
                } else {
                    html += generarTablaPosicionesHTML(calcularTablaPosiciones(partidosLiga));
                    html += "<h4 style='color: var(--blue); margin: 10px 0 15px 0; border-bottom: 1px solid #333; padding-bottom:8px;'>Fixture de Partidos</h4>";
                    html += "<div style='display:flex; flex-direction:column; gap:12px;'>";
                    partidosLiga.forEach(partido => {
                        html += construirFichaPartido(partido, partido.id, true);
                    });
                    html += "</div>";
                }

                contenedorText.innerHTML = html;
                return;
            }

            // --- TORNEO: bracket por columnas, igual que hasta ahora ---
            const rondasMap = new Map();
            snap.forEach(doc => {
                const partido = doc.data();
                const partidoId = doc.id;
                if (!rondasMap.has(partido.ronda)) rondasMap.set(partido.ronda, []);
                rondasMap.get(partido.ronda).push({ ...partido, id: partidoId });
            });

            const rondasOrdenadas = Array.from(rondasMap.entries()).sort((a, b) => a[0] - b[0]);
            const ultimaRondaIndex = rondasOrdenadas.length - 1;

            let bracketHtml = "<div class='bracket-scroll'>";

            rondasOrdenadas.forEach(([numeroRonda, partidos], indexRonda) => {
                const esUltimaRonda = (indexRonda === ultimaRondaIndex);
                const tituloRonda = (esUltimaRonda && partidos.length === 1) ? 'Final' : `Ronda ${numeroRonda}`;

                bracketHtml += `
                    <div class="bracket-round">
                        <h4 class="bracket-round-title">${tituloRonda}</h4>
                        <div class="bracket-round-matches">
                `;

                partidos.forEach(partido => {
                    bracketHtml += construirFichaPartido(partido, partido.id, esUltimaRonda);
                });

                bracketHtml += `</div></div>`;
            });

            bracketHtml += "</div>";
            contenedorText.innerHTML = bracketHtml;
        });
    });
};

// ==========================================
// ABISMO (VIDEOS Y LIKES)
// ==========================================
function cargarVideosAbismo() {
    const listaAbismo = document.getElementById('lista-abismo');
    if(!listaAbismo) return;
    mostrarSkeleton(listaAbismo, 'card', 3);

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
                <div class="container-glass glow-hover" style="padding: 10px;">
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
    mostrarSkeleton(podio, 'podio', 3);

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
                document.getElementById('clan-elo-display').innerText = data.elo || ELO_INICIAL;
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
                elo: ELO_INICIAL,
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
    mostrarSkeleton(listaClanes, 'linea', 5);
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
                    <span style="font-weight: bold; color: ${colorRank};">${index + 1}. ${data.nombre} <span style="color:#ff4d4d; font-size:0.75rem; font-weight:normal;">(${data.elo || ELO_INICIAL} ELO)</span></span>
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
    mostrarSkeleton(lista, 'linea', 6);

    db.collection('ninjas').orderBy('xp', 'desc').limit(10).onSnapshot(snap => {
        lista.innerHTML = "";
        let posicion = 1;
        snap.forEach(doc => {
            const data = doc.data();
            let colorPos = posicion === 1 ? 'gold' : (posicion === 2 ? 'silver' : (posicion === 3 ? '#cd7f32' : 'white'));

            const pj = data.partidasJugadas || 0;
            const pg = data.partidasGanadas || 0;
            const pp = pj - pg;
            const winrate = pj > 0 ? Math.round((pg / pj) * 100) : 0;
            const torneosJugados = data.torneosJugados || 0;

            lista.innerHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 5px; margin-bottom: 5px; cursor: pointer; border-left: 3px solid ${colorPos}; transition: background 0.3s;" onclick="abrirPerfil('${data.nick}')">
                    <div>
                        <span style="font-weight: bold; color: ${colorPos};">${posicion}. ${data.nick}</span>
                        <div style="font-size: 0.72rem; color: #999; margin-top: 3px;">
                            ${torneosJugados} Torneos · ${pj} PJ · <span style="color: var(--green);">${pg} PG</span> · <span style="color: var(--red);">${pp} PP</span> · ${winrate}% WR · <span style="color:#ff4d4d;">${data.elo || ELO_INICIAL} ELO</span>
                        </div>
                    </div>
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
            document.getElementById('perfil-elo').innerText = data.elo || ELO_INICIAL;
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

            const historialCont = document.getElementById('perfil-historial-lista');
            if (historialCont) {
                if (data.historialPartidos && data.historialPartidos.length > 0) {
                    historialCont.innerHTML = data.historialPartidos.slice().reverse().map(h => {
                        const colorRes = h.resultado === 'Victoria' ? 'var(--green)' : 'var(--red)';
                        const fechaTxt = new Date(h.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
                        return `
                            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:6px 10px; border-radius:4px; font-size:0.8rem;">
                                <div>
                                    <strong style="color:white;">${h.torneo}</strong>
                                    <span style="color:#aaa;"> vs ${h.rival}</span>
                                </div>
                                <div>
                                    <span style="color:${colorRes}; font-weight:bold; margin-right:8px;">${h.resultado}</span>
                                    <span style="color:#666; font-size:0.75rem;">${fechaTxt}</span>
                                </div>
                            </div>
                        `;
                    }).join('');
                } else {
                    historialCont.innerHTML = `<p style="color:#888; font-size:0.8rem; font-style:italic;">Sin batallas recientes en el registro.</p>`;
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
    const tabs = ['tab-torneos', 'tab-llaves-admin', 'tab-moderacion', 'tab-banco', 'tab-gestion', 'tab-personalizacion', 'tab-nexus'];
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
        sumarTorneoJugado(nick);
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
                fechaISO: document.getElementById('t-fecha').value || null,
                cuposTotales: parseInt(document.getElementById('t-cupos').value),
                premio: document.getElementById('t-premio').value,
                formato: document.getElementById('t-formato').value,
                tipo: document.getElementById('t-tipo').value,
                privado: document.getElementById('t-privado').checked,
                creador: currentUserName,
                lista_inscriptos: [],
                lista_equipos: [],
                requiereCheckIn: document.getElementById('t-requiere-checkin').checked,
                checkInAbierto: false,
                checkIns: [],
                estado: "abierto",
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                document.getElementById('form-torneo').reset();
                alert("¡Evento publicado en el tablón!");
            });
        });
    }

    const formEditProdNexus = document.getElementById('form-editar-producto-nexus');
    if (formEditProdNexus) {
        formEditProdNexus.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('n-edit-prod-id').value;
            const nombre = document.getElementById('n-edit-prod-nombre').value.trim();
            const precio = document.getElementById('n-edit-prod-precio').value.trim();
            const tipo = document.getElementById('n-edit-prod-tipo').value;
            const img = document.getElementById('n-edit-prod-img').value.trim();

            if (!id || !nombre || !precio) return alert("Por favor completa los campos requeridos.");

            db.collection('nexus_productos').doc(id).update({
                nombre: nombre,
                precio: precio,
                tipo: tipo,
                img: img
            }).then(() => {
                document.getElementById('modal-editar-producto-nexus').style.display = 'none';
                alert("¡Producto de Nexus Store actualizado con éxito!");
            }).catch(err => {
                alert("Error al actualizar el producto: " + err.message);
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
                tienda: document.getElementById('vis-cfg-tienda').checked,
                nexus: document.getElementById('vis-cfg-nexus') ? document.getElementById('vis-cfg-nexus').checked : true
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

    const formConfigNexus = document.getElementById('form-config-nexus');
    if(formConfigNexus) {
        formConfigNexus.addEventListener('submit', (e) => {
            e.preventDefault();
            db.collection('configuracion').doc('nexus').set({
                whatsapp: document.getElementById('cfg-nexus-wa').value.trim(),
                bgImage: document.getElementById('cfg-nexus-bg').value.trim(),
                titular: document.getElementById('cfg-nexus-titular').value.trim(),
                cbu: document.getElementById('cfg-nexus-cbu').value.trim()
            }, { merge: true }).then(() => {
                alert("¡Base de datos de Nexus Store sincronizada!");
            });
        });
    }

    const formProdNexus = document.getElementById('form-producto-nexus');
    if(formProdNexus) {
        formProdNexus.addEventListener('submit', (e) => {
            e.preventDefault();
            db.collection('nexus_productos').add({
                nombre: document.getElementById('n-prod-nombre').value.trim(),
                precio: document.getElementById('n-prod-precio').value.trim(),
                tipo: document.getElementById('n-prod-tipo').value,
                img: document.getElementById('n-prod-img').value.trim(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                formProdNexus.reset();
                alert("Producto añadido exitosamente al catálogo de Nexus Store.");
            });
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
                const requiereCheckIn = data.requiereCheckIn === true;
                const checkInActivo = data.checkInAbierto === true;
                const checkInBoton = requiereCheckIn
                    ? `<button class="btn-secondary" style="border-color: var(--green); color: var(--green); margin-right: 5px; padding: 5px 10px; font-size: 0.8rem;" onclick="alternarCheckIn('${doc.id}', ${checkInActivo})"><i class="fas fa-clipboard-check"></i> ${checkInActivo ? 'CERRAR' : 'ABRIR'} CHECK-IN</button>`
                    : '';
                accionHtml = `
                    <button class="btn-secondary" style="border-color: var(--purple); color: var(--purple); margin-right: 5px; padding: 5px 10px; font-size: 0.8rem;" onclick="abrirGestionInscritos('${doc.id}', '${data.formato}', '${data.nombre}')"><i class="fas fa-users-cog"></i> GESTIONAR INSCRITOS</button>
                    <button class="btn-secondary" style="border-color: var(--blue); color: var(--blue); margin-right: 5px; padding: 5px 10px; font-size: 0.8rem;" onclick="abrirAdminPartidos('${doc.id}', '${data.nombre}', '${data.creador}', '${data.formato}')"><i class="fas fa-user-plus"></i> AÑADIR</button>
                    ${checkInBoton}
                    <button class="btn-primary" style="background:var(--blue); color:black; padding: 5px 10px; font-size: 0.8rem;" onclick="generarLlaves('${doc.id}', '${data.nombre}')">GENERAR CRUCES</button>
                `;
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

window.abrirGestionInscritos = function(torneoId, formato, nombreTorneo) {
    document.getElementById('admin-inscritos-torneo-id').value = torneoId;
    document.getElementById('admin-inscritos-formato').value = formato;
    document.getElementById('modal-admin-inscritos').style.display = 'flex';

    db.collection('torneos').doc(torneoId).onSnapshot(doc => {
        if(!doc.exists) return;
        const data = doc.data();
        const listaCont = document.getElementById('lista-gestion-inscritos');
        listaCont.innerHTML = "";

        if(formato === '1v1') {
            const inscritos = data.lista_inscriptos || [];
            if(inscritos.length === 0) listaCont.innerHTML = "<p style='color:#666; text-align:center;'>No hay ninjas inscritos aún.</p>";

            inscritos.forEach(jugador => {
                listaCont.innerHTML += `
                    <div style="background:#111; padding:10px; border-radius:5px; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:white; font-weight:bold;">${jugador}</span>
                        <button class="btn-secondary" style="border-color:var(--red); color:var(--red); padding:5px 10px; font-size:0.75rem;" onclick="eliminarInscrito('${torneoId}', '1v1', '${jugador}')"><i class="fas fa-trash"></i> EXPULSAR</button>
                    </div>
                `;
            });
        } else {
            const equipos = data.lista_equipos || [];
            if(equipos.length === 0) listaCont.innerHTML = "<p style='color:#666; text-align:center;'>No hay escuadras inscritas aún.</p>";

            equipos.forEach(eq => {
                listaCont.innerHTML += `
                    <div style="background:#111; padding:10px; border-radius:5px; border:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <span style="color:var(--blue); font-weight:bold; font-size:1.1rem;">${eq.nombre}</span><br>
                            <span style="color:#aaa; font-size:0.8rem;">Integrantes: <strong style="color:white;">${eq.miembros.join(', ')}</strong></span>
                        </div>
                        <button class="btn-secondary" style="border-color:var(--red); color:var(--red); padding:5px 10px; font-size:0.75rem;" onclick="eliminarInscrito('${torneoId}', 'equipos', '${eq.nombre}')"><i class="fas fa-trash"></i> EXPULSAR EQUIPO</button>
                    </div>
                `;
            });
        }
    });
};

window.alternarCheckIn = async function(torneoId, estaAbierto) {
    const accion = estaAbierto ? 'cerrar' : 'abrir';
    if (!confirm(`¿Deseas ${accion} el check-in de este evento?`)) return;
    await db.collection('torneos').doc(torneoId).update({ checkInAbierto: !estaAbierto });
};

window.eliminarInscrito = function(torneoId, tipo, nombre) {
    if(!confirm(`⚠️ ¿Estás completamente seguro de eliminar a ${nombre} del torneo?`)) return;

    const ref = db.collection('torneos').doc(torneoId);

    if(tipo === '1v1') {
        ref.update({
            lista_inscriptos: firebase.firestore.FieldValue.arrayRemove(nombre)
        });
    } else {
        ref.get().then(doc => {
            const equipos = doc.data().lista_equipos || [];
            const nuevosEquipos = equipos.filter(eq => eq.nombre !== nombre);
            ref.update({ lista_equipos: nuevosEquipos });
        });
    }
};

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

    if (data.requiereCheckIn === true) {
        const confirmados = data.checkIns || [];
        participantes = participantes.filter(participante => confirmados.includes(participante));
        if (participantes.length < 2) {
            return alert(`Solo hay ${participantes.length} participante(s) con check-in confirmado. Abre el check-in o espera más confirmaciones antes de generar los cruces.`);
        }
    }

    if (participantes.length < 2) return alert("Se necesitan al menos 2 participantes para generar combates.");

    const partidos = [];

    if (data.tipo === 'liga_grupos') {
        // LIGA POR GRUPOS: Dividir participantes en Grupo A y Grupo B
        const sorteados = participantes.sort(() => Math.random() - 0.5);
        const mitad = Math.ceil(sorteados.length / 2);
        const grupoA = sorteados.slice(0, mitad);
        const grupoB = sorteados.slice(mitad);

        // Partidos Grupo A
        for (let i = 0; i < grupoA.length; i++) {
            for (let j = i + 1; j < grupoA.length; j++) {
                partidos.push({ p1: grupoA[i], p2: grupoA[j], ganador: "", ronda: 1, grupo: 'A' });
            }
        }

        // Partidos Grupo B
        for (let i = 0; i < grupoB.length; i++) {
            for (let j = i + 1; j < grupoB.length; j++) {
                partidos.push({ p1: grupoB[i], p2: grupoB[j], ganador: "", ronda: 1, grupo: 'B' });
            }
        }

        // Partido de la Gran Final (Líder Grupo A vs Líder Grupo B)
        partidos.push({ p1: "Líder Grupo A", p2: "Líder Grupo B", ganador: "", ronda: 2, isFinal: true });
    } else if (data.tipo === 'liga') {
        // LIGA: todos contra todos, un único partido por cada par posible.
        // No hay "rondas" de eliminación — todos los cruces se cargan de una,
        // y la clasificación se calcula sola con la tabla de posiciones.
        for (let i = 0; i < participantes.length; i++) {
            for (let j = i + 1; j < participantes.length; j++) {
                partidos.push({ p1: participantes[i], p2: participantes[j], ganador: "", ronda: 1 });
            }
        }
    } else {
        // TORNEO: eliminación directa con sorteo aleatorio (igual que siempre)
        const sorteados = participantes.sort(() => Math.random() - 0.5);
        for (let i = 0; i < sorteados.length; i += 2) {
            if (sorteados[i+1]) {
                partidos.push({ p1: sorteados[i], p2: sorteados[i+1], ganador: "", ronda: 1 });
            } else {
                partidos.push({ p1: sorteados[i], p2: "BYE", ganador: sorteados[i], ronda: 1 });
            }
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

    batch.update(torneoRef, { estado: "iniciado", campeon: "", checkInAbierto: false });
    await batch.commit();

    alert("¡Los cruces han sido forjados! El torneo ha comenzado.");
};

window.abrirAdminPartidos = async function(torneoId, torneoNombre, creador, formato) {
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

    // Necesitamos saber si es Liga o Torneo para decidir cómo mostrar los partidos.
    const torneoSnap = await db.collection('torneos').doc(torneoId).get();
    const tipoEvento = (torneoSnap.data() || {}).tipo;
    const esLiga = tipoEvento === 'liga' || tipoEvento === 'liga_grupos';

    db.collection('torneos').doc(torneoId).collection('llaves').orderBy('ronda', 'desc').onSnapshot(snap => {
        const contenedor = document.getElementById('contenedor-admin-partidos');
        const btnSiguienteRonda = document.getElementById('btn-siguiente-ronda');
        contenedor.innerHTML = "";

        if (snap.empty) {
            btnSiguienteRonda.style.display = 'none';
            return;
        }

        if (esLiga) {
            const partidosLiga = [];
            snap.forEach(doc => partidosLiga.push({ id: doc.id, ...doc.data() }));

            if (tipoEvento === 'liga_grupos') {
                const partidosA = partidosLiga.filter(p => p.grupo === 'A');
                const partidosB = partidosLiga.filter(p => p.grupo === 'B');
                const partidoFinal = partidosLiga.find(p => p.isFinal);

                const tablaA = calcularTablaPosiciones(partidosA);
                const tablaB = calcularTablaPosiciones(partidosB);

                const liderA = tablaA[0]?.nombre;
                const liderB = tablaB[0]?.nombre;

                const faltanA = partidosA.some(p => !p.ganador);
                const faltanB = partidosB.some(p => !p.ganador);

                // Si se jugaron todos los partidos de los grupos, actualizar finalistas
                if (partidoFinal && liderA && liderB && !faltanA && !faltanB && (partidoFinal.p1 !== liderA || partidoFinal.p2 !== liderB)) {
                    db.collection('torneos').doc(torneoId).collection('llaves').doc(partidoFinal.id).update({
                        p1: liderA,
                        p2: liderB
                    });
                }

                contenedor.innerHTML += "<h4 style='color: gold; margin-bottom: 10px;'><i class='fas fa-trophy'></i> GRUPO A</h4>";
                contenedor.innerHTML += generarTablaPosicionesHTML(tablaA);

                contenedor.innerHTML += "<h4 style='color: #00ffff; margin: 20px 0 10px 0;'><i class='fas fa-trophy'></i> GRUPO B</h4>";
                contenedor.innerHTML += generarTablaPosicionesHTML(tablaB);

                if (partidoFinal) {
                    contenedor.innerHTML += "<h4 style='color: #ff00ff; margin: 25px 0 15px 0; border-top: 1px solid #333; padding-top: 15px;'><i class='fas fa-crown'></i> GRAN FINAL</h4>";
                    contenedor.innerHTML += generarFilaAdminPartidoHTML(torneoId, partidoFinal, partidoFinal.id, false);
                }

                contenedor.innerHTML += "<h4 style='color: var(--blue); margin: 25px 0 15px 0; border-bottom: 1px solid #333; padding-bottom:8px;'>Fixture de la Fase de Grupos</h4>";
                partidosLiga.filter(p => !p.isFinal).forEach(partido => {
                    contenedor.innerHTML += generarFilaAdminPartidoHTML(torneoId, partido, partido.id, false);
                });

                if (partidoFinal && partidoFinal.ganador) {
                    btnSiguienteRonda.style.display = 'block';
                    btnSiguienteRonda.innerText = `CORONAR A ${partidoFinal.ganador} COMO CAMPEÓN DE LA LIGA`;
                    btnSiguienteRonda.style.background = 'gold';
                    btnSiguienteRonda.style.color = 'black';
                    btnSiguienteRonda.onclick = () => declararCampeon(torneoId, partidoFinal.ganador);
                } else {
                    btnSiguienteRonda.style.display = 'none';
                }
            } else {
                contenedor.innerHTML += generarTablaPosicionesHTML(calcularTablaPosiciones(partidosLiga));

                partidosLiga.forEach(partido => {
                    contenedor.innerHTML += generarFilaAdminPartidoHTML(torneoId, partido, partido.id, false);
                });

                const tabla = calcularTablaPosiciones(partidosLiga);
                const lider = tabla[0];
                const faltanResultados = partidosLiga.some(p => !p.ganador);

                if (lider && !faltanResultados) {
                    btnSiguienteRonda.style.display = 'block';
                    btnSiguienteRonda.innerText = `CORONAR A ${lider.nombre} COMO CAMPEÓN (1° en la tabla)`;
                    btnSiguienteRonda.style.background = 'gold';
                    btnSiguienteRonda.style.color = 'black';
                    btnSiguienteRonda.onclick = () => declararCampeon(torneoId, lider.nombre);
                } else {
                    btnSiguienteRonda.style.display = 'none';
                }
            }
            return;
        }

        // --- MODO TORNEO: eliminación directa, igual que siempre ---
        let todosTienenGanador = true;
        let partidosRondaActual = 0;
        let ganadoresParaSiguienteRonda = [];
        let rondaMasAlta = 1;

        snap.forEach(doc => {
            const partido = doc.data();
            const partidoId = doc.id;

            if (partido.ronda > rondaMasAlta) rondaMasAlta = partido.ronda;
            if (!partido.ganador) todosTienenGanador = false;

            contenedor.innerHTML += generarFilaAdminPartidoHTML(torneoId, partido, partidoId, true);
        });

        snap.forEach(doc => {
            if (doc.data().ronda === rondaMasAlta) {
                partidosRondaActual++;
                if(doc.data().ganador) ganadoresParaSiguienteRonda.push(doc.data().ganador);
            }
        });

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

window.setGanadorManual = async function(torneoId, partidoId, ganadorName) {
    if (!confirm(`¿Declarar a ${ganadorName} como vencedor de este combate?`)) return;

    const partidoRef = db.collection('torneos').doc(torneoId).collection('llaves').doc(partidoId);
    const partidoSnap = await partidoRef.get();
    const partido = partidoSnap.data();
    if (!partido) return;

    // Guard: si este partido ya tenía un ganador cargado, no volvemos a
    // sumar partidas ni a mover el ELO. Sin esto, corregir un resultado
    // dos veces duplicaba las estadísticas y el ELO de todos los
    // involucrados cada vez que un admin tocaba el botón de nuevo.
    if (partido.ganador && partido.ganador !== "") {
        alert("Este combate ya tenía un ganador cargado. Si fue un error, contactá a un admin para corregirlo manualmente en Firestore (no se puede recalcular el ELO automáticamente).");
        return;
    }

    await partidoRef.update({ ganador: ganadorName });

    // Registramos partidas jugadas/ganadas y ELO. No aplica a los "BYE"
    // porque nunca se jugaron.
    if (partido.p2 !== "BYE") {
        const perdedorName = (ganadorName === partido.p1) ? partido.p2 : partido.p1;
        const torneoSnap = await db.collection('torneos').doc(torneoId).get();
        const torneoData = torneoSnap.data() || {};

        const obtenerNicks = (nombre) => {
            if (torneoData.formato === '1v1') return [nombre];
            const equipo = (torneoData.lista_equipos || []).find(eq => eq.nombre === nombre);
            return (equipo && equipo.miembros) ? equipo.miembros : [];
        };

        const nicksGanador = obtenerNicks(ganadorName);
        const nicksPerdedor = obtenerNicks(perdedorName);

        // 1) Contadores de partidas jugadas/ganadas e historial de partidas.
        const actualizarStats = async (nicks, gano, rivalName) => {
            for (const nick of nicks) {
                const ninjaSnap = await db.collection('ninjas').where('nick', '==', nick).get();
                if (!ninjaSnap.empty) {
                    const docRef = ninjaSnap.docs[0].ref;
                    const dataNinja = ninjaSnap.docs[0].data();
                    const historial = dataNinja.historialPartidos || [];
                    historial.push({
                        fecha: Date.now(),
                        torneo: torneoData.nombre || 'Torneo',
                        rival: rivalName,
                        resultado: gano ? 'Victoria' : 'Derrota'
                    });

                    docRef.update({
                        partidasJugadas: firebase.firestore.FieldValue.increment(1),
                        partidasGanadas: firebase.firestore.FieldValue.increment(gano ? 1 : 0),
                        historialPartidos: historial.slice(-20)
                    });
                }
            }
        };
        await actualizarStats(nicksGanador, true, perdedorName);
        await actualizarStats(nicksPerdedor, false, ganadorName);

        // 2) ELO: cada lado se mide contra el ELO promedio del equipo
        //    rival, así ganarle a un rival con más ELO que el tuyo
        //    te da más puntos que ganarle a uno más débil.
        const eloPromGanador = await obtenerEloPromedioEquipo(nicksGanador);
        const eloPromPerdedor = await obtenerEloPromedioEquipo(nicksPerdedor);

        for (const nick of nicksGanador) await actualizarEloJugador(nick, eloPromPerdedor, true);
        for (const nick of nicksPerdedor) await actualizarEloJugador(nick, eloPromGanador, false);

        // 3) ELO de clanes: si el equipo ganador y/o perdedor coincide en
        //    nombre con un clan persistente, ese clan también mueve su ELO.
        //    Solo aplica a formatos de equipo, un 1v1 no tiene clanes en juego.
        if (torneoData.formato !== '1v1') {
            await actualizarEloClanesSiCorresponde(ganadorName, perdedorName);
        }
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
            creador: currentUserName,
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
// PUSH NOTIFICATIONS REGISTRATION
// ==========================================
window.solicitarPermisoNotificaciones = async function() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.log("Notificaciones Push no soportadas en este navegador.");
        return;
    }
    try {
        const permiso = await Notification.requestPermission();
        if (permiso === 'granted') {
            const reg = await navigator.serviceWorker.ready;
            if (reg.pushManager) {
                let sub = await reg.pushManager.getSubscription();
                if (!sub) {
                    sub = await reg.pushManager.subscribe({
                        userVisibleOnly: true
                    }).catch(e => console.log("Subscripción Push sin VAPID key local:", e.message));
                }
                if (sub && currentUserId) {
                    await db.collection('ninjas').doc(currentUserId).update({
                        fcmTokens: firebase.firestore.FieldValue.arrayUnion(JSON.stringify(sub))
                    });
                }
            }
        }
    } catch (err) {
        console.log("Error al solicitar permiso de notificaciones:", err);
    }
};

// ==========================================
// UTILIDADES (CERRAR MODALES, SESIÓN)
// ==========================================
window.cerrarModalPerfil = function(e) { if(e) e.preventDefault(); history.back(); };
window.cerrarSesion = function() { auth.signOut().then(() => window.location.reload()); };
