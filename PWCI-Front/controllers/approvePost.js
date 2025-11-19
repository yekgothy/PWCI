/**
 * Controlador para la aprobación de publicaciones (Admin)
 * Permite ver, aprobar y rechazar publicaciones pendientes
 */

const API_BASE_URL = 'http://localhost/PWCI/PWCI-Backend/api.php';

// Estado global
let currentFilter = 'pendiente';
let posts = [];

/**
 * Verificar que el usuario sea administrador
 */
function checkAdminAccess() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken || !userData || userData.rol !== 'admin') {
        alert('⚠️ Acceso denegado. Solo administradores pueden acceder a esta página.');
        window.location.href = '../pages/feed.html';
        return false;
    }
    
    return true;
}

/**
 * Obtener publicaciones según el filtro
 */
async function loadPosts(estado = 'pendiente') {
    try {
        const authToken = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_BASE_URL}/publicaciones?estado=${estado}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar publicaciones');
        }
        
        const data = await response.json();
        posts = data.data || [];
        
        renderPosts();
        updateTabCounts();
        
    } catch (error) {
        console.error('Error:', error);
        showError('No se pudieron cargar las publicaciones');
    }
}

/**
 * Renderizar lista de publicaciones
 */
function renderPosts() {
    const container = document.getElementById('postsContainer');
    
    if (!container) return;
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-md border border-neutral-200 p-12 text-center">
                <svg class="w-16 h-16 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p class="text-neutral-500 text-lg">No hay publicaciones ${currentFilter === 'pendiente' ? 'pendientes' : currentFilter === 'aprobada' ? 'aprobadas' : 'rechazadas'}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = posts.map(post => `
        <div class="bg-white rounded-xl shadow-md border border-neutral-200 p-6" data-post-id="${post.idPublicacion}">
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
                        <span class="text-sm font-semibold text-neutral-600">${getInitials(post.nombreAutor)}</span>
                    </div>
                    <div>
                        <p class="font-semibold text-neutral-900">${post.nombreAutor || 'Usuario'}</p>
                        <p class="text-sm text-neutral-500">${formatDate(post.fechaPublicacion)}</p>
                    </div>
                </div>
                <span class="px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(post.estado)}">
                    ${getStatusText(post.estado)}
                </span>
            </div>
            
            <div class="mb-4">
                <h3 class="text-xl font-bold text-neutral-900 mb-2">${post.titulo}</h3>
                <p class="text-neutral-600 line-clamp-3">${post.contenido}</p>
            </div>
            
            ${getImageHTML(post)}
            
            <div class="flex items-center space-x-4 mb-4 text-sm text-neutral-600">
                <span class="inline-flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                    ${post.nombreCategoria || 'Sin categoría'}
                </span>
                <span class="inline-flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Mundial ${post.paisMundial || 'N/A'}
                </span>
            </div>
            
            ${currentFilter === 'pendiente' ? `
                <div class="flex space-x-3">
                    <button onclick="approvePost(${post.idPublicacion})" 
                            class="flex-1 bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        ✓ Aprobar
                    </button>
                    <button onclick="rejectPost(${post.idPublicacion})" 
                            class="flex-1 bg-white hover:bg-neutral-100 text-black border-2 border-black px-4 py-2 rounded-lg font-medium transition-colors">
                        ✕ Rechazar
                    </button>
                    <button onclick="viewPostDetails(${post.idPublicacion})" 
                            class="bg-neutral-200 hover:bg-neutral-300 text-black px-4 py-2 rounded-lg font-medium transition-colors">
                        Ver Detalles
                    </button>
                </div>
            ` : `
                <div class="flex space-x-3">
                    <button onclick="viewPostDetails(${post.idPublicacion})" 
                            class="flex-1 bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        Ver Detalles
                    </button>
                    ${currentFilter === 'rechazada' ? `
                        <button onclick="approvePost(${post.idPublicacion})" 
                                class="flex-1 bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            ✓ Aprobar
                        </button>
                    ` : ''}
                </div>
            `}
        </div>
    `).join('');
}

/**
 * Aprobar publicación
 */
async function approvePost(postId) {
    if (!confirm('¿Estás seguro de que quieres aprobar esta publicación?')) {
        return;
    }
    
    try {
        const authToken = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_BASE_URL}/publicaciones/${postId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                estado: 'aprobada'
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al aprobar publicación');
        }
        
        showSuccess('✓ Publicación aprobada exitosamente');
        
        // Recargar publicaciones
        await loadPosts(currentFilter);
        
    } catch (error) {
        console.error('Error:', error);
        showError('No se pudo aprobar la publicación');
    }
}

/**
 * Rechazar publicación
 */
async function rejectPost(postId) {
    if (!confirm('¿Estás seguro de que quieres rechazar esta publicación?')) {
        return;
    }
    
    try {
        const authToken = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_BASE_URL}/publicaciones/${postId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                estado: 'rechazada'
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al rechazar publicación');
        }
        
        showSuccess('✓ Publicación rechazada');
        
        // Recargar publicaciones
        await loadPosts(currentFilter);
        
    } catch (error) {
        console.error('Error:', error);
        showError('No se pudo rechazar la publicación');
    }
}

/**
 * Ver detalles de la publicación
 */
function viewPostDetails(postId) {
    window.open(`../pages/postDetails.html?id=${postId}`, '_blank');
}

/**
 * Actualizar contadores de tabs
 */
async function updateTabCounts() {
    try {
        const authToken = localStorage.getItem('authToken');
        
        // Obtener conteos para cada estado
        const estados = ['pendiente', 'aprobada', 'rechazada'];
        const counts = {};
        
        for (const estado of estados) {
            const response = await fetch(`${API_BASE_URL}/publicaciones?estado=${estado}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                counts[estado] = data.data?.length || 0;
            } else {
                counts[estado] = 0;
            }
        }
        
        // Actualizar UI
        const pendientesTab = document.getElementById('tabPendientes');
        const aprobadasTab = document.getElementById('tabAprobadas');
        const rechazadasTab = document.getElementById('tabRechazadas');
        
        if (pendientesTab) pendientesTab.textContent = `Pendientes (${counts.pendiente})`;
        if (aprobadasTab) aprobadasTab.textContent = `Aprobados (${counts.aprobada})`;
        if (rechazadasTab) rechazadasTab.textContent = `Rechazados (${counts.rechazada})`;
        
    } catch (error) {
        console.error('Error actualizando contadores:', error);
    }
}

/**
 * Cambiar filtro de publicaciones
 */
function changeFilter(estado) {
    currentFilter = estado;
    
    // Actualizar tabs activos
    document.querySelectorAll('[data-tab]').forEach(tab => {
        if (tab.dataset.tab === estado) {
            tab.classList.remove('border-transparent', 'text-neutral-500');
            tab.classList.add('border-black', 'text-black', 'font-bold');
        } else {
            tab.classList.remove('border-black', 'text-black', 'font-bold');
            tab.classList.add('border-transparent', 'text-neutral-500');
        }
    });
    
    // Cargar publicaciones con nuevo filtro
    loadPosts(estado);
}

/**
 * Utilidades
 */
function getInitials(nombreCompleto) {
    if (!nombreCompleto) return '??';
    const words = nombreCompleto.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function formatDate(dateString) {
    if (!dateString) return 'Fecha desconocida';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 60) return `Hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStatusBadgeClass(estado) {
    switch (estado) {
        case 'pendiente':
            return 'bg-neutral-200 text-black border border-black';
        case 'aprobada':
            return 'bg-black text-white';
        case 'rechazada':
            return 'bg-white text-black border-2 border-black';
        default:
            return 'bg-neutral-100 text-neutral-700';
    }
}

function getStatusText(estado) {
    switch (estado) {
        case 'pendiente':
            return 'Pendiente';
        case 'aprobada':
            return 'Aprobada';
        case 'rechazada':
            return 'Rechazada';
        default:
            return estado;
    }
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-black text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * Helper function para generar HTML de imagen de publicación
 */
function getImageHTML(post) {
    const BASE_URL = 'http://localhost/PWCI/PWCI-Backend';
    
    if (post.tieneBlob && post.tieneBlob == 1) {
        return `
            <div class="mb-4">
                <img src="${BASE_URL}/blob-api.php?action=download&tipo=publicacion&id=${post.idPublicacion}" 
                     alt="${post.titulo}" 
                     class="w-full h-48 object-cover rounded-lg"
                     onerror="this.style.display='none'">
            </div>
        `;
    } else if (post.urlMultimedia) {
        return `
            <div class="mb-4">
                <img src="${post.urlMultimedia}" 
                     alt="${post.titulo}" 
                     class="w-full h-48 object-cover rounded-lg"
                     onerror="this.style.display='none'">
            </div>
        `;
    }
    return '';
}

/**
 * Inicialización
 */
document.addEventListener('DOMContentLoaded', () => {
    // Verificar acceso de administrador
    if (!checkAdminAccess()) return;
    
    // Cargar publicaciones pendientes por defecto
    loadPosts('pendiente');
    
    // Configurar event listeners para tabs
    document.querySelectorAll('[data-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            changeFilter(tab.dataset.tab);
        });
    });
});
