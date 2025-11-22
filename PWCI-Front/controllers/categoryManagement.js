/**
 * Controlador para la gestión de categorías (Admin)
 */

const API_BASE_URL = 'http://localhost/PWCI/PWCI-Backend/api.php';

// Estado global
let categories = [];
let editingCategory = null;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando gestión de categorías...');
    
    // Verificar que sea admin
    if (!checkAdminAccess()) {
        return;
    }
    
    // Cargar categorías
    loadCategories();
    
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
// CARGAR CATEGORÍAS
// ============================================
async function loadCategories() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/categorias`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.status === 200 && data.data) {
            categories = data.data;
            console.log(`✅ ${categories.length} categorías cargadas`);
            renderCategories();
            updateStats();
        } else {
            showError('No se pudieron cargar las categorías');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar categorías');
    }
}

// ============================================
// RENDERIZAR CATEGORÍAS
// ============================================
function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    
    if (!container) return;
    
    if (categories.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <p class="text-neutral-500 text-lg">No hay categorías registradas</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = categories.map(cat => `
        <div class="bg-white rounded-xl shadow-md border border-neutral-200 p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: ${cat.color || '#000000'}">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-neutral-900">${cat.nombre}</h3>
                        <span class="inline-block px-2 py-1 rounded text-xs font-medium ${cat.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${cat.activa ? 'Activa' : 'Inactiva'}
                        </span>
                    </div>
                </div>
            </div>
            
            <p class="text-neutral-600 text-sm mb-4 min-h-[40px]">${cat.descripcion || 'Sin descripción'}</p>
            
            <div class="flex items-center justify-between pt-4 border-t border-neutral-200">
                <div class="text-sm text-neutral-500">
                    ID: ${cat.idCategoria}
                </div>
                <div class="flex space-x-2">
                    <button onclick="editCategory(${cat.idCategoria})" class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors">
                        Editar
                    </button>
                    ${cat.activa ? `
                        <button onclick="toggleCategory(${cat.idCategoria}, false)" class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors">
                            Desactivar
                        </button>
                    ` : `
                        <button onclick="toggleCategory(${cat.idCategoria}, true)" class="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors">
                            Activar
                        </button>
                    `}
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// ACTUALIZAR ESTADÍSTICAS
// ============================================
function updateStats() {
    const totalElement = document.getElementById('totalCategories');
    const activasElement = document.getElementById('activeCategories');
    const inactivasElement = document.getElementById('inactiveCategories');
    
    if (totalElement) totalElement.textContent = categories.length;
    if (activasElement) activasElement.textContent = categories.filter(c => c.activa).length;
    if (inactivasElement) inactivasElement.textContent = categories.filter(c => !c.activa).length;
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    const newCategoryBtn = document.getElementById('newCategoryBtn');
    if (newCategoryBtn) {
        newCategoryBtn.addEventListener('click', () => showCategoryModal(null));
    }
    
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeCategoryModal);
    }
    
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleSubmitCategory);
    }
}

// ============================================
// MODAL
// ============================================
function showCategoryModal(category = null) {
    editingCategory = category;
    
    const modal = document.getElementById('categoryModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('categoryForm');
    
    if (!modal || !form) return;
    
    // Configurar título
    if (modalTitle) {
        modalTitle.textContent = category ? 'Editar Categoría' : 'Nueva Categoría';
    }
    
    // Llenar formulario si es edición
    if (category) {
        document.getElementById('categoryName').value = category.nombre || '';
        document.getElementById('categoryDescription').value = category.descripcion || '';
        document.getElementById('categoryColor').value = category.color || '#000000';
    } else {
        form.reset();
        document.getElementById('categoryColor').value = '#3B82F6'; // Azul por defecto
    }
    
    // Mostrar modal
    modal.classList.remove('hidden');
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editingCategory = null;
}

// ============================================
// CREAR/ACTUALIZAR CATEGORÍA
// ============================================
async function handleSubmitCategory(e) {
    e.preventDefault();
    
    const token = getAuthToken();
    const nombre = document.getElementById('categoryName').value.trim();
    const descripcion = document.getElementById('categoryDescription').value.trim();
    const color = document.getElementById('categoryColor').value;
    
    console.log('🔍 Datos del formulario:', { nombre, descripcion, color });
    console.log('🔍 Editando categoría:', editingCategory);
    
    const validationError = validateCategoryForm({ nombre, descripcion, color });
    if (validationError) {
        alert(validationError);
        return;
    }
    
    const categoryData = {
        nombre,
        descripcion,
        color
    };
    
    try {
        const url = editingCategory 
            ? `${API_BASE_URL}/categorias/${editingCategory.idCategoria}`
            : `${API_BASE_URL}/categorias`;
            
        const method = editingCategory ? 'PUT' : 'POST';
        
        console.log(`📤 ${method} ${url}`);
        console.log('📦 Body:', JSON.stringify(categoryData));
        
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });
        
        console.log('📥 Response status:', response.status);
        const data = await response.json();
        console.log('📥 Response data:', data);
        
        if (data.status === 200 || data.status === 201) {
            console.log('✅ Categoría guardada');
            closeCategoryModal();
            await loadCategories();
            showSuccess(editingCategory ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente');
        } else {
            console.error('❌ Error al guardar:', data);
            alert(data.message || 'Error al guardar categoría');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al guardar categoría: ' + error.message);
    }
}

// ============================================
// EDITAR CATEGORÍA
// ============================================
function editCategory(id) {
    const category = categories.find(c => c.idCategoria === id);
    if (category) {
        showCategoryModal(category);
    }
}

// ============================================
// ACTIVAR/DESACTIVAR CATEGORÍA
// ============================================
async function toggleCategory(id, activate) {
    const action = activate ? 'activar' : 'desactivar';
    
    if (!confirm(`¿Estás seguro de ${action} esta categoría?`)) {
        return;
    }
    
    const token = getAuthToken();
    
    try {
        const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ activa: activate })
        });
        
        const data = await response.json();
        
        if (data.status === 200) {
            console.log(`✅ Categoría ${action}da`);
            await loadCategories();
            showSuccess(`Categoría ${action}da correctamente`);
        } else {
            alert(data.message || `Error al ${action} categoría`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert(`Error al ${action} categoría`);
    }
}

// ============================================
// UTILIDADES
// ============================================
function showError(message) {
    console.error(message);
    // Podrías agregar un toast o notificación aquí
}

function showSuccess(message) {
    console.log(message);
    // Podrías agregar un toast o notificación aquí
    alert(message);
}

function validateCategoryForm({ nombre, descripcion, color }) {
    if (!nombre) {
        return 'El nombre de la categoría es obligatorio.';
    }
    if (nombre.length < 3) {
        return 'El nombre debe tener al menos 3 caracteres.';
    }
    if (nombre.length > 100) {
        return 'El nombre no puede superar los 100 caracteres.';
    }
    if (descripcion && descripcion.length > 300) {
        return 'La descripción no puede superar los 300 caracteres.';
    }
    const hexColorRegex = /^#([0-9a-fA-F]{3}){1,2}$/;
    if (color && !hexColorRegex.test(color)) {
        return 'Selecciona un color hexadecimal válido.';
    }
    return null;
}
