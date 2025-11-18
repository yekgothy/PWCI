// =============================================================================
// CREATE POST CONTROLLER
// =============================================================================
// Maneja la creación de nuevas publicaciones

const API_BASE_URL = 'http://localhost/PWCI/PWCI-Backend/api.php';

// =============================================================================
// STATE MANAGEMENT
// =============================================================================
let categorias = [];
let mundiales = [];

// =============================================================================
// INITIALIZATION
// =============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Debes iniciar sesión para crear una publicación');
        window.location.href = 'login.html';
        return;
    }

    // Cargar datos necesarios
    await loadCategories();
    await loadWorldCups();
    
    // Inicializar eventos
    initializeFormEvents();
});

// =============================================================================
// LOAD DATA FROM API
// =============================================================================

/**
 * Carga las categorías desde la API
 */
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categorias`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar categorías');
        }

        const data = await response.json();
        categorias = data.data || [];
        renderCategories();
    } catch (error) {
        console.error('Error loading categories:', error);
        showError('No se pudieron cargar las categorías');
    }
}

/**
 * Carga los mundiales desde la API
 */
async function loadWorldCups() {
    try {
        const response = await fetch(`${API_BASE_URL}/mundiales`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar mundiales');
        }

        const data = await response.json();
        mundiales = data.data || [];
        renderWorldCups();
    } catch (error) {
        console.error('Error loading world cups:', error);
        showError('No se pudieron cargar los mundiales');
    }
}

// =============================================================================
// RENDER FUNCTIONS
// =============================================================================

/**
 * Renderiza las categorías en el select
 */
function renderCategories() {
    const categorySelect = document.getElementById('category');
    if (!categorySelect) return;

    // Limpiar opciones existentes (excepto la primera)
    categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';

    // Agregar categorías de la API
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.idCategoria;
        option.textContent = categoria.nombre;
        option.dataset.color = categoria.color;
        categorySelect.appendChild(option);
    });
}

/**
 * Renderiza los mundiales en el select
 */
function renderWorldCups() {
    const worldCupSelect = document.getElementById('mundial');
    if (!worldCupSelect) return;

    // Limpiar opciones existentes (excepto la primera)
    worldCupSelect.innerHTML = '<option value="">Selecciona un mundial</option>';

    // Agregar mundiales de la API
    mundiales.forEach(mundial => {
        const option = document.createElement('option');
        option.value = mundial.idMundial;
        option.textContent = `${mundial.nombreOficial} (${mundial.anio})`;
        worldCupSelect.appendChild(option);
    });
}

// =============================================================================
// FORM EVENTS
// =============================================================================

/**
 * Inicializa todos los eventos del formulario
 */
function initializeFormEvents() {
    const form = document.getElementById('createPostForm');
    const imageUrlInput = document.getElementById('imageUrl');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    const removeImageBtn = document.getElementById('removeImage');
    const contentTextarea = document.getElementById('content');
    const charCounter = document.getElementById('charCounter');

    // Evento de submit del formulario
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Preview de imagen
    if (imageUrlInput) {
        imageUrlInput.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url && isValidImageUrl(url)) {
                if (previewImage) {
                    previewImage.src = url;
                    previewImage.onerror = () => {
                        imagePreview.classList.add('hidden');
                    };
                    previewImage.onload = () => {
                        imagePreview.classList.remove('hidden');
                    };
                }
            } else {
                if (imagePreview) {
                    imagePreview.classList.add('hidden');
                }
            }
        });
    }

    // Remover imagen
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            imageUrlInput.value = '';
            imagePreview.classList.add('hidden');
        });
    }

    // Contador de caracteres
    if (contentTextarea && charCounter) {
        contentTextarea.addEventListener('input', (e) => {
            const length = e.target.value.length;
            const maxLength = 2000;
            const remaining = maxLength - length;
            
            charCounter.textContent = `${remaining} caracteres restantes`;
            
            if (remaining < 100) {
                charCounter.classList.add('text-red-500');
                charCounter.classList.remove('text-neutral-500');
            } else {
                charCounter.classList.remove('text-red-500');
                charCounter.classList.add('text-neutral-500');
            }
        });
    }
}

/**
 * Valida si una URL es una imagen válida
 */
function isValidImageUrl(url) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const urlLower = url.toLowerCase();
    return imageExtensions.some(ext => urlLower.includes(ext)) || 
           urlLower.includes('unsplash.com') ||
           urlLower.includes('imgur.com') ||
           urlLower.includes('pravatar.cc');
}

/**
 * Maneja el envío del formulario
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    // Obtener valores del formulario
    const titulo = document.getElementById('title').value.trim();
    const contenido = document.getElementById('content').value.trim();
    const idCategoria = document.getElementById('category').value;
    const idMundial = document.getElementById('mundial').value;
    const urlMultimedia = document.getElementById('imageUrl').value.trim();

    // Validaciones
    if (!titulo || titulo.length < 5) {
        showError('El título debe tener al menos 5 caracteres');
        return;
    }

    if (!contenido || contenido.length < 20) {
        showError('El contenido debe tener al menos 20 caracteres');
        return;
    }

    if (!idCategoria) {
        showError('Debes seleccionar una categoría');
        return;
    }

    if (!idMundial) {
        showError('Debes seleccionar un mundial');
        return;
    }

    // Preparar datos
    const postData = {
        titulo,
        contenido,
        idCategoria: parseInt(idCategoria),
        idMundial: parseInt(idMundial)
    };

    // Agregar imagen si existe
    if (urlMultimedia) {
        postData.urlMultimedia = urlMultimedia;
    }

    // Mostrar loading
    const submitBtn = document.getElementById('submitBtn');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publicando...';
    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');

    try {
        await createPost(postData);
    } catch (error) {
        console.error('Error creating post:', error);
        showError('Error al crear la publicación. Intenta de nuevo.');
    } finally {
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

/**
 * Crea una nueva publicación en la API
 */
async function createPost(postData) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        alert('Sesión expirada. Por favor inicia sesión nuevamente.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/publicaciones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(postData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al crear la publicación');
        }

        // Mostrar mensaje de éxito
        showSuccess('¡Publicación creada exitosamente! Está pendiente de aprobación.');
        
        // Redirigir al feed después de 2 segundos
        setTimeout(() => {
            window.location.href = 'feed.html';
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// =============================================================================
// UI HELPERS
// =============================================================================

/**
 * Muestra un mensaje de error
 */
function showError(message) {
    // Remover mensajes anteriores
    const existingAlert = document.querySelector('.alert-error');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert-error fixed top-20 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
    alertDiv.innerHTML = `
        <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(alertDiv);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

/**
 * Muestra un mensaje de éxito
 */
function showSuccess(message) {
    // Remover mensajes anteriores
    const existingAlert = document.querySelector('.alert-success');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert-success fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
    alertDiv.innerHTML = `
        <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(alertDiv);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// =============================================================================
// STYLES FOR ANIMATIONS
// =============================================================================
const style = document.createElement('style');
style.textContent = `
    @keyframes fade-in {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animate-fade-in {
        animation: fade-in 0.3s ease-out;
    }
`;
document.head.appendChild(style);
