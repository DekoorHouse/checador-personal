// Configuración
const OFFICE_WIFI_NAME = "Oficina_Principal_5G"; 
const ADMIN_PIN = "1234"; // PIN por defecto
const REFRESH_RATE = 1000;

// Elementos del DOM - Main
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

// Elementos del DOM - Admin
const openAdminBtn = document.getElementById('open-admin');
const closeAdminBtn = document.getElementById('close-admin');
const adminPanel = document.getElementById('admin-panel');
const adminLogin = document.getElementById('admin-login');
const adminPinInput = document.getElementById('admin-pin');
const loginBtn = document.getElementById('login-btn');
const cancelLoginBtn = document.getElementById('cancel-login');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const adminLogsBody = document.getElementById('admin-logs-body');
const adminEmployeesBody = document.getElementById('admin-employees-body');
const newEmpNameInput = document.getElementById('new-emp-name');
const newEmpIdInput = document.getElementById('new-emp-id');
const addEmployeeBtn = document.getElementById('add-employee-btn');
const exportCsvBtn = document.getElementById('export-csv');
const clearLogsBtn = document.getElementById('clear-all-logs');

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

// 2. Validación de Red
async function checkNetwork() {
    /** En producción aquí validaríamos la IP pública contra la IP de la oficina */
    isAuthorized = true; 

    if (isAuthorized) {
        networkStatusEl.className = "status-badge status-online";
        networkTextEl.textContent = "CONECTADO A RED OFICINA";
        networkBlockedOverlay.style.display = 'none';
    } else {
        networkStatusEl.className = "status-badge status-offline";
        networkTextEl.textContent = "RED NO AUTORIZADA";
        networkBlockedOverlay.style.display = 'flex';
    }
}

// 3. Gestión de Empleados y Registros
function registerAttendance(type) {
    const id = employeeIdInput.value.trim();
    if (!id) {
        showNotification("Ingresa tu ID", "danger");
        return;
    }

    // Verificar si el ID existe en la base de datos de empleados
    const employees = getEmployees();
    const employee = employees.find(e => e.id === id);
    const displayName = employee ? employee.name : id;

    const entry = {
        id: id,
        name: displayName,
        type: type,
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('es-MX'),
        timestamp: new Date().getTime()
    };

    saveToHistory(entry);
    showNotification(`${type === 'IN' ? 'Entrada' : 'Salida'} registrada: ${displayName}`);
    employeeIdInput.value = '';
    renderHistory();
}

function getEmployees() {
    return JSON.parse(localStorage.getItem('attendance_employees') || '[]');
}

function saveEmployee(name, id) {
    const employees = getEmployees();
    if (employees.some(e => e.id === id)) {
        showNotification("Este ID ya existe", "danger");
        return false;
    }
    employees.push({ name, id });
    localStorage.setItem('attendance_employees', JSON.stringify(employees));
    return true;
}

function deleteEmployee(id) {
    let employees = getEmployees();
    employees = employees.filter(e => e.id !== id);
    localStorage.setItem('attendance_employees', JSON.stringify(employees));
    renderAdminEmployees();
}

// 4. Persistencia y Renderizado
function saveToHistory(entry) {
    const history = JSON.parse(localStorage.getItem('attendance_logs') || '[]');
    history.unshift(entry);
    localStorage.setItem('attendance_logs', JSON.stringify(history));
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('attendance_logs') || '[]');
    historyList.innerHTML = '';
    // Mostrar solo los últimos 5 en la pantalla principal
    history.slice(0, 5).forEach(item => {
        const li = document.createElement('li');
        li.className = `history-item ${item.type.toLowerCase()}`;
        li.innerHTML = `
            <div class="item-info">
                <span class="item-time">${item.time} - ${item.name}</span>
                <span class="item-type">${item.type === 'IN' ? 'Entrada' : 'Salida'}</span>
            </div>
            <div style="font-size: 0.7rem; color: #94a3b8;">${item.date}</div>
        `;
        historyList.appendChild(li);
    });
}

// 5. Lógica Administrativa
function renderAdminLogs() {
    const logs = JSON.parse(localStorage.getItem('attendance_logs') || '[]');
    adminLogsBody.innerHTML = '';
    logs.forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${log.name} <br><small style="color:var(--text-muted)">ID: ${log.id}</small></td>
            <td style="color:${log.type === 'IN' ? 'var(--success)' : 'var(--warning)'}">${log.type}</td>
            <td>${log.date}</td>
            <td>${log.time}</td>
        `;
        adminLogsBody.appendChild(tr);
    });
}

function renderAdminEmployees() {
    const employees = getEmployees();
    adminEmployeesBody.innerHTML = '';
    employees.forEach(emp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${emp.id}</td>
            <td>${emp.name}</td>
            <td><button class="btn-small btn-danger" onclick="deleteEmployee('${emp.id}')">Eliminar</button></td>
        `;
        adminEmployeesBody.appendChild(tr);
    });
}

function exportToCSV() {
    const logs = JSON.parse(localStorage.getItem('attendance_logs') || '[]');
    if (logs.length === 0) {
        showNotification("No hay datos para exportar", "danger");
        return;
    }
    
    let csv = "ID,Nombre,Tipo,Fecha,Hora\n";
    logs.forEach(log => {
        csv += `${log.id},${log.name},${log.type},${log.date},${log.time}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `asistencia_dekoor_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 6. Event Listeners
btnIn.addEventListener('click', () => registerAttendance('IN'));
btnOut.addEventListener('click', () => registerAttendance('OUT'));

openAdminBtn.addEventListener('click', () => adminLogin.style.display = 'flex');
cancelLoginBtn.addEventListener('click', () => {
    adminLogin.style.display = 'none';
    adminPinInput.value = '';
});

loginBtn.addEventListener('click', () => {
    if (adminPinInput.value === ADMIN_PIN) {
        adminLogin.style.display = 'none';
        adminPanel.style.display = 'flex';
        adminPinInput.value = '';
        renderAdminLogs();
        renderAdminEmployees();
    } else {
        showNotification("PIN Incorrecto", "danger");
    }
});

closeAdminBtn.addEventListener('click', () => adminPanel.style.display = 'none');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

addEmployeeBtn.addEventListener('click', () => {
    const name = newEmpNameInput.value.trim();
    const id = newEmpIdInput.value.trim();
    if (name && id) {
        if (saveEmployee(name, id)) {
            newEmpNameInput.value = '';
            newEmpIdInput.value = '';
            renderAdminEmployees();
            showNotification("Empleado añadido");
        }
    } else {
        showNotification("Completa todos los campos", "danger");
    }
});

exportCsvBtn.addEventListener('click', exportToCSV);

clearLogsBtn.addEventListener('click', () => {
    if (confirm("¿Estás seguro de borrar todo el historial?")) {
        localStorage.removeItem('attendance_logs');
        renderAdminLogs();
        renderHistory();
    }
});

function showNotification(message, type = "success") {
    notification.textContent = message;
    notification.style.background = type === "success" ? "var(--primary)" : "#ef4444";
    notification.style.color = "#fff";
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}

// Inicialización
setInterval(updateClock, 1000);
updateClock();
checkNetwork();
renderHistory();
