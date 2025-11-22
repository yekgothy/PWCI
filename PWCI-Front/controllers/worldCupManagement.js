/**
 * Controlador para la gestión de mundiales (Admin)
 */

const API_BASE_URL = 'http://localhost/PWCI/PWCI-Backend/api.php';

// Estado global
let worldCups = [];
let editingWorldCup = null;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando gestión de mundiales...');
    
    // Verificar que sea admin
    if (!checkAdminAccess()) {
        return;
    }
    
    // Cargar mundiales
    loadWorldCups();
    
    // Setup event listeners
    setupEventListeners();
});

// ============================================
// VERIFICAR ACCESO ADMIN
// ============================================
function checkAdminAccess() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken || !userData || userData.rol !== 'admin') {
        alert('⚠️ Acceso denegado. Solo administradores pueden acceder.');
        window.location.href = '../pages/feed.html';
        return false;
    }
    
    return true;
}

function getAuthToken() {
    return localStorage.getItem('authToken');
}

// ============================================
// CARGAR MUNDIALES
// ============================================
async function loadWorldCups() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/mundiales`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.status === 200 && data.data) {
            worldCups = data.data;
            console.log(`✅ ${worldCups.length} mundiales cargados`);
            renderWorldCups();
            updateStats();
        } else {
            showError('No se pudieron cargar los mundiales');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar mundiales');
    }
}

// ============================================
// RENDERIZAR MUNDIALES
// ============================================
function renderWorldCups() {
    const container = document.getElementById('worldCupsContainer');
    if (!container) return;
    
    if (worldCups.length === 0) {
        container.innerHTML = '<p class="text-neutral-500 text-center py-8">No hay mundiales registrados</p>';
        return;
    }
    
    container.innerHTML = worldCups.map(wc => `
        <div class="bg-white rounded-xl shadow-md border border-neutral-200 p-6 hover:shadow-lg transition-shadow">
            <!-- Header -->
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center space-x-3">
                    ${wc.logo ? 
                        `<img src="${wc.logo}" alt="${wc.paisSede}" class="w-16 h-16 object-contain rounded-lg border border-neutral-200">` :
                        `<div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">${wc.anio}</div>`
                    }
                    <div>
                        <h3 class="text-xl font-bold text-neutral-900">${wc.paisSede} ${wc.anio}</h3>
                        ${wc.nombreOficial ? `<p class="text-sm text-neutral-600">${wc.nombreOficial}</p>` : ''}
                    </div>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(wc.estado)}">${getEstadoLabel(wc.estado)}</span>
            </div>
            
            <!-- Info -->
            <div class="space-y-2 mb-4">
                ${wc.fechaInicio && wc.fechaFin ? 
                    `<p class="text-sm text-neutral-600">📅 ${formatDate(wc.fechaInicio)} - ${formatDate(wc.fechaFin)}</p>` : ''}
                <p class="text-sm text-neutral-600">🏆 ${wc.numeroEquipos || 32} equipos</p>
                ${wc.descripcion ? `<p class="text-sm text-neutral-500 line-clamp-2">${wc.descripcion}</p>` : ''}
            </div>
            
            <!-- Actions -->
            <div class="flex space-x-2">
                <button onclick="editWorldCup(${wc.idMundial})" class="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                    ✏️ Editar
                </button>
                <button onclick="deleteWorldCup(${wc.idMundial})" class="flex-1 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                    🗑️ Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================
// ACTUALIZAR ESTADÍSTICAS
// ============================================
function updateStats() {
    const totalElement = document.getElementById('totalWorldCups');
    const proximoElement = document.getElementById('nextWorldCup');
    
    if (totalElement) {
        totalElement.textContent = worldCups.length;
    }
    
    if (proximoElement) {
        const proximo = worldCups.find(wc => wc.estado === 'proximo');
        proximoElement.textContent = proximo ? `${proximo.paisSede} ${proximo.anio}` : 'N/A';
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    const newWorldCupBtn = document.getElementById('newWorldCupBtn');
    if (newWorldCupBtn) {
        newWorldCupBtn.addEventListener('click', () => showWorldCupModal(null));
    }
    
    const worldCupForm = document.getElementById('worldCupForm');
    if (worldCupForm) {
        worldCupForm.addEventListener('submit', handleSubmitWorldCup);
    }
}

// ============================================
// MODAL
// ============================================
function showWorldCupModal(worldCup = null) {
    console.log('🔍 showWorldCupModal llamado con:', worldCup);
    editingWorldCup = worldCup;
    
    const modal = document.getElementById('worldCupModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('worldCupForm');
    
    if (!modal || !form) {
        console.error('❌ Modal o formulario no encontrado');
        return;
    }
    
    // Configurar título
    if (modalTitle) {
        modalTitle.textContent = worldCup ? 'Editar Mundial' : 'Nuevo Mundial';
    }
    
    // Llenar formulario si es edición
    if (worldCup) {
        document.getElementById('worldCupYear').value = worldCup.anio || '';
        document.getElementById('worldCupCountry').value = worldCup.paisSede || '';
        document.getElementById('worldCupName').value = worldCup.nombreOficial || '';
        document.getElementById('worldCupLogo').value = worldCup.logo || '';
        document.getElementById('worldCupDescription').value = worldCup.descripcion || '';
        document.getElementById('worldCupStartDate').value = worldCup.fechaInicio || '';
        document.getElementById('worldCupEndDate').value = worldCup.fechaFin || '';
        document.getElementById('worldCupTeams').value = worldCup.numeroEquipos || 32;
        document.getElementById('worldCupStatus').value = worldCup.estado || 'proximo';
    } else {
        form.reset();
        document.getElementById('worldCupTeams').value = 32;
        document.getElementById('worldCupStatus').value = 'proximo';
    }
    
    // Mostrar modal
    modal.classList.remove('hidden');
}

function closeWorldCupModal() {
    const modal = document.getElementById('worldCupModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editingWorldCup = null;
}

// ============================================
// CREAR/ACTUALIZAR MUNDIAL
// ============================================
async function handleSubmitWorldCup(e) {
    e.preventDefault();
    
    const token = getAuthToken();
    const anio = parseInt(document.getElementById('worldCupYear').value);
    const paisSede = document.getElementById('worldCupCountry').value.trim();
    const nombreOficial = document.getElementById('worldCupName').value.trim();
    const logo = document.getElementById('worldCupLogo').value.trim();
    const descripcion = document.getElementById('worldCupDescription').value.trim();
    const fechaInicio = document.getElementById('worldCupStartDate').value;
    const fechaFin = document.getElementById('worldCupEndDate').value;
    const numeroEquipos = parseInt(document.getElementById('worldCupTeams').value);
    const estado = document.getElementById('worldCupStatus').value;
    
    console.log('🔍 Editando mundial:', editingWorldCup);
    console.log('🔍 Datos del formulario:', { anio, paisSede, nombreOficial });
    
    const validationError = validateWorldCupForm({
        anio,
        paisSede,
        nombreOficial,
        logo,
        descripcion,
        fechaInicio,
        fechaFin,
        numeroEquipos,
        estado
    });
    if (validationError) {
        alert(validationError);
        return;
    }
    
    const worldCupData = {
        anio,
        paisSede,
        nombreOficial: nombreOficial || null,
        logo: logo || null,
        descripcion: descripcion || null,
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
        numeroEquipos,
        estado
    };
    
    try {
        const url = editingWorldCup 
            ? `${API_BASE_URL}/mundiales/${editingWorldCup.idMundial}`
            : `${API_BASE_URL}/mundiales`;
            
        const method = editingWorldCup ? 'PUT' : 'POST';
        
        console.log(`📤 ${method} ${url}`);
        console.log('📦 Body:', JSON.stringify(worldCupData));
        
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(worldCupData)
        });
        
        console.log('📥 Response status:', response.status);
        const data = await response.json();
        console.log('📥 Response data:', data);
        
        if (data.status === 200 || data.status === 201) {
            console.log('✅ Mundial guardado');
            closeWorldCupModal();
            await loadWorldCups();
            showSuccess(editingWorldCup ? 'Mundial actualizado correctamente' : 'Mundial creado correctamente');
        } else {
            console.error('❌ Error al guardar:', data);
            alert(data.message || 'Error al guardar mundial');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al guardar mundial: ' + error.message);
    }
}

// ============================================
// EDITAR MUNDIAL
// ============================================
function editWorldCup(id) {
    const worldCup = worldCups.find(wc => wc.idMundial === id);
    if (worldCup) {
        showWorldCupModal(worldCup);
    }
}

// ============================================
// ELIMINAR MUNDIAL
// ============================================
async function deleteWorldCup(id) {
    const worldCup = worldCups.find(wc => wc.idMundial === id);
    if (!worldCup) return;
    
    if (!confirm(`¿Eliminar el mundial "${worldCup.paisSede} ${worldCup.anio}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/mundiales/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.status === 200) {
            console.log('✅ Mundial eliminado');
            await loadWorldCups();
            showSuccess('Mundial eliminado correctamente');
        } else {
            alert(data.message || 'Error al eliminar mundial');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al eliminar mundial');
    }
}

// ============================================
// UTILIDADES
// ============================================
function getEstadoBadge(estado) {
    switch (estado) {
        case 'finalizado':
            return 'bg-neutral-100 text-neutral-700';
        case 'en_curso':
            return 'bg-green-100 text-green-700';
        case 'proximo':
            return 'bg-blue-100 text-blue-700';
        default:
            return 'bg-neutral-100 text-neutral-700';
    }
}

function getEstadoLabel(estado) {
    switch (estado) {
        case 'finalizado':
            return 'Finalizado';
        case 'en_curso':
            return 'En Curso';
        case 'proximo':
            return 'Próximo';
        default:
            return estado;
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showSuccess(message) {
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}

function validateWorldCupForm({ anio, paisSede, nombreOficial, logo, descripcion, fechaInicio, fechaFin, numeroEquipos, estado }) {
    if (!anio || Number.isNaN(anio)) {
        return 'Indica un año válido (por ejemplo 2026).';
    }
    if (anio < 1930 || anio > 2100) {
        return 'El año debe estar entre 1930 y 2100.';
    }
    if (!paisSede) {
        return 'El país sede es obligatorio.';
    }
    if (paisSede.length < 3) {
        return 'El país sede debe tener al menos 3 caracteres.';
    }
    if (paisSede.length > 120) {
        return 'El país sede no puede superar los 120 caracteres.';
    }
    if (nombreOficial && nombreOficial.length > 150) {
        return 'El nombre oficial no puede superar los 150 caracteres.';
    }
    if (logo && !isValidUrl(logo)) {
        return 'La URL del logo no es válida.';
    }
    if (descripcion && descripcion.length > 600) {
        return 'La descripción no puede superar los 600 caracteres.';
    }
    if (fechaInicio && Number.isNaN(Date.parse(fechaInicio))) {
        return 'La fecha de inicio no es válida.';
    }
    if (fechaFin && Number.isNaN(Date.parse(fechaFin))) {
        return 'La fecha de fin no es válida.';
    }
    if (fechaInicio && fechaFin) {
        const start = new Date(fechaInicio);
        const end = new Date(fechaFin);
        if (start > end) {
            return 'La fecha de inicio no puede ser posterior a la fecha de fin.';
        }
    }
    if (Number.isNaN(numeroEquipos) || numeroEquipos < 8 || numeroEquipos > 128) {
        return 'El número de equipos debe estar entre 8 y 128.';
    }
    const estadosValidos = ['proximo', 'en_curso', 'finalizado'];
    if (!estadosValidos.includes(estado)) {
        return 'Selecciona un estado válido.';
    }
    return null;
}

function isValidUrl(value) {
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol);
    } catch (_) {
        return false;
    }
}
