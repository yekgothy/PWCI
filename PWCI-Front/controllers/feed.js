// ============================================
// CONTROLADOR DEL FEED - WORLD CUP HUB
// ============================================

const API_BASE_URL = 'http://localhost/PWCI/PWCI-Backend/api.php';

// Estado global
let currentUser = null;
let allPosts = [];
let filteredPosts = [];
let categories = [];
let worldCups = [];

// ============================================
// INICIALIZACIÓN
// ============================================
let isInitialized = false;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Inicializando feed...');
    
    // Esperar a que los elementos del DOM existan
    await waitForElements();
    
    // Verificar autenticación
    currentUser = checkAuth();
    
    // Cargar datos iniciales
    await Promise.all([
        loadCategories(),
        loadWorldCups(),
        loadPosts()
    ]);
    
    // Configurar event listeners DESPUÉS de cargar todo
    setupEventListeners();
    setupFilterListeners();
    
    isInitialized = true;
    console.log('Feed inicializado correctamente');
});

// ============================================
// ESPERAR A QUE LOS ELEMENTOS EXISTAN
// ============================================
function waitForElements() {
    return new Promise((resolve) => {
        const checkElements = () => {
            const searchInput = document.getElementById('searchInput');
            const categoryFilter = document.getElementById('categoryFilter');
            const container = document.getElementById('main-content-container');
            
            if (searchInput && categoryFilter && container) {
                console.log('✅ Elementos del DOM encontrados');
                resolve();
            } else {
                console.log('⏳ Esperando elementos del DOM...');
                setTimeout(checkElements, 100);
            }
        };
        checkElements();
    });
}

// ============================================
// AUTENTICACIÓN
// ============================================
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('userData');
    
    if (!token || !user) {
        console.warn('Usuario no autenticado, redirigiendo...');
        // Descomentar para forzar login
        // window.location.href = 'login.html';
        return null;
    }
    
    try {
        return JSON.parse(user);
    } catch (e) {
        console.error('Error parseando datos de usuario:', e);
        return null;
    }
}

function getAuthToken() {
    return localStorage.getItem('authToken');
}

// ============================================
// CARGAR PUBLICACIONES
// ============================================
async function loadPosts(shouldRender = true) {
    try {
        // Construir URL básica - los filtros se aplican después con applyFilters()
        let url = `${API_BASE_URL}/publicaciones?estado=aprobada`;
        
        console.log('Cargando posts desde:', url);
        
        const token = getAuthToken();
        const headers = {};
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('🔐 Token enviado en request');
        }
        
        const response = await fetch(url, { headers });
        const data = await response.json();
        
        console.log('📦 Respuesta completa de la API:', data);
        
        // Intentar diferentes formatos de respuesta
        if (data.data && Array.isArray(data.data)) {
            allPosts = data.data;
        } else if (Array.isArray(data)) {
            allPosts = data;
        } else {
            console.error('❌ Formato de respuesta no reconocido:', data);
            showError('Formato de respuesta inválido');
            return;
        }
        
        console.log(`✅ ${allPosts.length} publicaciones cargadas`);
        
        // Log para ver si vienen las interacciones
        const postsConInteraccion = allPosts.filter(p => p.userInteraction);
        console.log(`👤 Posts con interacción del usuario: ${postsConInteraccion.length}`);
        if (postsConInteraccion.length > 0) {
            console.log('Ejemplo:', postsConInteraccion[0]);
        }
        
        // Solo renderizar si se solicita (primera carga)
        if (shouldRender) {
            // Inicializar filteredPosts con todos los posts
            filteredPosts = [...allPosts];
            renderPosts(filteredPosts);
            updateResultsCount();
        }
    } catch (error) {
        console.error('Error cargando posts:', error);
        showError('Error de conexión con el servidor');
    }
}

// ============================================
// CARGAR CATEGORÍAS
// ============================================
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categorias`);
        const data = await response.json();
        
        categories = data.data || data || [];
        console.log(`✅ ${categories.length} categorías cargadas`);
        
        populateCategoryFilter();
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.idCategoria;
        option.textContent = cat.nombre;
        categoryFilter.appendChild(option);
    });
}

// ============================================
// CARGAR MUNDIALES
// ============================================
async function loadWorldCups() {
    try {
        const response = await fetch(`${API_BASE_URL}/mundiales`);
        const data = await response.json();
        
        worldCups = data.data || data || [];
        console.log(`✅ ${worldCups.length} mundiales cargados`);
        
        populateWorldCupFilter();
    } catch (error) {
        console.error('Error cargando mundiales:', error);
    }
}

function populateWorldCupFilter() {
    const worldCupFilter = document.getElementById('worldCupFilter');
    if (!worldCupFilter) return;
    
    worldCups.forEach(wc => {
        const option = document.createElement('option');
        option.value = wc.idMundial;
        option.textContent = `${wc.anio} - ${wc.paisSede}`;
        worldCupFilter.appendChild(option);
    });
}

// ============================================
// CONFIGURAR FILTROS
// ============================================
function setupFilterListeners() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const worldCupFilter = document.getElementById('worldCupFilter');
    const sortFilter = document.getElementById('sortFilter');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    
    console.log('🎛️ Configurando filtros:', {
        searchInput: !!searchInput,
        categoryFilter: !!categoryFilter,
        worldCupFilter: !!worldCupFilter,
        sortFilter: !!sortFilter,
        clearFiltersBtn: !!clearFiltersBtn
    });
    
    // Búsqueda en tiempo real (con debounce)
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                console.log('🔍 Búsqueda activada');
                applyFilters();
            }, 300);
        });
        console.log('✅ Event listener de búsqueda configurado');
    }
    
    // Filtros de selección
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            console.log('📂 Filtro de categoría activado');
            applyFilters();
        });
        console.log('✅ Event listener de categoría configurado');
    }
    
    if (worldCupFilter) {
        worldCupFilter.addEventListener('change', () => {
            console.log('🏆 Filtro de mundial activado');
            applyFilters();
        });
        console.log('✅ Event listener de mundial configurado');
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', () => {
            console.log('🔄 Ordenamiento activado');
            applyFilters();
        });
        console.log('✅ Event listener de ordenamiento configurado');
    }
    
    // Botón de limpiar
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            console.log('🧹 Limpiando filtros');
            clearFilters();
        });
        console.log('✅ Event listener de limpiar configurado');
    }
}

function applyFilters() {
    if (!isInitialized || !allPosts || allPosts.length === 0) {
        console.log('⏸️ Saltando filtros - no inicializado o sin posts');
        return;
    }
    
    const searchText = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoryId = document.getElementById('categoryFilter')?.value || '';
    const worldCupId = document.getElementById('worldCupFilter')?.value || '';
    const sortBy = document.getElementById('sortFilter')?.value || 'recientes';
    
    console.log('🔍 Aplicando filtros:', { searchText, categoryId, worldCupId, sortBy });
    
    // Filtrar posts
    filteredPosts = allPosts.filter(post => {
        // Filtro de búsqueda
        const matchesSearch = !searchText || 
            (post.titulo && post.titulo.toLowerCase().includes(searchText)) ||
            (post.contenido && post.contenido.toLowerCase().includes(searchText));
        
        // Filtro de categoría
        const matchesCategory = !categoryId || 
            post.idCategoria == categoryId;
        
        // Filtro de mundial
        const matchesWorldCup = !worldCupId || 
            post.idMundial == worldCupId;
        
        return matchesSearch && matchesCategory && matchesWorldCup;
    });
    
    console.log('✅ Filtrados:', filteredPosts.length, 'de', allPosts.length);
    
    // Ordenar posts
    sortPosts(filteredPosts, sortBy);
    
    // Renderizar
    renderPosts(filteredPosts);
    updateResultsCount();
}

function sortPosts(posts, sortBy) {
    switch(sortBy) {
        case 'recientes':
            posts.sort((a, b) => new Date(b.fechaPublicacion) - new Date(a.fechaPublicacion));
            break;
        case 'antiguos':
            posts.sort((a, b) => new Date(a.fechaPublicacion) - new Date(b.fechaPublicacion));
            break;
        case 'likes':
            posts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            break;
        case 'comentarios':
            posts.sort((a, b) => (b.totalComentarios || 0) - (a.totalComentarios || 0));
            break;
        case 'vistas':
            posts.sort((a, b) => (b.vistas || 0) - (a.vistas || 0));
            break;
    }
}

function clearFilters() {
    // Limpiar inputs
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const worldCupFilter = document.getElementById('worldCupFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (worldCupFilter) worldCupFilter.value = '';
    if (sortFilter) sortFilter.value = 'recientes';
    
    // Reaplicar filtros (sin filtros = mostrar todo)
    applyFilters();
}

function updateResultsCount() {
    const resultsCount = document.getElementById('resultsCount');
    if (!resultsCount) return;
    
    const total = allPosts.length;
    const showing = filteredPosts.length;
    
    if (showing === total) {
        resultsCount.textContent = `Mostrando ${total} publicación${total !== 1 ? 'es' : ''}`;
    } else {
        resultsCount.textContent = `Mostrando ${showing} de ${total} publicación${total !== 1 ? 'es' : ''}`;
    }
}

// ============================================
// RENDERIZAR PUBLICACIONES
// ============================================
function renderPosts(posts) {
    const container = document.getElementById('main-content-container');
    
    if (!container) {
        console.error('Contenedor de posts no encontrado');
        return;
    }
    
    if (!posts || posts.length === 0) {
        // Determinar si es por filtros o no hay posts en absoluto
        const hasFilters = document.getElementById('searchInput')?.value || 
                          document.getElementById('categoryFilter')?.value ||
                          document.getElementById('worldCupFilter')?.value;
        
        if (hasFilters && allPosts.length > 0) {
            // No hay resultados por filtros
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">🔍</div>
                    <h3 class="text-2xl font-bold text-zinc-800 mb-2">No se encontraron publicaciones</h3>
                    <p class="text-zinc-600">Intenta ajustar los filtros de búsqueda</p>
                    <button onclick="clearFilters()" class="mt-4 inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-zinc-800 transition-colors">
                        Limpiar filtros
                    </button>
                </div>
            `;
        } else {
            // No hay posts en absoluto
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">⚽</div>
                    <h3 class="text-2xl font-bold text-zinc-800 mb-2">No hay publicaciones aún</h3>
                    <p class="text-zinc-600">Sé el primero en compartir algo sobre el Mundial</p>
                    <a href="createPost.html" class="mt-4 inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-zinc-800 transition-colors">
                        Crear Publicación
                    </a>
                </div>
            `;
        }
        return;
    }
    
    container.innerHTML = posts.map(post => createPostHTML(post)).join('');
}

function createPostHTML(post) {
    const userInitial = post.nombreAutor ? post.nombreAutor.charAt(0).toUpperCase() : 'U';
    const userName = post.nombreAutor || 'Usuario';
    const postDate = formatDate(post.fechaPublicacion);
    const categoryBadge = post.nombreCategoria ? `<span class="px-3 py-1 bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-full">${post.nombreCategoria}</span>` : '';
    
    return `
        <article class="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 mb-6 overflow-hidden border border-zinc-200" data-post-id="${post.idPublicacion}">
            <!-- Header del post -->
            <div class="p-6 pb-4">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-full flex items-center justify-center shadow-md">
                            <span class="text-white font-bold text-lg">${userInitial}</span>
                        </div>
                        <div class="ml-3">
                            <p class="font-semibold text-zinc-900">${userName}</p>
                            <p class="text-sm text-zinc-500">${postDate}</p>
                        </div>
                    </div>
                    ${categoryBadge}
                </div>
                
                <!-- Título y contenido -->
                <h2 class="text-2xl font-bold text-zinc-900 mb-3 hover:text-zinc-700 cursor-pointer" onclick="goToPostDetail(${post.idPublicacion})">
                    ${post.titulo}
                </h2>
                <p class="text-zinc-700 mb-4 whitespace-pre-line leading-relaxed">${post.contenido}</p>
            </div>
            
            <!-- Imagen (si existe) -->
            ${getImageHTML(post)}
            
            
            <!-- Interacciones -->
            <div class="px-6 pb-6">
                <div class="flex items-center justify-between pt-4 border-t border-zinc-200">
                    <div class="flex items-center space-x-6">
                        <!-- Like -->
                        <button class="like-btn flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${post.userInteraction === 'like' ? 'text-green-600 bg-green-50' : 'text-zinc-600 hover:text-green-600 hover:bg-green-50'} group" 
                                data-post-id="${post.idPublicacion}"
                                ${!currentUser ? 'disabled title="Inicia sesión para interactuar"' : ''}>
                            <svg class="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                            </svg>
                            <span class="font-semibold">${post.likes || 0}</span>
                        </button>
                        
                        <!-- Dislike -->
                        <button class="dislike-btn flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${post.userInteraction === 'dislike' ? 'text-red-600 bg-red-50' : 'text-zinc-600 hover:text-red-600 hover:bg-red-50'} group" 
                                data-post-id="${post.idPublicacion}"
                                ${!currentUser ? 'disabled title="Inicia sesión para interactuar"' : ''}>
                            <svg class="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"></path>
                            </svg>
                            <span class="font-semibold">${post.dislikes || 0}</span>
                        </button>
                        
                        <!-- Comentarios -->
                        <button class="flex items-center space-x-2 text-zinc-600 hover:text-blue-600 transition-colors group"
                                onclick="goToPostDetail(${post.idPublicacion})">
                            <svg class="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                            </svg>
                            <span class="font-semibold">${post.totalComentarios || 0}</span>
                        </button>
                        
                        <!-- Vistas -->
                        <div class="flex items-center space-x-2 text-zinc-600" title="Visualizaciones">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            <span class="font-semibold">${post.vistas || 0}</span>
                        </div>
                    </div>
                    
                    <!-- Ver detalles -->
                    <button class="text-zinc-600 hover:text-zinc-900 font-medium text-sm transition-colors"
                            onclick="goToPostDetail(${post.idPublicacion})">
                        Ver detalles →
                    </button>
                </div>
            </div>
        </article>
    `;
}

// ============================================
// INTERACCIONES (LIKES/DISLIKES)
// ============================================
function setupEventListeners() {
    // Delegar eventos para likes y dislikes
    document.addEventListener('click', async (e) => {
        const likeBtn = e.target.closest('.like-btn');
        const dislikeBtn = e.target.closest('.dislike-btn');
        
        if (likeBtn && !likeBtn.disabled) {
            e.preventDefault();
            const postId = likeBtn.dataset.postId;
            await handleLike(postId);
        }
        
        if (dislikeBtn && !dislikeBtn.disabled) {
            e.preventDefault();
            const postId = dislikeBtn.dataset.postId;
            await handleDislike(postId);
        }
    });
}

async function handleLike(postId) {
    const token = getAuthToken();
    
    if (!token) {
        alert('Debes iniciar sesión para dar like');
        return;
    }
    
    // Encontrar el post actual para verificar si ya tiene like
    const post = allPosts.find(p => p.idPublicacion == postId);
    
    // Si ya tiene like, quitarlo
    if (post && post.userInteraction === 'like') {
        try {
            const response = await fetch(`${API_BASE_URL}/publicaciones/${postId}/interaccion`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.status === 200) {
                console.log('✅ Like removido');
                await loadPosts(false);
                applyFilters(); // Reaplicar filtros después de recargar
            }
        } catch (error) {
            console.error('Error al quitar like:', error);
        }
        return;
    }
    
    // Dar like (nuevo o cambiar desde dislike)
    try {
        const response = await fetch(`${API_BASE_URL}/publicaciones/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.status === 200 || data.status === 409) {
            console.log('✅ Like registrado');
            await loadPosts(false);
            applyFilters(); // Reaplicar filtros después de recargar
        } else {
            console.error('Error:', data.message);
        }
    } catch (error) {
        console.error('Error al dar like:', error);
    }
}

async function handleDislike(postId) {
    const token = getAuthToken();
    
    if (!token) {
        alert('Debes iniciar sesión para dar dislike');
        return;
    }
    
    // Encontrar el post actual para verificar si ya tiene dislike
    const post = allPosts.find(p => p.idPublicacion == postId);
    
    // Si ya tiene dislike, quitarlo
    if (post && post.userInteraction === 'dislike') {
        try {
            const response = await fetch(`${API_BASE_URL}/publicaciones/${postId}/interaccion`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.status === 200) {
                console.log('✅ Dislike removido');
                await loadPosts(false);
                applyFilters(); // Reaplicar filtros después de recargar
            }
        } catch (error) {
            console.error('Error al quitar dislike:', error);
        }
        return;
    }
    
    // Dar dislike (nuevo o cambiar desde like)
    try {
        const response = await fetch(`${API_BASE_URL}/publicaciones/${postId}/dislike`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.status === 200 || data.status === 409) {
            console.log('✅ Dislike registrado');
            await loadPosts(false);
            applyFilters(); // Reaplicar filtros después de recargar
        } else {
            console.error('Error:', data.message);
        }
    } catch (error) {
        console.error('Error al dar dislike:', error);
    }
}

// ============================================
// NAVEGACIÓN
// ============================================
function goToPostDetail(postId) {
    window.location.href = `postDetails.html?id=${postId}`;
}

// ============================================
// UTILIDADES
// ============================================
function formatDate(dateString) {
    if (!dateString) return 'Fecha desconocida';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
}

function showError(message) {
    const container = document.getElementById('main-content-container');
    if (container) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4';
        errorDiv.innerHTML = `
            <p class="font-bold">Error</p>
            <p>${message}</p>
        `;
        container.prepend(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// ============================================
// FILTROS (OPCIONAL - PARA FUTURO)
// ============================================
function filterByCategory(categoryId) {
    loadPosts({ categoria: categoryId });
}

function sortPosts(order) {
    // order puede ser: 'recientes', 'antiguos', 'populares'
    loadPosts({ ordenar: order });
}

// ============================================
// HELPER: OBTENER HTML DE IMAGEN (BLOB O URL)
// ============================================
function getImageHTML(post) {
    // Si tiene BLOB, usar blob-api.php
    if (post.tieneBlob && post.tieneBlob == 1) {
        const imageUrl = `http://localhost/PWCI/PWCI-Backend/blob-api.php?action=download&tipo=publicacion&id=${post.idPublicacion}`;
        return `
            <div class="px-6 pb-4">
                <img src="${imageUrl}" 
                     alt="${post.titulo}" 
                     class="w-full rounded-lg object-cover max-h-96 cursor-pointer hover:opacity-95 transition-opacity"
                     onclick="goToPostDetail(${post.idPublicacion})"
                     onerror="console.error('Error cargando imagen BLOB'); this.style.display='none'">
            </div>
        `;
    }
    // Si tiene URL, usar URL
    else if (post.urlMultimedia) {
        return `
            <div class="px-6 pb-4">
                <img src="${post.urlMultimedia}" 
                     alt="${post.titulo}" 
                     class="w-full rounded-lg object-cover max-h-96 cursor-pointer hover:opacity-95 transition-opacity"
                     onclick="goToPostDetail(${post.idPublicacion})"
                     onerror="this.style.display='none'">
            </div>
        `;
    }
    // Sin imagen
    return '';
}

// ============================================
// EXPONER FUNCIONES GLOBALES PARA HTML
// ============================================
window.clearFilters = clearFilters;

console.log('✅ Feed controller cargado');
