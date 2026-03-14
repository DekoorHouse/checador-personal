// Configuración
const OFFICE_WIFI_NAME = "Oficina_Principal_5G"; // Referencia
const REFRESH_RATE = 1000;

// Elementos del DOM
const timeEl = document.getElementById('time');
const dateEl = document.getElementById('date');
const networkStatusEl = document.getElementById('network-status');
const networkTextEl = document.getElementById('network-text');
const btnIn = document.getElementById('btn-in');
const btnOut = document.getElementById('btn-out');
const employeeIdInput = document.getElementById('employee-id');
const historyList = document.getElementById('history-list');
const notification = document.getElementById('notification');
const networkBlockedOverlay = document.getElementById('network-blocked');

// Estado de la aplicación
let isAuthorized = false;

// 1. Reloj en tiempo real
function updateClock() {
    const now = new Date();
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    timeEl.textContent = now.toLocaleTimeString('es-MX', timeOptions);
    dateEl.textContent = now.toLocaleDateString('es-MX', dateOptions).toUpperCase();
}

// 2. Simulación de Validación de Red
// En un entorno real, haríamos una petición a un servidor que verifique la IP Pública.
// Si la IP es la de la oficina, retornaría true.
async function checkNetwork() {
    networkTextEl.textContent = "Verificando red...";
    networkStatusEl.className = "status-badge status-offline";
    
    // Simulamos un retraso de red
    await new Promise(resolve => setTimeout(resolve, 1500));

    /** 
     * NOTA PARA EL USUARIO:
     * El navegador no permite leer el nombre del Wi-Fi por seguridad.
     * La mejor forma de implementar esto es:
     * 1. Verificar la IP Publica del cliente contra una lista permitida.
     * 2. O, usar Geolocalización para asegurar que está en las coordenadas de la oficina.
     */
    
    // Simulamos que el usuario ESTÁ en la red correcta para propósitos de demostración.
    // Cambiar a false para ver el bloqueo.
    isAuthorized = true; 

    if (isAuthorized) {
        networkStatusEl.className = "status-badge status-online";
        networkTextEl.textContent = "CONECTADO A RED OFICINA";
        networkBlockedOverlay.style.display = 'none';
        btnIn.disabled = false;
        btnOut.disabled = false;
    } else {
        networkStatusEl.className = "status-badge status-offline";
        networkTextEl.textContent = "RED NO AUTORIZADA";
        networkBlockedOverlay.style.display = 'flex';
        btnIn.disabled = true;
        btnOut.disabled = true;
    }
}

// 3. Registro de Asistencia
function registerAttendance(type) {
    const id = employeeIdInput.value.trim();
    if (!id) {
        showNotification("Por favor ingresa tu ID", "danger");
        employeeIdInput.focus();
        return;
    }

    const entry = {
        id: id,
        type: type,
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('es-MX')
    };

    saveToHistory(entry);
    showNotification(`${type === 'IN' ? 'Entrada' : 'Salida'} registrada: ${id}`);
    employeeIdInput.value = '';
    renderHistory();
}

// 4. Persistencia (Local Storage)
function saveToHistory(entry) {
    const history = JSON.parse(localStorage.getItem('attendance_history') || '[]');
    history.unshift(entry); // Añadir al inicio
    localStorage.setItem('attendance_history', JSON.stringify(history.slice(0, 10))); // Solo últimos 10
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('attendance_history') || '[]');
    historyList.innerHTML = '';

    history.forEach(item => {
        const li = document.createElement('li');
        li.className = `history-item ${item.type.toLowerCase()}`;
        li.innerHTML = `
            <div class="item-info">
                <span class="item-time">${item.time} - ${item.id}</span>
                <span class="item-type">${item.type === 'IN' ? 'Entrada' : 'Salida'}</span>
            </div>
            <div style="font-size: 0.7rem; color: #94a3b8;">${item.date}</div>
        `;
        historyList.appendChild(li);
    });
}

// 5. Utilidades
function showNotification(message, type = "success") {
    notification.textContent = message;
    notification.style.background = type === "success" ? "#fff" : "#ef4444";
    notification.style.color = type === "success" ? "#0f172a" : "#fff";
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Event Listeners
btnIn.addEventListener('click', () => registerAttendance('IN'));
btnOut.addEventListener('click', () => registerAttendance('OUT'));
document.getElementById('clear-history').addEventListener('click', () => {
    localStorage.removeItem('attendance_history');
    renderHistory();
});

// Inicialización
setInterval(updateClock, 1000);
updateClock();
checkNetwork();
renderHistory();
