// ==========================================
// PARCHE V3.22: RESTAURAR GREMIO Y ABISMO
// ==========================================
function cargarAnunciosGremio() { 
    const lista = document.getElementById('lista-anuncios'); 
    if(!lista) return; 
    db.collection('anuncios_gremio').orderBy('timestamp', 'desc').limit(15).onSnapshot(snap => { 
        lista.innerHTML = ""; 
        if(snap.empty) { lista.innerHTML = "<p style='color:#888; text-align:center;'>El tablón está vacío.</p>"; return; } 
        snap.forEach(doc => { 
            const d = doc.data(); 
            lista.innerHTML += `
                <div style="background:#111; padding:15px; border-radius:8px; border-left:3px solid var(--blue); margin-bottom:10px;">
                    <strong style="color:var(--blue); cursor:pointer;" onclick="abrirPerfil('${d.usuario}')"><i class="fas fa-user-ninja"></i> ${d.usuario}</strong>
                    <div style="margin-top: 8px; font-size: 0.9rem;">
                        <span style="color:#ccc;"><strong>Busca:</strong> ${d.busco}</span> | 
                        <span style="color:#ccc;"><strong>Es:</strong> ${d.soy}</span>
                    </div>
                    <p style="color:#888; font-size:0.85rem; font-style:italic; margin-top:5px; border-top: 1px dashed #333; padding-top: 5px;">"${d.mensaje}"</p>
                </div>`; 
        }); 
    }); 
}
