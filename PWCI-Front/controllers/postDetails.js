// ============================================
// CONTROLADOR DE DETALLES DEL POST
// ============================================

const API_BASE_URL = 'http://localhost/PWCI/PWCI-Backend/api.php';

// Estado global
let currentUser = null;
let currentPost = null;
let postComments = [];

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Inicializando detalles del post...');
    
    // Verificar autenticación
    currentUser = checkAuth();
    
    // Obtener ID del post de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (!postId) {
        console.error('No se proporcionó ID de publicación');
        showError('No se encontró la publicación');
        setTimeout(() => {
            window.location.href = 'feed.html';
        }, 2000);
        return;
    }
    
    // Cargar datos
    await loadPost(postId);
    await loadComments(postId);
    
    // Setup event listeners
    setupEventListeners();
});

// ============================================
// AUTENTICACIÓN
// ============================================
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const userDataStr = localStorage.getItem('userData');
    
    if (!token || !userDataStr) {
        return null;
    }
    
    try {
        return JSON.parse(userDataStr);
    } catch (e) {
        console.error('Error al parsear userData:', e);
        return null;
    }
}

function getAuthToken() {
    return localStorage.getItem('authToken');
}

// ============================================
// CARGAR PUBLICACIÓN
// ============================================
async function loadPost(postId) {
    try {
        const token = getAuthToken();
        const headers = {};
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/publicaciones/${postId}`, { headers });
        const data = await response.json();
        
        if (data.status === 200 && data.data) {
            currentPost = data.data;
            console.log('📊 Post cargado:', currentPost);
            console.log('👤 userInteraction:', currentPost.userInteraction);
            renderPost(currentPost);
        } else {
            showError('No se pudo cargar la publicación');
        }
    } catch (error) {
        console.error('Error cargando publicación:', error);
        showError('Error al cargar la publicación');
    }
}

// ============================================
// RENDERIZAR PUBLICACIÓN
// ============================================
function renderPost(post) {
    const userInitial = post.nombreAutor ? post.nombreAutor.charAt(0).toUpperCase() : 'U';
    const userName = post.nombreAutor || 'Usuario';
    const postDate = formatDate(post.fechaPublicacion);
    const categoryBadge = post.nombreCategoria || 'Sin categoría';
    
    // Update header
    const headerHTML = `
        <div class="flex items-start justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold text-lg">${userInitial}</span>
                </div>
                <div>
                    <h3 class="font-semibold text-neutral-900">${userName}</h3>
                    <p class="text-sm text-neutral-500">${postDate}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">${categoryBadge}</span>
            </div>
        </div>
    `;
    
    document.getElementById('postHeader').innerHTML = headerHTML;
    
    // Update content
    document.getElementById('postTitle').textContent = post.titulo;
    document.getElementById('postContent').innerHTML = `
        <p class="text-neutral-700 leading-relaxed whitespace-pre-line">${post.contenido}</p>
    `;
    
    // Update image
    const imageContainer = document.getElementById('postImageContainer');
    if (post.urlMultimedia) {
        imageContainer.innerHTML = `
            <img src="${post.urlMultimedia}" 
                 alt="${post.titulo}" 
                 class="w-full rounded-lg"
                 onerror="this.parentElement.style.display='none'">
        `;
        imageContainer.style.display = 'block';
    } else {
        imageContainer.style.display = 'none';
    }
    
    // Update actions (likes, dislikes, comments count)
    document.getElementById('likeCount').textContent = post.likes || 0;
    document.getElementById('dislikeCount').textContent = post.dislikes || 0;
    document.getElementById('commentCount').textContent = post.totalComentarios || 0;
    
    // 🎨 ACTUALIZAR ESTADOS VISUALES DE LIKE/DISLIKE
    updateInteractionButtons(post.userInteraction);
}

// ============================================
// ACTUALIZAR ESTADOS VISUALES DE INTERACCIÓN
// ============================================
function updateInteractionButtons(userInteraction) {
    const likeBtn = document.getElementById('likeBtn');
    const dislikeBtn = document.getElementById('dislikeBtn');
    
    if (!likeBtn || !dislikeBtn) return;
    
    // Reset ambos botones primero
    likeBtn.classList.remove('text-green-600', 'bg-green-50');
    likeBtn.classList.add('text-neutral-600', 'hover:text-green-600');
    
    dislikeBtn.classList.remove('text-red-600', 'bg-red-50');
    dislikeBtn.classList.add('text-neutral-600', 'hover:text-red-600');
    
    // Aplicar estilo según interacción
    if (userInteraction === 'like') {
        likeBtn.classList.remove('text-neutral-600', 'hover:text-green-600');
        likeBtn.classList.add('text-green-600', 'bg-green-50');
    } else if (userInteraction === 'dislike') {
        dislikeBtn.classList.remove('text-neutral-600', 'hover:text-red-600');
        dislikeBtn.classList.add('text-red-600', 'bg-red-50');
    }
}

// ============================================
// CARGAR COMENTARIOS
// ============================================
async function loadComments(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/comentarios?idPublicacion=${postId}`);
        const data = await response.json();
        
        if (data.status === 200 && data.data) {
            postComments = data.data;
            renderComments(postComments);
        } else {
            console.log('No hay comentarios o error al cargar');
            renderComments([]);
        }
    } catch (error) {
        console.error('Error cargando comentarios:', error);
        renderComments([]);
    }
}

// ============================================
// RENDERIZAR COMENTARIOS
// ============================================
function renderComments(comments) {
    const container = document.getElementById('commentsList');
    const countElement = document.getElementById('commentsCount');
    
    // Update count
    countElement.textContent = `Comentarios (${comments.length})`;
    
    if (!comments || comments.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center text-neutral-500">
                <svg class="w-12 h-12 mx-auto mb-3 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <p>No hay comentarios aún</p>
                <p class="text-sm mt-1">¡Sé el primero en comentar!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = comments.map(comment => createCommentHTML(comment)).join('');
}

function createCommentHTML(comment) {
    const userInitial = comment.nombreAutor ? comment.nombreAutor.charAt(0).toUpperCase() : 'U';
    const userName = comment.nombreAutor || 'Usuario';
    const commentDate = formatDate(comment.fechaComentario);
    
    return `
        <div class="p-6">
            <div class="flex space-x-4">
                <div class="w-10 h-10 bg-gradient-to-br from-zinc-600 to-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="text-white font-semibold text-sm">${userInitial}</span>
                </div>
                <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-2">
                        <h4 class="font-semibold text-neutral-900 text-sm">${userName}</h4>
                        <span class="text-neutral-500 text-xs">• ${commentDate}</span>
                    </div>
                    <p class="text-neutral-700 text-sm leading-relaxed whitespace-pre-line">${comment.contenido}</p>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Botón de comentar
    const commentBtn = document.getElementById('submitCommentBtn');
    const commentTextarea = document.getElementById('commentTextarea');
    
    if (commentBtn && commentTextarea) {
        commentBtn.addEventListener('click', async () => {
            await handleAddComment();
        });
        
        // También permitir Enter con Ctrl
        commentTextarea.addEventListener('keydown', async (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                await handleAddComment();
            }
        });
    }
    
    // Likes y dislikes
    document.addEventListener('click', async (e) => {
        const likeBtn = e.target.closest('#likeBtn');
        const dislikeBtn = e.target.closest('#dislikeBtn');
        
        if (likeBtn && !likeBtn.disabled) {
            e.preventDefault();
            await handleLike();
        }
        
        if (dislikeBtn && !dislikeBtn.disabled) {
            e.preventDefault();
            await handleDislike();
        }
    });
}

// ============================================
// AGREGAR COMENTARIO
// ============================================
async function handleAddComment() {
    const textarea = document.getElementById('commentTextarea');
    const contenido = textarea.value.trim();
    
    if (!contenido) {
        alert('Escribe un comentario primero');
        return;
    }
    
    if (!currentUser) {
        alert('Debes iniciar sesión para comentar');
        window.location.href = 'login.html';
        return;
    }
    
    const token = getAuthToken();
    
    try {
        const response = await fetch(`${API_BASE_URL}/comentarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                idPublicacion: currentPost.idPublicacion,
                contenido: contenido
            })
        });
        
        const data = await response.json();
        
        if (data.status === 201 || data.status === 200) {
            console.log('✅ Comentario agregado');
            textarea.value = '';
            // Recargar comentarios
            await loadComments(currentPost.idPublicacion);
            // Actualizar contador en el post
            await loadPost(currentPost.idPublicacion);
        } else {
            alert(data.message || 'Error al agregar comentario');
        }
    } catch (error) {
        console.error('Error al agregar comentario:', error);
        alert('Error al agregar comentario');
    }
}

// ============================================
// LIKES Y DISLIKES
// ============================================
async function handleLike() {
    if (!currentUser) {
        alert('Debes iniciar sesión para dar like');
        window.location.href = 'login.html';
        return;
    }
    
    const token = getAuthToken();
    
    // Si ya tiene like, quitarlo
    if (currentPost.userInteraction === 'like') {
        try {
            const response = await fetch(`${API_BASE_URL}/publicaciones/${currentPost.idPublicacion}/interaccion`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.status === 200) {
                console.log('✅ Like removido');
                await loadPost(currentPost.idPublicacion);
            }
        } catch (error) {
            console.error('Error al quitar like:', error);
        }
        return;
    }
    
    // Dar like (nuevo o cambiar desde dislike)
    try {
        const response = await fetch(`${API_BASE_URL}/publicaciones/${currentPost.idPublicacion}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.status === 200) {
            console.log('✅ Like registrado');
            await loadPost(currentPost.idPublicacion);
        } else if (data.status === 409) {
            // Ya tiene like, esto no debería pasar pero por si acaso
            await loadPost(currentPost.idPublicacion);
        } else {
            console.error(data.message);
        }
    } catch (error) {
        console.error('Error al dar like:', error);
    }
}

async function handleDislike() {
    if (!currentUser) {
        alert('Debes iniciar sesión para dar dislike');
        window.location.href = 'login.html';
        return;
    }
    
    const token = getAuthToken();
    
    // Si ya tiene dislike, quitarlo
    if (currentPost.userInteraction === 'dislike') {
        try {
            const response = await fetch(`${API_BASE_URL}/publicaciones/${currentPost.idPublicacion}/interaccion`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.status === 200) {
                console.log('✅ Dislike removido');
                await loadPost(currentPost.idPublicacion);
            }
        } catch (error) {
            console.error('Error al quitar dislike:', error);
        }
        return;
    }
    
    // Dar dislike (nuevo o cambiar desde like)
    try {
        const response = await fetch(`${API_BASE_URL}/publicaciones/${currentPost.idPublicacion}/dislike`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.status === 200) {
            console.log('✅ Dislike registrado');
            await loadPost(currentPost.idPublicacion);
        } else if (data.status === 409) {
            // Ya tiene dislike, esto no debería pasar pero por si acaso
            await loadPost(currentPost.idPublicacion);
        } else {
            console.error(data.message);
        }
    } catch (error) {
        console.error('Error al dar dislike:', error);
    }
}

// ============================================
// UTILIDADES
// ============================================
function formatDate(dateString) {
    if (!dateString) return 'Fecha desconocida';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 1) return 'Justo ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `Hace ${weeks} semana${weeks !== 1 ? 's' : ''}`;
    }
    if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `Hace ${months} mes${months !== 1 ? 'es' : ''}`;
    }
    const years = Math.floor(diffDays / 365);
    return `Hace ${years} año${years !== 1 ? 's' : ''}`;
}

function showError(message) {
    const mainContent = document.querySelector('main .flex-1');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="max-w-3xl mx-auto text-center py-12">
                <div class="text-6xl mb-4">⚠️</div>
                <h2 class="text-2xl font-bold text-zinc-800 mb-2">Error</h2>
                <p class="text-zinc-600 mb-4">${message}</p>
                <a href="feed.html" class="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-zinc-800 transition-colors">
                    Volver al Feed
                </a>
            </div>
        `;
    }
}
