// ============================================
// CONTROLADOR DEL FEED - WORLD CUP HUB
// ============================================

// Estado global
let currentUser = null;
let allPosts = [];
let filteredPosts = [];
let categories = [];
let worldCups = [];

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

// ============================================
// CARGAR PUBLICACIONES
// ============================================
async function loadPosts() {
    try {
        console.log('Cargando posts desde API (middleware)...');
        const data = await api.get('/publicaciones?estado=aprobada');
        
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
        
        applyFilters();
    } catch (error) {
        if (error instanceof APIError) {
            console.error('APIError cargando posts:', error);
            showError(error.message || 'No se pudieron cargar las publicaciones');
        } else {
            console.error('Error cargando posts:', error);
            showError('Error de conexión con el servidor');
        }
    }
}

// ============================================
// CARGAR CATEGORÍAS
// ============================================
async function loadCategories() {
    try {
        const data = await api.get('/categorias');
        
        categories = data.data || data || [];
        console.log(`✅ ${categories.length} categorías cargadas`);
        
        populateCategoryFilter();
    } catch (error) {
        if (error instanceof APIError) {
            console.error('APIError cargando categorías:', error);
        } else {
            console.error('Error cargando categorías:', error);
        }
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
        const data = await api.get('/mundiales');
        
        worldCups = data.data || data || [];
        console.log(`✅ ${worldCups.length} mundiales cargados`);
        
        populateWorldCupFilter();
    } catch (error) {
        if (error instanceof APIError) {
            console.error('APIError cargando mundiales:', error);
        } else {
            console.error('Error cargando mundiales:', error);
        }
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
    if (!allPosts || allPosts.length === 0) {
        console.log('⏸️ Sin publicaciones cargadas; filtros no aplicados');
        return;
    }
    
    const rawSearch = document.getElementById('searchInput')?.value || '';
    const searchText = rawSearch.trim().toLowerCase();
    const categoryId = document.getElementById('categoryFilter')?.value || '';
    const worldCupId = document.getElementById('worldCupFilter')?.value || '';
    const sortBy = document.getElementById('sortFilter')?.value || 'recientes';
    
    console.log('🔍 Aplicando filtros:', { searchText, categoryId, worldCupId, sortBy });
    
    // Filtrar posts
    filteredPosts = allPosts.filter(post => {
        const matchesSearch = !searchText || matchesSearchText(post, searchText);
        
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
    sortFeedPosts(filteredPosts, sortBy);
    
    // Renderizar
    renderPosts(filteredPosts);
    updateResultsCount();
}

function matchesSearchText(post, searchText) {
    const fieldsToCheck = [
        post.titulo,
        post.contenido,
        post.nombreAutor,
        post.nombreCategoria,
        post.nombreMundial,
        post.paisMundial,
        post.anioMundial ? String(post.anioMundial) : null
    ];

    return fieldsToCheck.some(field => {
        if (field === undefined || field === null) {
            return false;
        }
        return String(field).toLowerCase().includes(searchText);
    });
}

function sortFeedPosts(posts, sortBy) {
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
    const categoryBadge = post.nombreCategoria ? `<span class="px-2.5 py-0.5 bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-full">${post.nombreCategoria}</span>` : '';
    const avatarUtils = window.PWCI && window.PWCI.avatar ? window.PWCI.avatar : null;
    const avatarUrl = avatarUtils ? avatarUtils.getAvatarUrl({
        id: post.idUsuario,
        foto: post.fotoAutor,
        hasBlob: post.autorTieneFotoBlob
    }) : null;
    
    return `
        <article class="bg-white/95 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 mb-5 overflow-hidden border border-zinc-200" data-post-id="${post.idPublicacion}">
            <!-- Header del post -->
            <div class="p-5 pb-3">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center">
                        <div class="relative w-10 h-10 flex items-center justify-center">
                            <img src="${avatarUrl || ''}" alt="Foto de ${userName}"
                                 class="${avatarUrl ? '' : 'hidden '}w-10 h-10 rounded-full object-cover border border-zinc-200 shadow-md"
                                 onerror="this.classList.add('hidden'); this.nextElementSibling.classList.remove('hidden');">
                            <div class="${avatarUrl ? 'hidden ' : ''}w-10 h-10 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-full flex items-center justify-center shadow-md">
                                <span class="text-white font-bold text-base">${userInitial}</span>
                            </div>
                        </div>
                        <div class="ml-3">
                            <p class="font-semibold text-zinc-900">${userName}</p>
                            <p class="text-sm text-zinc-500">${postDate}</p>
                        </div>
                    </div>
                    ${categoryBadge}
                </div>
                
                <!-- Título y contenido -->
                <h2 class="text-xl font-bold text-zinc-900 mb-2 hover:text-zinc-700 cursor-pointer" onclick="goToPostDetail(${post.idPublicacion})">
                    ${post.titulo}
                </h2>
                <p class="text-zinc-700 mb-3 whitespace-pre-line leading-normal">${post.contenido}</p>
            </div>
            
            <!-- Imagen (si existe) -->
            ${getImageHTML(post)}
            
            
            <!-- Interacciones -->
            <div class="px-5 pb-5">
                <div class="flex items-center justify-between pt-3 border-t border-zinc-200">
                    <div class="flex items-center space-x-5">
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

function findPostById(postId) {
    return allPosts.find(post => String(post.idPublicacion) === String(postId));
}

function normalizeCountValue(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function getPostLikeCount(post) {
    if (post.likes !== undefined && post.likes !== null) {
        return normalizeCountValue(post.likes);
    }
    if (post.totalLikes !== undefined && post.totalLikes !== null) {
        return normalizeCountValue(post.totalLikes);
    }
    if (post.reaccionesPositivas !== undefined && post.reaccionesPositivas !== null) {
        return normalizeCountValue(post.reaccionesPositivas);
    }
    return 0;
}

function setPostLikeCount(post, value) {
    const normalized = normalizeCountValue(value);
    post.likes = normalized;
    if ('totalLikes' in post) {
        post.totalLikes = normalized;
    }
    if ('reaccionesPositivas' in post) {
        post.reaccionesPositivas = normalized;
    }
}

function getPostDislikeCount(post) {
    if (post.dislikes !== undefined && post.dislikes !== null) {
        return normalizeCountValue(post.dislikes);
    }
    if (post.totalDislikes !== undefined && post.totalDislikes !== null) {
        return normalizeCountValue(post.totalDislikes);
    }
    if (post.reaccionesNegativas !== undefined && post.reaccionesNegativas !== null) {
        return normalizeCountValue(post.reaccionesNegativas);
    }
    return 0;
}

function setPostDislikeCount(post, value) {
    const normalized = normalizeCountValue(value);
    post.dislikes = normalized;
    if ('totalDislikes' in post) {
        post.totalDislikes = normalized;
    }
    if ('reaccionesNegativas' in post) {
        post.reaccionesNegativas = normalized;
    }
}

function applyInteractionTransition(post, nextState) {
    const previousState = post.userInteraction || null;
    let likes = getPostLikeCount(post);
    let dislikes = getPostDislikeCount(post);

    if (previousState === 'like') {
        likes = Math.max(0, likes - 1);
    } else if (previousState === 'dislike') {
        dislikes = Math.max(0, dislikes - 1);
    }

    if (nextState === 'like') {
        likes += 1;
    } else if (nextState === 'dislike') {
        dislikes += 1;
    }

    setPostLikeCount(post, likes);
    setPostDislikeCount(post, dislikes);
    post.userInteraction = nextState;

    if ('totalReacciones' in post) {
        post.totalReacciones = normalizeCountValue(likes + dislikes);
    }

    return { previous: previousState, next: nextState };
}

function updatePostInteractionUI(post) {
    const card = document.querySelector(`[data-post-id="${post.idPublicacion}"]`);
    if (!card) {
        return;
    }

    const likeBtn = card.querySelector('.like-btn');
    if (likeBtn) {
        const likeClassesActive = ['text-green-600', 'bg-green-50'];
        const likeClassesInactive = ['text-zinc-600', 'hover:text-green-600', 'hover:bg-green-50'];

        [...likeClassesActive, ...likeClassesInactive].forEach(cls => likeBtn.classList.remove(cls));

        if (post.userInteraction === 'like') {
            likeClassesActive.forEach(cls => likeBtn.classList.add(cls));
        } else {
            likeClassesInactive.forEach(cls => likeBtn.classList.add(cls));
        }

        const likeCounter = likeBtn.querySelector('span.font-semibold');
        if (likeCounter) {
            likeCounter.textContent = getPostLikeCount(post);
        }
    }

    const dislikeBtn = card.querySelector('.dislike-btn');
    if (dislikeBtn) {
        const dislikeClassesActive = ['text-red-600', 'bg-red-50'];
        const dislikeClassesInactive = ['text-zinc-600', 'hover:text-red-600', 'hover:bg-red-50'];

        [...dislikeClassesActive, ...dislikeClassesInactive].forEach(cls => dislikeBtn.classList.remove(cls));

        if (post.userInteraction === 'dislike') {
            dislikeClassesActive.forEach(cls => dislikeBtn.classList.add(cls));
        } else {
            dislikeClassesInactive.forEach(cls => dislikeBtn.classList.add(cls));
        }

        const dislikeCounter = dislikeBtn.querySelector('span.font-semibold');
        if (dislikeCounter) {
            dislikeCounter.textContent = getPostDislikeCount(post);
        }
    }
}

function shouldResortByLikes() {
    const sortFilter = document.getElementById('sortFilter');
    return sortFilter && sortFilter.value === 'likes';
}

async function handleLike(postId) {
    if (!api.hasToken()) {
        alert('Debes iniciar sesión para dar like');
        return;
    }

    const post = findPostById(postId);
    if (!post) {
        console.warn('Publicación no encontrada para like:', postId);
        return;
    }

    try {
        if (post.userInteraction === 'like') {
            await api.delete(`/publicaciones/${postId}/interaccion`);
            applyInteractionTransition(post, null);
            updatePostInteractionUI(post);
            if (shouldResortByLikes()) {
                applyFilters();
            }
            return;
        }

        const data = await api.post(`/publicaciones/${postId}/like`);
        if (!data || (data.status !== 200 && data.status !== 409)) {
            throw new APIError('No se pudo registrar el like.', data ? data.status : 500, data);
        }

        applyInteractionTransition(post, 'like');
        updatePostInteractionUI(post);
        if (shouldResortByLikes()) {
            applyFilters();
        }
    } catch (error) {
        console.error('Error al procesar like:', error);
        showError('No se pudo procesar tu like. Intenta más tarde.');
    }
}

async function handleDislike(postId) {
    if (!api.hasToken()) {
        alert('Debes iniciar sesión para dar dislike');
        return;
    }

    const post = findPostById(postId);
    if (!post) {
        console.warn('Publicación no encontrada para dislike:', postId);
        return;
    }

    try {
        if (post.userInteraction === 'dislike') {
            await api.delete(`/publicaciones/${postId}/interaccion`);
            applyInteractionTransition(post, null);
            updatePostInteractionUI(post);
            if (shouldResortByLikes()) {
                applyFilters();
            }
            return;
        }

        const data = await api.post(`/publicaciones/${postId}/dislike`);
        if (!data || (data.status !== 200 && data.status !== 409)) {
            throw new APIError('No se pudo registrar el dislike.', data ? data.status : 500, data);
        }

        applyInteractionTransition(post, 'dislike');
        updatePostInteractionUI(post);
        if (shouldResortByLikes()) {
            applyFilters();
        }
    } catch (error) {
        console.error('Error al procesar dislike:', error);
        showError('No se pudo procesar tu dislike. Intenta más tarde.');
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
function filterFeedByCategory(categoryId) {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.value = categoryId || '';
    }
    applyFilters();
}

function setFeedSorting(order) {
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.value = order || 'recientes';
    }
    applyFilters();
}

// ============================================
// HELPER: OBTENER HTML DE IMAGEN (BLOB O URL)
// ============================================
function getImageHTML(post) {
    // Si tiene BLOB, usar blob-api.php
    if (post.tieneBlob && post.tieneBlob == 1) {
        const imageUrl = `http://localhost/PWCI/PWCI-Backend/blob-api.php?action=download&tipo=publicacion&id=${post.idPublicacion}`;
        return `
            <div class="px-5 pb-3">
                <img src="${imageUrl}" 
                     alt="${post.titulo}" 
                     class="w-full rounded-lg object-cover max-h-80 cursor-pointer hover:opacity-95 transition-opacity"
                     onclick="goToPostDetail(${post.idPublicacion})"
                     onerror="console.error('Error cargando imagen BLOB'); this.style.display='none'">
            </div>
        `;
    }
    // Si tiene URL, usar URL
    else if (post.urlMultimedia) {
        return `
            <div class="px-5 pb-3">
                <img src="${post.urlMultimedia}" 
                     alt="${post.titulo}" 
                     class="w-full rounded-lg object-cover max-h-80 cursor-pointer hover:opacity-95 transition-opacity"
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
window.filterFeedByCategory = filterFeedByCategory;
window.setFeedSorting = setFeedSorting;

console.log('✅ Feed controller cargado');
