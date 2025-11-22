const ADMIN_API_BASE_URL = typeof API_BASE_URL !== 'undefined'
    ? API_BASE_URL
    : 'http://localhost/PWCI/PWCI-Backend/api.php';

const MOTIVO_LABELS = {
    spam: 'Spam o publicidad',
    lenguaje_ofensivo: 'Lenguaje ofensivo',
    acoso: 'Acoso o bullying',
    contenido_inapropiado: 'Contenido inapropiado',
    otro: 'Otro'
};

const REPORT_STATE_CONFIG = {
    pendiente: {
        label: 'Pendiente',
        badgeClass: 'border-yellow-200 bg-yellow-50 text-yellow-700'
    },
    revisado: {
        label: 'Revisado',
        badgeClass: 'border-blue-200 bg-blue-50 text-blue-700'
    },
    accion_tomada: {
        label: 'Acción tomada',
        badgeClass: 'border-green-200 bg-green-50 text-green-700'
    }
};

let currentFilter = 'pendiente';
let searchQuery = '';
let reportesData = {
    stats: {},
    comentarios: []
};

document.addEventListener('DOMContentLoaded', () => {
    if (!ensureAdminAccess()) {
        return;
    }

    bindEvents();
    loadReports();
});

function ensureAdminAccess() {
    const token = localStorage.getItem('authToken');
    const userDataRaw = localStorage.getItem('userData');

    if (!token || !userDataRaw) {
        alert('Acceso denegado. Inicia sesión como administrador para continuar.');
        window.location.href = '../pages/login.html';
        return false;
    }

    try {
        const userData = JSON.parse(userDataRaw);
        if (!userData || userData.rol !== 'admin') {
            alert('Solo los administradores pueden acceder a esta sección.');
            window.location.href = '../pages/feed.html';
            return false;
        }
    } catch (error) {
        console.error('Error al validar datos de usuario:', error);
        alert('Ocurrió un problema con la sesión. Inicia sesión nuevamente.');
        window.location.href = '../pages/login.html';
        return false;
    }

    return true;
}

function bindEvents() {
    const estadoFilter = document.getElementById('estadoFilter');
    if (estadoFilter) {
        estadoFilter.addEventListener('change', async (event) => {
            currentFilter = event.target.value;
            await loadReports();
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            searchQuery = searchInput.value.trim().toLowerCase();
            renderComments(reportesData.comentarios);
        });
    }

    const refreshButton = document.getElementById('refreshReportsBtn');
    if (refreshButton) {
        refreshButton.addEventListener('click', async (event) => {
            event.preventDefault();
            await loadReports();
        });
    }

    document.addEventListener('submit', async (event) => {
        const form = event.target.closest('.report-action-form');
        if (!form) {
            return;
        }

        event.preventDefault();
        await handleReportFormSubmit(form);
    });
}

async function loadReports(showLoader = true) {
    const commentList = document.getElementById('commentList');
    if (showLoader && commentList) {
        commentList.innerHTML = '<div class="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">Cargando reportes de comentarios...</div>';
    }

    showFeedback('', 'info');

    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Tu sesión expiró. Inicia sesión nuevamente.');
        window.location.href = '../pages/login.html';
        return;
    }

    const query = currentFilter === 'todos' ? '' : `?estado=${encodeURIComponent(currentFilter)}`;

    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/reportes-comentarios${query}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok || (result && result.status && result.status >= 400)) {
            throw new Error(result && result.message ? result.message : 'No se pudieron obtener los reportes.');
        }

        reportesData = {
            stats: result.data && result.data.stats ? result.data.stats : {},
            comentarios: result.data && Array.isArray(result.data.comentarios) ? result.data.comentarios : []
        };

        renderStats(reportesData.stats);
        renderComments(reportesData.comentarios);
        showFeedback('', 'info');
    } catch (error) {
        console.error('Error cargando reportes de comentarios:', error);
        renderStats({});
        if (commentList) {
            commentList.innerHTML = `<div class="rounded-xl border border-dashed border-red-200 bg-red-50 p-8 text-center text-sm text-red-600">${escapeHtml(error.message || 'Ocurrió un error al cargar los reportes.')}</div>`;
        }
        showFeedback(error.message || 'No se pudieron obtener los reportes de comentarios.', 'error');
    }
}

function renderStats(stats) {
    const totalComentarios = document.getElementById('statTotalComentarios');
    const totalReportados = document.getElementById('statTotalReportados');
    const reportesPendientes = document.getElementById('statReportesPendientes');
    const comentariosEliminados = document.getElementById('statComentariosEliminados');

    if (totalComentarios) {
        totalComentarios.textContent = stats && typeof stats.totalComentarios === 'number' ? stats.totalComentarios : 0;
    }

    if (totalReportados) {
        totalReportados.textContent = stats && typeof stats.totalReportados === 'number' ? stats.totalReportados : 0;
    }

    if (reportesPendientes) {
        reportesPendientes.textContent = stats && typeof stats.reportesPendientes === 'number' ? stats.reportesPendientes : 0;
    }

    if (comentariosEliminados) {
        comentariosEliminados.textContent = stats && typeof stats.totalEliminados === 'number' ? stats.totalEliminados : 0;
    }
}

function renderComments(comentarios) {
    const listElement = document.getElementById('commentList');
    if (!listElement) {
        return;
    }

    const items = Array.isArray(comentarios) ? comentarios : [];
    const filtered = searchQuery
        ? items.filter((comentario) => commentMatchesSearch(comentario, searchQuery))
        : items;

    if (filtered.length === 0) {
        const emptyMessage = searchQuery
            ? 'No se encontraron comentarios que coincidan con la búsqueda.'
            : 'No hay reportes para mostrar con los filtros seleccionados.';

        listElement.innerHTML = `<div class="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center text-neutral-500">${escapeHtml(emptyMessage)}</div>`;
        return;
    }

    listElement.innerHTML = filtered.map((comentario) => buildCommentCard(comentario)).join('');
}

function commentMatchesSearch(comentario, term) {
    if (!comentario) {
        return false;
    }

    const target = term.toLowerCase();

    const campos = [
        comentario.contenidoComentario,
        comentario.tituloPublicacion,
        comentario.autorComentario && comentario.autorComentario.nombre
    ];

    if (Array.isArray(comentario.reportes)) {
        comentario.reportes.forEach((reporte) => {
            campos.push(reporte.motivo);
            campos.push(reporte.descripcion);
            if (reporte.reportador) {
                campos.push(reporte.reportador.nombre);
            }
        });
    }

    return campos.some((campo) => {
        if (!campo) {
            return false;
        }
        return String(campo).toLowerCase().includes(target);
    });
}

function buildCommentCard(comentario) {
    const autor = comentario.autorComentario || {};
    const avatarHtml = renderAvatar(autor);
    const totalReportes = Number(comentario.totalReportes || 0);
    const pendientes = Number(comentario.pendientes || 0);
    const comentarioActivo = Number(comentario.comentarioActivo || 0) === 1;

    const resumenBadges = [];

    if (totalReportes > 0) {
        resumenBadges.push(`
            <span class="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                ${totalReportes} reporte${totalReportes === 1 ? '' : 's'}
            </span>
        `);
    } else {
        resumenBadges.push(`
            <span class="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-500">
                Sin reportes activos
            </span>
        `);
    }

    if (pendientes > 0) {
        resumenBadges.push(`
            <span class="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                ${pendientes} pendiente${pendientes === 1 ? '' : 's'}
            </span>
        `);
    }

    resumenBadges.push(
        comentarioActivo
            ? '<span class="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Comentario activo</span>'
            : '<span class="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">Comentario eliminado</span>'
    );

    const contenido = formatMultiline(comentario.contenidoComentario || '');

    const reportesHtml = Array.isArray(comentario.reportes)
        ? comentario.reportes.map((reporte) => buildReportRow(reporte, comentario)).join('')
        : '';

    return `
        <article class="rounded-2xl border ${pendientes > 0 ? 'border-red-200' : 'border-neutral-200'} bg-white shadow-sm">
            <div class="p-6">
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div class="flex items-start gap-3">
                            ${avatarHtml}
                            <div>
                                <h4 class="text-sm font-semibold text-neutral-900">${escapeHtml(autor.nombre || 'Usuario')}</h4>
                                <p class="text-xs text-neutral-500">Comentó el ${formatDateTime(comentario.fechaComentario)}</p>
                                <p class="mt-1 text-xs text-neutral-400">En: ${escapeHtml(comentario.tituloPublicacion || 'Publicación')}</p>
                            </div>
                        </div>
                        <div class="flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-600">
                            ${resumenBadges.join('')}
                        </div>
                    </div>
                    <div class="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                        ${contenido || '<span class="text-neutral-400">Sin contenido</span>'}
                    </div>
                    <div class="flex flex-col gap-3 text-xs text-neutral-500 md:flex-row md:items-center md:justify-between">
                        <span>ID comentario: ${comentario.idComentario}</span>
                        <a href="../pages/postDetails.html?id=${comentario.idPublicacion}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100">
                            Ver publicación
                        </a>
                    </div>
                </div>
            </div>
            <div class="divide-y border-t border-neutral-200 bg-neutral-50">
                ${reportesHtml || '<div class="p-6 text-sm text-neutral-500">Sin reportes asociados.</div>'}
            </div>
        </article>
    `;
}

function buildReportRow(reporte, comentario) {
    const estadoConfig = getReportStateConfig(reporte.estado);
    const motivoLabel = MOTIVO_LABELS[reporte.motivo] || 'Otro';
    const descripcionHtml = formatMultiline(reporte.descripcion || '');
    const reportador = reporte.reportador || {};

    const accionOptions = [
        '<option value="">Sin acción adicional</option>',
        `<option value="eliminar" ${comentario.comentarioActivo ? '' : 'disabled'}>Eliminar comentario</option>`,
        `<option value="reactivar" ${comentario.comentarioActivo ? 'disabled' : ''}>Reactivar comentario</option>`
    ];

    return `
        <div class="p-6">
            <form class="report-action-form flex flex-col gap-4 md:flex-row md:items-center md:justify-between" data-report-id="${reporte.idReporte}" data-comment-id="${comentario.idComentario}">
                <div class="flex-1">
                    <div class="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span class="inline-flex items-center rounded-full border ${estadoConfig.badgeClass} px-3 py-1">${estadoConfig.label}</span>
                        <span class="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-neutral-600">${escapeHtml(motivoLabel)}</span>
                    </div>
                    ${descripcionHtml ? `<p class="mt-3 text-sm text-neutral-600">${descripcionHtml}</p>` : ''}
                    <p class="mt-3 text-xs text-neutral-400">Reportado por ${escapeHtml(reportador.nombre || 'Usuario')} • ${formatDateTime(reporte.fechaReporte)}</p>
                </div>
                <div class="flex flex-col gap-3 md:w-80">
                    <select class="report-estado-select rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500">
                        <option value="pendiente" ${reporte.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="revisado" ${reporte.estado === 'revisado' ? 'selected' : ''}>Revisado</option>
                        <option value="accion_tomada" ${reporte.estado === 'accion_tomada' ? 'selected' : ''}>Acción tomada</option>
                    </select>
                    <select class="report-comment-action-select rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500">
                        ${accionOptions.join('')}
                    </select>
                    <button type="submit" class="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Guardar cambios
                    </button>
                </div>
            </form>
        </div>
    `;
}

async function handleReportFormSubmit(form) {
    const reportId = Number(form.dataset.reportId);
    if (!reportId) {
        showFeedback('No se pudo identificar el reporte seleccionado.', 'error');
        return;
    }

    const estadoSelect = form.querySelector('.report-estado-select');
    const accionSelect = form.querySelector('.report-comment-action-select');
    const estado = estadoSelect ? estadoSelect.value : '';
    const accionComentario = accionSelect ? accionSelect.value : '';

    if (!estado) {
        showFeedback('Selecciona un estado para actualizar el reporte.', 'error');
        return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Tu sesión expiró. Inicia sesión nuevamente.');
        window.location.href = '../pages/login.html';
        return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('opacity-60', 'cursor-not-allowed');
    }

    const payload = { estado };
    if (accionComentario) {
        payload.accionComentario = accionComentario;
    }

    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/reportes-comentarios/${reportId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok || (result && result.status && result.status >= 400)) {
            throw new Error(result && result.message ? result.message : 'No se pudo actualizar el reporte.');
        }

        showFeedback('Reporte actualizado correctamente.', 'success');
        await loadReports(false);
    } catch (error) {
        console.error('Error al actualizar el reporte:', error);
        showFeedback(error.message || 'Ocurrió un error al actualizar el reporte.', 'error');
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.classList.remove('opacity-60', 'cursor-not-allowed');
        }
    }
}

function showFeedback(message, type = 'info') {
    const box = document.getElementById('feedbackMessage');
    if (!box) {
        return;
    }

    box.classList.remove('hidden', 'border-red-200', 'bg-red-50', 'text-red-700', 'border-green-200', 'bg-green-50', 'text-green-700', 'border-neutral-200', 'bg-neutral-50', 'text-neutral-600');

    if (!message) {
        box.classList.add('hidden');
        box.textContent = '';
        box.classList.add('border-neutral-200', 'bg-neutral-50', 'text-neutral-600');
        return;
    }

    let classes;
    switch (type) {
        case 'success':
            classes = ['border-green-200', 'bg-green-50', 'text-green-700'];
            break;
        case 'error':
            classes = ['border-red-200', 'bg-red-50', 'text-red-700'];
            break;
        default:
            classes = ['border-neutral-200', 'bg-neutral-50', 'text-neutral-600'];
            break;
    }

    box.textContent = message;
    box.classList.add(...classes);
    box.classList.remove('hidden');
}

function renderAvatar(persona = {}) {
    const avatarUtils = window.PWCI && window.PWCI.avatar ? window.PWCI.avatar : null;
    const avatarUrl = avatarUtils
        ? avatarUtils.getAvatarUrl({
              id: persona.idUsuario,
              foto: persona.foto,
              hasBlob: persona.tieneBlob
          })
        : null;

    const nombre = persona.nombre || 'Usuario';
    const inicial = nombre.charAt(0).toUpperCase();

    return `
        <div class="relative h-10 w-10 flex-shrink-0">
            <img src="${avatarUrl || ''}" alt="Foto de ${escapeHtml(nombre)}" class="${avatarUrl ? '' : 'hidden '}h-10 w-10 rounded-full border border-neutral-200 object-cover" onerror="this.classList.add('hidden'); this.nextElementSibling.classList.remove('hidden');">
            <div class="${avatarUrl ? 'hidden ' : ''}flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-sm font-semibold text-white">
                ${escapeHtml(inicial)}
            </div>
        </div>
    `;
}

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value).replace(/[&<>"']/g, (char) => {
        switch (char) {
            case '&':
                return '&amp;';
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '"':
                return '&quot;';
            case '\'':
                return '&#39;';
            default:
                return char;
        }
    });
}

function formatMultiline(value) {
    if (!value) {
        return '';
    }

    return escapeHtml(value).replace(/\r?\n/g, '<br>');
}

function formatDateTime(value) {
    if (!value) {
        return 'Fecha desconocida';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

function getReportStateConfig(estado) {
    return REPORT_STATE_CONFIG[estado] || {
        label: 'Estado desconocido',
        badgeClass: 'border-neutral-200 bg-neutral-100 text-neutral-500'
    };
}
