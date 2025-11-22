/**
 * Controlador para el Panel de Administración Principal
 * Dashboard con estadísticas y accesos rápidos
 */

const API_BASE_URL = 'http://localhost/PWCI/PWCI-Backend/api.php';

// Estado global
let stats = {
    pendientes: 0,
    aprobadas: 0,
    rechazadas: 0,
    comentarios: 0,
    usuarios: 0,
    categorias: 0
};

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
 * Cargar todas las estadísticas
 */
async function loadAllStats() {
    try {
        const authToken = localStorage.getItem('authToken');
        
        // Cargar estadísticas de publicaciones
        await loadPublicacionesStats(authToken);
        
        // Cargar estadísticas de comentarios
        await loadComentariosStats(authToken);
        
        // Cargar estadísticas de usuarios
        await loadUsuariosStats(authToken);
        
        // Cargar estadísticas de categorías
        await loadCategoriasStats(authToken);
        
        // Renderizar estadísticas
        renderStats();
        
        // Cargar publicaciones recientes
        await loadRecentPosts(authToken);
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        showError('No se pudieron cargar las estadísticas');
    }
}

/**
 * Cargar estadísticas de publicaciones
 */
async function loadPublicacionesStats(authToken) {
    const estados = ['pendiente', 'aprobada', 'rechazada'];
    
    for (const estado of estados) {
        try {
            const response = await fetch(`${API_BASE_URL}/publicaciones?estado=${estado}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (estado === 'pendiente') stats.pendientes = data.data?.length || 0;
                if (estado === 'aprobada') stats.aprobadas = data.data?.length || 0;
                if (estado === 'rechazada') stats.rechazadas = data.data?.length || 0;
            }
        } catch (error) {
            console.error(`Error cargando ${estado}:`, error);
        }
    }
}

/**
 * Cargar estadísticas de comentarios
 */
async function loadComentariosStats(authToken) {
    try {
        const response = await fetch(`${API_BASE_URL}/comentarios`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            stats.comentarios = data.data?.length || 0;
        }
    } catch (error) {
        console.error('Error cargando comentarios:', error);
    }
}

/**
 * Cargar estadísticas de usuarios
 */
async function loadUsuariosStats(authToken) {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            stats.usuarios = data.data?.length || 0;
        }
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

/**
 * Cargar estadísticas de categorías
 */
async function loadCategoriasStats(authToken) {
    try {
        const response = await fetch(`${API_BASE_URL}/categorias`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            stats.categorias = data.data?.length || 0;
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

/**
 * Renderizar estadísticas en el dashboard
 */
function renderStats() {
    // Actualizar contador de pendientes
    const pendientesElement = document.getElementById('statPendientes');
    if (pendientesElement) {
        pendientesElement.textContent = stats.pendientes;
    }
    
    // Actualizar contador de comentarios
    const comentariosElement = document.getElementById('statComentarios');
    if (comentariosElement) {
        comentariosElement.textContent = stats.comentarios;
    }
    
    // Actualizar contador de usuarios
    const usuariosElement = document.getElementById('statUsuarios');
    if (usuariosElement) {
        usuariosElement.textContent = stats.usuarios;
    }
    
    // Actualizar contador de publicaciones totales
    const publicacionesElement = document.getElementById('statPublicaciones');
    if (publicacionesElement) {
        const total = stats.pendientes + stats.aprobadas + stats.rechazadas;
        publicacionesElement.textContent = total;
    }
}

/**
 * Cargar publicaciones recientes
 */
async function loadRecentPosts(authToken) {
    try {
        const response = await fetch(`${API_BASE_URL}/publicaciones?estado=pendiente`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar publicaciones');
        }
        
        const data = await response.json();
        const posts = (data.data || []).slice(0, 5); // Mostrar solo las primeras 5
        
        renderRecentPosts(posts);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

/**
 * Renderizar lista de publicaciones recientes
 */
function renderRecentPosts(posts) {
    const container = document.getElementById('recentPostsContainer');
    
    if (!container) return;
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <svg class="w-12 h-12 text-neutral-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p class="text-neutral-500">No hay publicaciones pendientes</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = posts.map(post => {
        const autorNombre = post.nombreAutor || post.nombreCompleto || 'Usuario';
        const fecha = post.fechaPublicacion || post.fechaAprobacion;
        const initials = getInitials(autorNombre);

        return `
        <div class="flex items-start space-x-3 py-3 border-b border-neutral-100 last:border-0">
            <div class="w-10 h-10 bg-neutral-200 rounded-full flex-shrink-0 flex items-center justify-center">
                <span class="text-sm font-semibold text-neutral-600">${initials}</span>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-neutral-900 truncate">${post.titulo}</p>
                <p class="text-xs text-neutral-500">${autorNombre} • ${formatDate(fecha)}</p>
            </div>
            <a href="approvePost.html?id=${post.idPublicacion}" class="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">
                Revisar →
            </a>
        </div>
        `;
    }).join('');
}

/**
 * Utilidades
 */
function getInitials(nombreCompleto) {
    if (!nombreCompleto) return '??';
    const words = nombreCompleto.trim().split(/\s+/);
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
    
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * Inicialización
 */
document.addEventListener('DOMContentLoaded', () => {
    // Verificar acceso de administrador
    if (!checkAdminAccess()) return;
    
    // Cargar todas las estadísticas
    loadAllStats();
});
