// ============================================
// CONTROLADOR DE DETALLES DEL POST
// ============================================

const API_BASE_URL = 'http://localhost/PWCI/PWCI-Backend/api.php';

// Estado global
let currentUser = null;
let currentPost = null;
let postComments = [];
let selectedCommentId = null;
let isSubmittingReport = false;

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
    
    // Incrementar contador de vistas
    await incrementViews(postId);
    
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
    const avatarUtils = window.PWCI && window.PWCI.avatar ? window.PWCI.avatar : null;
    const avatarUrl = avatarUtils ? avatarUtils.getAvatarUrl({
        id: post.idUsuario,
        foto: post.fotoAutor,
        hasBlob: post.autorTieneFotoBlob
    }) : null;
    
    // Update header
    const headerHTML = `
        <div class="flex items-start justify-between">
            <div class="flex items-center space-x-3">
                <div class="relative w-12 h-12 flex items-center justify-center">
                    <img src="${avatarUrl || ''}" alt="Foto de ${userName}"
                         class="${avatarUrl ? '' : 'hidden '}w-12 h-12 rounded-full object-cover border border-zinc-200"
                         onerror="this.classList.add('hidden'); this.nextElementSibling.classList.remove('hidden');">
                    <div class="${avatarUrl ? 'hidden ' : ''}w-12 h-12 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-full flex items-center justify-center">
                        <span class="text-white font-bold text-lg">${userInitial}</span>
                    </div>
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
    
    // Si tiene BLOB, usar blob-api.php
    if (post.tieneBlob && post.tieneBlob == 1) {
        const imageUrl = `http://localhost/PWCI/PWCI-Backend/blob-api.php?action=download&tipo=publicacion&id=${post.idPublicacion}`;
        imageContainer.innerHTML = `
            <img src="${imageUrl}" 
                 alt="${post.titulo}" 
                 class="w-full rounded-lg"
                 onerror="console.error('Error cargando imagen BLOB'); this.parentElement.style.display='none'">
        `;
        imageContainer.style.display = 'block';
    }
    // Si tiene URL, usar URL
    else if (post.urlMultimedia) {
        imageContainer.innerHTML = `
            <img src="${post.urlMultimedia}" 
                 alt="${post.titulo}" 
                 class="w-full rounded-lg"
                 onerror="this.parentElement.style.display='none'">
        `;
        imageContainer.style.display = 'block';
    }
    // Sin imagen
    else {
        imageContainer.style.display = 'none';
    }
    
    // Update actions (likes, dislikes, comments count)
    document.getElementById('likeCount').textContent = post.likes || 0;
    document.getElementById('dislikeCount').textContent = post.dislikes || 0;
    document.getElementById('commentCount').textContent = post.totalComentarios || 0;
    document.getElementById('viewsCount').textContent = post.vistas || 0;
    
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
        const token = getAuthToken();
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`${API_BASE_URL}/comentarios?idPublicacion=${postId}`, { headers });
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
    const avatarUtils = window.PWCI && window.PWCI.avatar ? window.PWCI.avatar : null;
    const avatarUrl = avatarUtils ? avatarUtils.getAvatarUrl({
        id: comment.idUsuario,
        foto: comment.fotoAutor,
        hasBlob: comment.autorTieneFotoBlob
    }) : null;

    const isOwner = currentUser && comment.idUsuario === currentUser.idUsuario;
    const totalReportes = Number(comment.totalReportes || 0);
    const reportesPendientes = Number(comment.reportesPendientes || 0);
    const usuarioReporto = Number(comment.usuarioReporto || 0) === 1;
    const requiresAuth = !currentUser;
    const canReport = !isOwner;

    const badges = [];
    if (totalReportes > 0) {
        badges.push(`
            <span class="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 font-medium text-red-600">
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-6.4 11.09A1.5 1.5 0 005.1 17.5h13.8a1.5 1.5 0 001.21-2.35l-6.4-11.29a1.5 1.5 0 00-2.62 0z" />
                </svg>
                ${totalReportes} reporte${totalReportes === 1 ? '' : 's'}
            </span>
        `);
    }

    if (reportesPendientes > 0) {
        badges.push(`
            <span class="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 font-medium text-yellow-600">
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ${reportesPendientes} pendiente${reportesPendientes === 1 ? '' : 's'}
            </span>
        `);
    }

    let reportButtonHTML = '';
    if (canReport) {
        if (usuarioReporto) {
            reportButtonHTML = `
                <button class="report-comment-btn inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 cursor-not-allowed" data-comment-id="${comment.idComentario}" data-reported="1" disabled>
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-6.4 11.09A1.5 1.5 0 005.1 17.5h13.8a1.5 1.5 0 001.21-2.35l-6.4-11.29a1.5 1.5 0 00-2.62 0z" />
                    </svg>
                    Ya reportaste
                </button>
            `;
        } else {
            const requiresAuthAttr = requiresAuth ? '1' : '0';
            reportButtonHTML = `
                <button class="report-comment-btn inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:border-red-300 hover:text-red-600" data-comment-id="${comment.idComentario}" data-reported="0" data-requires-auth="${requiresAuthAttr}">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-6.4 11.09A1.5 1.5 0 005.1 17.5h13.8a1.5 1.5 0 001.21-2.35l-6.4-11.29a1.5 1.5 0 00-2.62 0z" />
                    </svg>
                    Reportar
                </button>
            `;
        }
    }

    const badgesHTML = badges.filter(Boolean).join('');
    const wasEdited = Number(comment.editado || 0) === 1;

    return `
        <div class="p-6" data-comment-id="${comment.idComentario}">
            <div class="flex space-x-4">
                <div class="relative h-10 w-10 flex-shrink-0">
                    <img src="${avatarUrl || ''}" alt="Foto de ${userName}"
                         class="${avatarUrl ? '' : 'hidden '}h-10 w-10 rounded-full border border-zinc-200 object-cover"
                         onerror="this.classList.add('hidden'); this.nextElementSibling.classList.remove('hidden');">
                    <div class="${avatarUrl ? 'hidden ' : ''}flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800">
                        <span class="text-sm font-semibold text-white">${userInitial}</span>
                    </div>
                </div>
                <div class="flex-1">
                    <div class="mb-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                        <h4 class="mr-1 text-sm font-semibold text-neutral-900">${userName}</h4>
                        <span>• ${commentDate}</span>
                        ${wasEdited ? '<span class="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">Editado</span>' : ''}
                    </div>
                    <p class="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">${comment.contenido}</p>
                    ${(badgesHTML || reportButtonHTML) ? `
                        <div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
                            <div class="flex flex-wrap items-center gap-2">
                                ${badgesHTML}
                            </div>
                            ${reportButtonHTML}
                        </div>
                    ` : ''}
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
        const reportBtn = e.target.closest('.report-comment-btn');
        const closeModalBtn = e.target.closest('#closeReportModalBtn');
        const cancelReportBtn = e.target.closest('#cancelReportBtn');
        
        if (likeBtn && !likeBtn.disabled) {
            e.preventDefault();
            await handleLike();
        }
        
        if (dislikeBtn && !dislikeBtn.disabled) {
            e.preventDefault();
            await handleDislike();
        }

        if (reportBtn) {
            e.preventDefault();
            handleReportButtonClick(reportBtn);
        }

        if (closeModalBtn) {
            e.preventDefault();
            closeReportModal();
        }

        if (cancelReportBtn) {
            e.preventDefault();
            closeReportModal();
        }
    });

    const reportModalOverlay = document.getElementById('reportModalOverlay');
    if (reportModalOverlay) {
        reportModalOverlay.addEventListener('click', () => {
            closeReportModal();
        });
    }

    const submitReportBtn = document.getElementById('submitReportBtn');
    if (submitReportBtn) {
        submitReportBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleReportSubmit();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isReportModalOpen()) {
            closeReportModal();
        }
    });
}

// ============================================
// REPORTES DE COMENTARIOS
// ============================================
function handleReportButtonClick(button) {
    if (!button) {
        return;
    }

    if (!currentUser) {
        const goToLogin = confirm('Debes iniciar sesión para reportar comentarios. ¿Quieres ir a la página de inicio de sesión ahora?');
        if (goToLogin) {
            window.location.href = 'login.html';
        }
        return;
    }

    if (button.dataset.reported === '1') {
        return;
    }

    const commentId = Number(button.dataset.commentId);
    if (!commentId) {
        return;
    }

    selectedCommentId = commentId;
    resetReportModal();
    openReportModal();
}

async function handleReportSubmit() {
    if (!currentUser) {
        closeReportModal();
        const goToLogin = confirm('Debes iniciar sesión para reportar comentarios. ¿Quieres ir a la página de inicio de sesión ahora?');
        if (goToLogin) {
            window.location.href = 'login.html';
        }
        return;
    }

    if (!selectedCommentId) {
        setReportFeedback('No se pudo identificar el comentario. Intenta nuevamente.');
        return;
    }

    const motivoSelect = document.getElementById('reportMotivo');
    const descripcionInput = document.getElementById('reportDescripcion');
    const motivo = motivoSelect ? motivoSelect.value : '';
    const descripcion = descripcionInput ? descripcionInput.value.trim() : '';

    if (!motivo) {
        setReportFeedback('Selecciona un motivo para continuar.');
        return;
    }

    const token = getAuthToken();
    if (!token) {
        setReportFeedback('Tu sesión expiró. Inicia sesión nuevamente.');
        return;
    }

    if (isSubmittingReport) {
        return;
    }

    isSubmittingReport = true;
    const submitButton = document.getElementById('submitReportBtn');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('opacity-60', 'cursor-not-allowed');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/comentarios/${selectedCommentId}/reportes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                motivo,
                descripcion: descripcion || null
            })
        });

        const data = await response.json();

        if (!response.ok || (data && data.status && data.status >= 400)) {
            const errorMessage = (data && data.message) ? data.message : 'No se pudo registrar el reporte. Intenta más tarde.';
            setReportFeedback(errorMessage);
            return;
        }

        setReportFeedback('Reporte enviado correctamente. ¡Gracias por ayudarnos!', 'success');

        if (currentPost && currentPost.idPublicacion) {
            await loadComments(currentPost.idPublicacion);
        }

        setTimeout(() => {
            closeReportModal();
            setReportFeedback('');
        }, 1200);
    } catch (error) {
        console.error('Error al reportar comentario:', error);
        setReportFeedback('Ocurrió un error al enviar el reporte. Intenta nuevamente.');
    } finally {
        isSubmittingReport = false;
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.classList.remove('opacity-60', 'cursor-not-allowed');
        }
    }
}

function openReportModal() {
    const modal = document.getElementById('reportModal');
    if (!modal) {
        return;
    }
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');

    setTimeout(() => {
        const motivoSelect = document.getElementById('reportMotivo');
        if (motivoSelect) {
            motivoSelect.focus();
        }
    }, 60);
}

function closeReportModal() {
    const modal = document.getElementById('reportModal');
    if (!modal) {
        return;
    }
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    selectedCommentId = null;
    resetReportModal();
}

function resetReportModal() {
    const motivoSelect = document.getElementById('reportMotivo');
    const descripcionInput = document.getElementById('reportDescripcion');

    if (motivoSelect) {
        motivoSelect.value = '';
    }

    if (descripcionInput) {
        descripcionInput.value = '';
    }

    setReportFeedback('');
}

function setReportFeedback(message, type = 'error') {
    const feedbackBox = document.getElementById('reportError');
    if (!feedbackBox) {
        return;
    }

    feedbackBox.classList.remove('bg-red-50', 'border-red-200', 'text-red-600', 'bg-green-50', 'border-green-200', 'text-green-600');

    if (!message) {
        feedbackBox.classList.add('hidden');
        feedbackBox.textContent = '';
        return;
    }

    feedbackBox.textContent = message;
    feedbackBox.classList.remove('hidden');

    if (type === 'success') {
        feedbackBox.classList.add('bg-green-50', 'border-green-200', 'text-green-600');
    } else {
        feedbackBox.classList.add('bg-red-50', 'border-red-200', 'text-red-600');
    }
}

function isReportModalOpen() {
    const modal = document.getElementById('reportModal');
    return modal ? !modal.classList.contains('hidden') : false;
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

// ============================================
// INCREMENTAR VISTAS
// ============================================
async function incrementViews(postId) {
    try {
        // Llamar al stored procedure para incrementar vistas
        const response = await fetch(`${API_BASE_URL}/publicaciones/${postId}/incrementar-vistas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.status === 200) {
            console.log('👁️ Vistas incrementadas:', data.vistas);
        }
    } catch (error) {
        console.error('Error al incrementar vistas:', error);
        // No mostrar error al usuario, es una operación silenciosa
    }
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
