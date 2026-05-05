document.addEventListener('DOMContentLoaded', () => {
    // CHAT
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-msg');
    const chatMessages = document.getElementById('chat-messages');

    function enviarMsg() {
        const txt = chatInput.value.trim();
        if(txt !== "") {
            const div = document.createElement('div');
            div.className = 'msg';
            div.innerHTML = `<strong class="user jonin">Tú:</strong> ${txt}`;
            chatMessages.appendChild(div);
            chatInput.value = "";
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    if(sendBtn) sendBtn.addEventListener('click', enviarMsg);
    if(chatInput) chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') enviarMsg(); });

    // FILTROS
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.torneo-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filtro = btn.textContent.toLowerCase();
            cards.forEach(card => {
                const formato = card.querySelector('.torneo-formato').textContent.toLowerCase();
                card.style.display = (filtro === 'todos' || formato === filtro) ? 'block' : 'none';
            });
        });
    });
});
