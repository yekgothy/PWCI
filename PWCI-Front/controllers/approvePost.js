/**
 * Panel de aprobación de publicaciones (Admin)
 * Coordina filtros, métricas y acciones de moderación.
 */

const ADMIN_API_BASE_URL = typeof API_BASE_URL !== 'undefined'
    ? API_BASE_URL
    : 'http://localhost/PWCI/PWCI-Backend/api.php';

const STATE_CONFIG = {
    pendiente: {
        label: 'Pendiente',
        badgeClass: 'border-amber-300 bg-amber-50 text-amber-700',
        emptyText: 'No hay publicaciones pendientes en este momento.'
    },
    aprobada: {
        label: 'Aprobada',
        badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-700',
        emptyText: 'No se encontraron publicaciones aprobadas que coincidan con tu búsqueda.'
    },
    rechazada: {
        label: 'Rechazada',
        badgeClass: 'border-rose-300 bg-rose-50 text-rose-700',
        emptyText: 'No hay publicaciones rechazadas registradas.'
    }
};

let currentFilter = 'pendiente';
let searchQuery = '';
let isFetching = false;

const postsCache = {
    pendiente: { items: [], lastUpdated: 0 },
    aprobada: { items: [], lastUpdated: 0 },
    rechazada: { items: [], lastUpdated: 0 }
};

const stats = {
    pendiente: 0,
    aprobada: 0,
    rechazada: 0
};

let feedbackTimerId = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!validateAdminSession()) {
        return;
    }

    bindUIEvents();
    changeFilter('pendiente', { forceReload: true });
    refreshStats();
});

function validateAdminSession() {
    const rawUserData = localStorage.getItem('userData');
    const token = localStorage.getItem('authToken');

    if (!rawUserData || !token) {
        alert('Inicia sesión como administrador para acceder a esta sección.');
        window.location.href = '../pages/login.html';
        return false;
    }

    try {
        const user = JSON.parse(rawUserData);
        if (!user || user.rol !== 'admin') {
            alert('Solo los administradores pueden acceder a este panel.');
            window.location.href = '../pages/feed.html';
            return false;
        }
    } catch (error) {
        console.error('Error al interpretar userData:', error);
        alert('Ocurrió un problema con la sesión. Inicia sesión nuevamente.');
        window.location.href = '../pages/login.html';
        return false;
    }

    return true;
}

function bindUIEvents() {
    document.querySelectorAll('[data-tab]').forEach(button => {
        button.addEventListener('click', () => {
            changeFilter(button.dataset.tab, { forceReload: true });
        });
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            searchQuery = event.target.value.trim().toLowerCase();
            renderPosts();
        });
    }

    const refreshButton = document.getElementById('refreshPostsBtn');
    if (refreshButton) {
        refreshButton.addEventListener('click', async (event) => {
            event.preventDefault();
            invalidateCaches();
            await Promise.all([loadPosts(currentFilter, { forceReload: true }), refreshStats()]);
        });
    }
}

function changeFilter(newFilter, options = {}) {
    if (!STATE_CONFIG[newFilter]) {
        return;
    }

    const shouldReload = options.forceReload || newFilter !== currentFilter;
    currentFilter = newFilter;
    setActiveFilterButton(newFilter);

    if (shouldReload) {
        loadPosts(newFilter, { forceReload: options.forceReload });
    } else {
        renderPosts();
    }
}

async function loadPosts(state, { forceReload = false } = {}) {
    if (isFetching) {
        return;
    }

    const container = document.getElementById('postsContainer');
    if (!container) {
        return;
    }

    const cacheEntry = postsCache[state];
    const isCacheFresh = !forceReload && cacheEntry.items.length > 0 && Date.now() - cacheEntry.lastUpdated < 60 * 1000;

    if (isCacheFresh) {
        renderPosts();
        return;
    }

    isFetching = true;
    renderLoadingState(container);

    try {
        const fetchedPosts = await fetchPostsByState(state);
        postsCache[state] = {
            items: fetchedPosts,
            lastUpdated: Date.now()
        };
        renderPosts();
    } catch (error) {
        console.error('Error al cargar publicaciones:', error);
        renderErrorState(container, error.message || 'No se pudieron cargar las publicaciones.');
        showFeedback(error.message || 'Hubo un problema al obtener las publicaciones.', 'error');
    } finally {
        isFetching = false;
    }
}

async function fetchPostsByState(state) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    }

    const response = await fetch(`${ADMIN_API_BASE_URL}/publicaciones?estado=${encodeURIComponent(state)}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    let payload;
    try {
        payload = await response.json();
    } catch (error) {
        throw new Error('Respuesta inválida del servidor.');
    }

    if (!response.ok) {
        throw new Error(payload && payload.message ? payload.message : 'No se pudieron obtener las publicaciones.');
    }

    return Array.isArray(payload.data) ? payload.data : [];
}

function renderPosts() {
    const container = document.getElementById('postsContainer');
    if (!container) {
        return;
    }

    const cacheEntry = postsCache[currentFilter];
    const filteredPosts = applySearchFilter(cacheEntry.items);

    if (filteredPosts.length === 0) {
        container.innerHTML = `
            <div class="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center text-sm text-neutral-500">
                ${STATE_CONFIG[currentFilter].emptyText}
            </div>
        `;
        return;
    }

    container.innerHTML = filteredPosts.map(buildPostCard).join('');
}

function renderLoadingState(container) {
    container.innerHTML = `
        <div class="grid gap-4 md:grid-cols-2">
            ${['', '', '', ''].map(() => `
                <div class="animate-pulse rounded-2xl border border-neutral-200 bg-white p-6">
                    <div class="flex items-center gap-4">
                        <div class="h-12 w-12 rounded-full bg-neutral-200"></div>
                        <div class="flex-1 space-y-3">
                            <div class="h-4 w-1/3 rounded bg-neutral-200"></div>
                            <div class="h-3 w-1/2 rounded bg-neutral-200"></div>
                        </div>
                    </div>
                    <div class="mt-6 space-y-3">
                        <div class="h-4 w-3/4 rounded bg-neutral-200"></div>
                        <div class="h-3 w-full rounded bg-neutral-200"></div>
                        <div class="h-3 w-5/6 rounded bg-neutral-200"></div>
                    </div>
                    <div class="mt-6 h-10 w-full rounded bg-neutral-200"></div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderErrorState(container, message) {
    container.innerHTML = `
        <div class="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600">
            ${escapeHtml(message)}
        </div>
    `;
}

function applySearchFilter(list) {
    if (!searchQuery) {
        return [...list];
    }

    const normalized = searchQuery.toLowerCase();
    return list.filter((post) => {
        return [
            post.titulo,
            post.nombreAutor,
            post.nombreCategoria,
            post.paisMundial,
            post.contenido
        ].some(field => typeof field === 'string' && field.toLowerCase().includes(normalized));
    });
}

function buildPostCard(post) {
    const safeTitle = escapeHtml(post.titulo || 'Publicación sin título');
    const safeAuthor = escapeHtml(post.nombreAutor || 'Autor desconocido');
    const safeContent = formatMultiline(post.contenido || 'Esta publicación no contiene descripción.');
    const statusBadge = renderStatusBadge(post.estado);
    const metaBadges = renderMetaBadges(post);
    const metrics = renderPostMetrics(post);
    const media = renderMedia(post);
    const actions = renderActionButtons(post);

    return `
        <article class="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md" data-post-id="${post.idPublicacion}">
            <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="flex flex-1 items-start gap-3">
                    ${renderAuthorAvatar(post)}
                    <div class="min-w-[200px] space-y-1">
                        <p class="text-sm font-semibold text-neutral-900">${safeAuthor}</p>
                        <div class="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                            <span>${formatRelativeDate(post.fechaPublicacion)}</span>
                            ${metaBadges}
                        </div>
                    </div>
                </div>
                ${statusBadge}
            </div>

            ${media}

            <h3 class="mt-5 text-xl font-semibold text-neutral-900">${safeTitle}</h3>
            <p class="mt-3 text-sm leading-relaxed text-neutral-600">${safeContent}</p>

            ${metrics}

            <div class="mt-6 flex flex-wrap gap-3">
                ${actions}
            </div>
        </article>
    `;
}

function renderStatusBadge(state) {
    const config = STATE_CONFIG[state] || STATE_CONFIG.pendiente;
    return `
        <span class="inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold ${config.badgeClass}">
            ${config.label}
        </span>
    `;
}

function renderMetaBadges(post) {
    const badges = [];

    if (post.nombreCategoria) {
        badges.push(`<span class="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
            <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            ${escapeHtml(post.nombreCategoria)}
        </span>`);
    }

    if (post.nombreMundial || post.paisMundial) {
        badges.push(`<span class="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
            <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ${escapeHtml(post.nombreMundial || post.paisMundial)}
        </span>`);
    }

    return badges.join('');
}

function renderPostMetrics(post) {
    const metrics = [
        {
            label: 'Reacciones',
            value: Number(post.totalReacciones || post.totalLikes || 0)
        },
        {
            label: 'Comentarios',
            value: Number(post.totalComentarios || 0)
        },
        {
            label: 'Reportes',
            value: Number(post.totalReportes || 0)
        }
    ];

    if (metrics.every(metric => !metric.value)) {
        return '';
    }

    return `
        <div class="mt-5 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
            ${metrics.map(metric => `
                <span class="inline-flex items-center gap-1">
                    <span class="h-2.5 w-2.5 rounded-full bg-neutral-300"></span>
                    ${metric.label}: <strong class="font-semibold text-neutral-700">${metric.value}</strong>
                </span>
            `).join('')}
        </div>
    `;
}

function renderMedia(post) {
    const mediaUrl = resolveMediaUrl(post);
    if (!mediaUrl) {
        return '';
    }

    return `
        <div class="mt-5 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
            <img src="${mediaUrl}" alt="${escapeHtml(post.titulo || 'Publicación')}" class="h-64 w-full object-cover" onerror="this.closest('div').remove();" />
        </div>
    `;
}

function renderActionButtons(post) {
    const state = post.estado || 'pendiente';
    const buttons = [];

    const viewButton = `
        <button type="button" onclick="viewPostDetails(${post.idPublicacion})"
            class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900 md:flex-none md:px-5">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276a1 1 0 011.447.894v5.764a1 1 0 01-1.447.894L15 13M5 19h6a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Ver detalles
        </button>`;

    if (state === 'pendiente') {
        buttons.push(`
            <button type="button" onclick="approvePost(${post.idPublicacion})"
                class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 md:flex-none md:px-5">
                <span aria-hidden="true">✓</span>
                Aprobar
            </button>
        `);
        buttons.push(`
            <button type="button" onclick="rejectPost(${post.idPublicacion})"
                class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-900 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white md:flex-none md:px-5">
                <span aria-hidden="true">✕</span>
                Rechazar
            </button>
        `);
    } else if (state === 'rechazada') {
        buttons.push(`
            <button type="button" onclick="approvePost(${post.idPublicacion})"
                class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 md:flex-none md:px-5">
                <span aria-hidden="true">↺</span>
                Aprobar ahora
            </button>
        `);
    }

    buttons.push(viewButton);
    return buttons.join('');
}

function renderAuthorAvatar(post) {
    const initials = getInitials(post.nombreAutor || 'Usuario');
    const avatarUrl = resolveAuthorAvatar(post);

    const imageClasses = ['h-12', 'w-12', 'rounded-full', 'border', 'border-neutral-200', 'object-cover'];
    const fallbackClasses = ['flex', 'h-12', 'w-12', 'items-center', 'justify-center', 'rounded-full', 'border', 'border-neutral-200', 'bg-neutral-100', 'text-sm', 'font-semibold', 'text-neutral-600'];

    return `
        <div class="relative">
            <img src="${avatarUrl || ''}" alt="${initials}" class="${imageClasses.join(' ')} ${avatarUrl ? '' : 'hidden'}" onerror="this.classList.add('hidden'); this.nextElementSibling.classList.remove('hidden');" />
            <div class="${fallbackClasses.join(' ')} ${avatarUrl ? 'hidden' : ''}">${initials}</div>
        </div>
    `;
}

function resolveAuthorAvatar(post) {
    try {
        if (window.PWCI && window.PWCI.avatar && typeof window.PWCI.avatar.getAvatarUrl === 'function') {
            return window.PWCI.avatar.getAvatarUrl({
                id: post.idAutor || post.idUsuario || post.idUsuarioAutor,
                foto: post.fotoAutor || post.fotoPerfil,
                hasBlob: post.autorTieneBlob || post.tieneFotoPerfil
            });
        }
    } catch (error) {
        console.warn('No se pudo resolver el avatar del autor:', error);
    }
    return post.fotoAutor || post.fotoPerfil || null;
}

function resolveMediaUrl(post) {
    if (toBooleanFlag(post.tieneBlob) || toBooleanFlag(post.tieneMultimedia)) {
        return `http://localhost/PWCI/PWCI-Backend/blob-api.php?action=download&tipo=publicacion&id=${post.idPublicacion}`;
    }

    if (post.urlMultimedia && typeof post.urlMultimedia === 'string') {
        return post.urlMultimedia;
    }

    return null;
}

async function approvePost(postId) {
    if (!postId) {
        return;
    }

    const confirmed = confirm('¿Aprobar esta publicación para que aparezca en el feed?');
    if (!confirmed) {
        return;
    }

    await updatePostState(postId, 'aprobada', {
        successMessage: 'La publicación fue aprobada correctamente.'
    });
}

async function rejectPost(postId) {
    if (!postId) {
        return;
    }

    const confirmed = confirm('¿Rechazar esta publicación? El autor recibirá la notificación correspondiente.');
    if (!confirmed) {
        return;
    }

    await updatePostState(postId, 'rechazada', {
        successMessage: 'La publicación fue rechazada y se notificará al autor.'
    });
}

async function updatePostState(postId, targetState, { successMessage } = {}) {
    togglePostLoading(postId, true);

    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
        }

        const response = await fetch(`${ADMIN_API_BASE_URL}/publicaciones/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ estado: targetState })
        });

        let payload = {};
        try {
            payload = await response.json();
        } catch (error) {
            // Ignorar, puede no devolver cuerpo
        }

        if (!response.ok) {
            throw new Error(payload && payload.message ? payload.message : 'No se pudo actualizar la publicación.');
        }

        removePostFromCurrentList(postId);
        invalidateCaches(['aprobada', 'rechazada'].filter(state => state !== currentFilter || state === targetState));
        await refreshStats();

        showFeedback(successMessage || 'Estado actualizado correctamente.', 'success');
    } catch (error) {
        console.error('Error al actualizar publicación:', error);
        showFeedback(error.message || 'Ocurrió un error al actualizar la publicación.', 'error');
    } finally {
        togglePostLoading(postId, false);
    }
}

function togglePostLoading(postId, isLoadingState) {
    const card = document.querySelector(`[data-post-id="${postId}"]`);
    if (!card) {
        return;
    }

    card.classList.toggle('opacity-60', isLoadingState);
    card.classList.toggle('pointer-events-none', isLoadingState);
}

function removePostFromCurrentList(postId) {
    const cacheEntry = postsCache[currentFilter];
    cacheEntry.items = cacheEntry.items.filter(post => post.idPublicacion !== postId);
    cacheEntry.lastUpdated = Date.now();
    renderPosts();
}

async function refreshStats() {
    const states = Object.keys(STATE_CONFIG);

    try {
        const counts = await Promise.all(states.map(async (state) => {
            const cacheEntry = postsCache[state];
            const isCacheFresh = cacheEntry.items.length > 0 && Date.now() - cacheEntry.lastUpdated < 60 * 1000;

            if (isCacheFresh) {
                return cacheEntry.items.length;
            }

            const items = await fetchPostsByState(state);
            postsCache[state] = {
                items,
                lastUpdated: Date.now()
            };

            if (state === currentFilter) {
                renderPosts();
            }

            return items.length;
        }));

        states.forEach((state, index) => {
            stats[state] = counts[index] || 0;
        });

        updateStatsUI();
        updateTabLabels();
    } catch (error) {
        console.error('Error al actualizar métricas:', error);
        showFeedback('No se pudo actualizar el resumen de publicaciones.', 'error');
    }
}

function updateStatsUI() {
    const pendientes = document.getElementById('statPendientes');
    const aprobadas = document.getElementById('statAprobadas');
    const rechazadas = document.getElementById('statRechazadas');

    if (pendientes) pendientes.textContent = stats.pendiente ?? '-';
    if (aprobadas) aprobadas.textContent = stats.aprobada ?? '-';
    if (rechazadas) rechazadas.textContent = stats.rechazada ?? '-';
}

function updateTabLabels() {
    const pendientesTab = document.getElementById('tabPendientes');
    const aprobadasTab = document.getElementById('tabAprobadas');
    const rechazadasTab = document.getElementById('tabRechazadas');

    if (pendientesTab) pendientesTab.textContent = `Pendientes (${stats.pendiente ?? 0})`;
    if (aprobadasTab) aprobadasTab.textContent = `Aprobadas (${stats.aprobada ?? 0})`;
    if (rechazadasTab) rechazadasTab.textContent = `Rechazadas (${stats.rechazada ?? 0})`;
}

function invalidateCaches(states = Object.keys(postsCache)) {
    states.forEach(state => {
        postsCache[state] = { items: [], lastUpdated: 0 };
    });
}

function setActiveFilterButton(activeState) {
    document.querySelectorAll('[data-tab]').forEach(button => {
        const isActive = button.dataset.tab === activeState;
        button.classList.toggle('bg-neutral-900', isActive);
        button.classList.toggle('text-white', isActive);
        button.classList.toggle('shadow-sm', isActive);
        button.classList.toggle('bg-white', !isActive);
        button.classList.toggle('text-neutral-600', !isActive);
    });
}

function viewPostDetails(postId) {
    if (!postId) {
        return;
    }

    window.open(`../pages/postDetails.html?id=${postId}`, '_blank');
}

function showFeedback(message, type = 'info') {
    const feedbackElement = document.getElementById('feedbackMessage');
    if (!feedbackElement) {
        return;
    }

    feedbackElement.classList.add('hidden');
    feedbackElement.textContent = '';

    const baseClasses = ['mb-6', 'rounded-xl', 'border', 'px-4', 'py-3', 'text-sm', 'font-medium'];
    const typeStyles = {
        success: ['border-green-200', 'bg-green-50', 'text-green-700'],
        error: ['border-red-200', 'bg-red-50', 'text-red-700'],
        info: ['border-neutral-200', 'bg-white', 'text-neutral-600']
    };

    const appliedClasses = typeStyles[type] || typeStyles.info;

    feedbackElement.className = `${baseClasses.join(' ')} ${appliedClasses.join(' ')}`;

    if (message) {
        feedbackElement.textContent = message;
        feedbackElement.classList.remove('hidden');

        if (feedbackTimerId) {
            clearTimeout(feedbackTimerId);
        }

        feedbackTimerId = setTimeout(() => {
            feedbackElement.classList.add('hidden');
        }, 4000);
    }
}

function escapeHtml(text) {
    if (text === null || text === undefined) {
        return '';
    }

    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatMultiline(text) {
    const sanitized = escapeHtml(text);
    return sanitized.replace(/\n/g, '<br>');
}

function toBooleanFlag(value) {
    try {
        if (window.PWCI && window.PWCI.avatar && typeof window.PWCI.avatar.normalizeBoolean === 'function') {
            return window.PWCI.avatar.normalizeBoolean(value);
        }
    } catch (error) {
        // Ignorar - fallback manual
    }

    if (value === null || value === undefined) {
        return false;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'number') {
        return value === 1;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'si';
    }

    return false;
}

function getInitials(fullName) {
    if (!fullName || typeof fullName !== 'string') {
        return 'US';
    }

    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRelativeDate(dateString) {
    if (!dateString) {
        return 'Fecha desconocida';
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return 'Fecha desconocida';
    }

    const now = new Date();
    const diffMs = now - date;

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
        return 'Hace instantes';
    }
    if (minutes < 60) {
        return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }
    if (hours < 24) {
        return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    }
    if (days < 7) {
        return `Hace ${days} día${days !== 1 ? 's' : ''}`;
    }

    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

