(function () {
    const NEWS_API_BASE_URL = typeof API_BASE_URL !== 'undefined'
        ? API_BASE_URL
        : 'http://localhost/PWCI/PWCI-Backend/api.php';

    const CACHE_KEY = 'officialNewsCacheV1';
    const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 horas
    const DEFAULT_YEAR = 2022;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeOfficialNews);
    } else {
        initializeOfficialNews();
    }

    function initializeOfficialNews() {
        waitForElement('#officialNewsContainer', 15000)
            .then((container) => {
                if (container) {
                    loadOfficialNews(DEFAULT_YEAR, container);
                }
            })
            .catch((error) => {
                console.warn('El contenedor de noticias no se cargó a tiempo:', error);
            });
    }

    async function loadOfficialNews(year, container) {
        if (!container) {
            return;
        }

        const cached = getCachedNews(year);
        if (cached) {
            renderNews(container, cached);
            return;
        }

        renderSkeleton(container);

        try {
            const response = await fetch(`${NEWS_API_BASE_URL}/externo/fifa/noticias?year=${encodeURIComponent(year)}&limit=3`);
            const payload = await response.json();

            if (!response.ok || (payload && payload.status && payload.status >= 400)) {
                throw new Error(payload && payload.message ? payload.message : 'No se pudieron obtener las noticias oficiales.');
            }

            const data = payload.data || {};
            cacheNews(year, data);
            renderNews(container, data);
        } catch (error) {
            console.error('Error cargando noticias oficiales:', error);
            renderError(container, error.message || 'No se pudieron cargar las noticias oficiales.');
        }
    }

    function renderSkeleton(container) {
        container.innerHTML = `
            <div class="rounded-lg border border-zinc-800 bg-white/5 p-4 text-xs text-zinc-300 animate-pulse">
                Consultando titulares...
            </div>
        `;
    }

    function renderError(container, message) {
        container.innerHTML = `
            <div class="rounded-lg border border-red-700 bg-red-900/30 p-4 text-xs text-red-200">
                ${escapeHtml(message)}
            </div>
        `;
    }

    function renderNews(container, data) {
        const items = Array.isArray(data.items) ? data.items : [];
        const year = data.year || DEFAULT_YEAR;
        const lastSync = data.lastSync ? formatRelativeTime(data.lastSync) : null;

        if (!items.length) {
            container.innerHTML = `
                <div class="rounded-lg border border-zinc-800 bg-white/5 p-4 text-xs text-zinc-300">
                    No hay titulares disponibles para ${year}.
                </div>
            `;
            return;
        }

        const header = `
            <div class="flex items-center justify-between text-[10px] uppercase tracking-wide text-zinc-500">
                <span>Mundial ${year}</span>
                ${lastSync ? `<span>Actualizado ${escapeHtml(lastSync)}</span>` : ''}
            </div>
        `;

        const cards = items.map((item) => renderNewsCard(item)).join('');

        container.innerHTML = header + cards;
    }

    function renderNewsCard(item) {
        const dateLabel = item.date ? formatDateLabel(item.date) : null;
        const scoreLabel = item.score && item.score.display ? item.score.display : null;
        const summary = item.summary ? escapeHtml(item.summary) : null;
        const title = escapeHtml(item.title || 'Titular oficial');

        return `
            <article class="mt-3 rounded-lg border border-zinc-800 bg-white/5 p-4">
                ${dateLabel ? `<p class="text-[10px] uppercase tracking-wide text-zinc-500">${escapeHtml(dateLabel)}</p>` : ''}
                <h3 class="mt-1 text-xs font-semibold leading-snug text-white">${title}</h3>
                ${scoreLabel ? `<p class="mt-1 text-xs font-semibold text-amber-300">${escapeHtml(scoreLabel)}</p>` : ''}
                ${summary ? `<p class="mt-2 text-xs text-zinc-300 leading-relaxed">${summary}</p>` : ''}
            </article>
        `;
    }

    function cacheNews(year, data) {
        try {
            const payload = {
                year,
                storedAt: Date.now(),
                expiresAt: Date.now() + CACHE_TTL_MS,
                data
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
        } catch (error) {
            console.warn('No se pudo cachear noticias oficiales:', error);
        }
    }

    function getCachedNews(year) {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) {
                return null;
            }

            const payload = JSON.parse(raw);
            if (!payload || payload.year !== year) {
                return null;
            }

            if (!payload.expiresAt || Date.now() > payload.expiresAt) {
                localStorage.removeItem(CACHE_KEY);
                return null;
            }

            return payload.data || null;
        } catch (error) {
            console.warn('Cache de noticias oficiales corrupto:', error);
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
    }

    function waitForElement(selector, timeoutMs) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(selector);
            if (existing) {
                resolve(existing);
                return;
            }

            let timerId;
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    clearTimeout(timerId);
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            timerId = setTimeout(() => {
                observer.disconnect();
                reject(new Error('Timeout esperando ' + selector));
            }, timeoutMs || 10000);
        });
    }

    function formatDateLabel(dateString) {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
    }

    function formatRelativeTime(isoString) {
        const timestamp = Date.parse(isoString);
        if (Number.isNaN(timestamp)) {
            return null;
        }

        const diffMs = Date.now() - timestamp;
        const diffMinutes = Math.round(diffMs / (1000 * 60));

        if (diffMinutes < 1) {
            return 'hace instantes';
        }
        if (diffMinutes < 60) {
            return `hace ${diffMinutes} min`;
        }

        const diffHours = Math.round(diffMinutes / 60);
        if (diffHours < 24) {
            return `hace ${diffHours} h`;
        }

        const diffDays = Math.round(diffHours / 24);
        return `hace ${diffDays} d`;
    }

    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return '';
        }

        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
})();
