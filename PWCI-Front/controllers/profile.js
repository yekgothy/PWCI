/**
 * Controlador para el Perfil de Usuario
 * Muestra información del usuario, sus publicaciones y estadísticas
 */

const API_BASE_URL = 'http://localhost/PWCI/PWCI-Backend/api.php';
const BLOB_API_BASE_URL = 'http://localhost/PWCI/PWCI-Backend/blob-api.php';

// Estado global
let currentUser = null;
let currentFilter = 'todas';
let userPosts = [];
let userStats = {
    totalPosts: 0,
    aprobadas: 0,
    pendientes: 0,
    rechazadas: 0,
    totalLikes: 0,
    totalComentarios: 0
};
let isEditingProfile = false;
let isUploadingPhoto = false;

function initPhotoUploadControls() {
    const changeButton = document.getElementById('changePhotoButton');
    const fileInput = document.getElementById('profilePhotoInput');

    if (!changeButton || !fileInput) {
        return;
    }

    changeButton.addEventListener('click', (event) => {
        event.preventDefault();
        if (isUploadingPhoto) return;
        fileInput.click();
    });

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }
        await handlePhotoUpload(file);
        fileInput.value = '';
    });
}

function validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        return 'Formato no permitido. Usa JPG, PNG, GIF o WEBP.';
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        return 'La imagen debe pesar menos de 5MB.';
    }
    return null;
}

function setPhotoUploadMessage(message, type = 'info') {
    const messageBox = document.getElementById('photoUploadMessage');
    if (!messageBox) return;
    if (!message) {
        messageBox.classList.add('hidden');
        messageBox.textContent = '';
        messageBox.classList.remove('text-green-600', 'text-red-600', 'text-neutral-600');
        return;
    }
    messageBox.textContent = message;
    messageBox.classList.remove('hidden', 'text-green-600', 'text-red-600', 'text-neutral-600');
    if (type === 'success') {
        messageBox.classList.add('text-green-600');
    } else if (type === 'error') {
        messageBox.classList.add('text-red-600');
    } else {
        messageBox.classList.add('text-neutral-600');
    }
}

function setPhotoUploadLoading(isLoading) {
    isUploadingPhoto = isLoading;
    const changeButton = document.getElementById('changePhotoButton');
    if (changeButton) {
        changeButton.disabled = isLoading;
        changeButton.textContent = isLoading ? 'Subiendo...' : 'Cambiar foto';
        changeButton.classList.toggle('opacity-70', isLoading);
        changeButton.classList.toggle('cursor-not-allowed', isLoading);
    }
}

async function handlePhotoUpload(file) {
    setPhotoUploadMessage(null);
    const validationError = validateImageFile(file);
    if (validationError) {
        setPhotoUploadMessage(validationError, 'error');
        return;
    }

    if (!currentUser || !currentUser.idUsuario) {
        setPhotoUploadMessage('No se encontró la sesión del usuario.', 'error');
        return;
    }

    setPhotoUploadLoading(true);
    setPhotoUploadMessage('Subiendo imagen...', 'info');

    const formData = new FormData();
    formData.append('imagen', file);
    formData.append('tipo', 'perfil');
    formData.append('id', currentUser.idUsuario);

    try {
        const response = await fetch(`${BLOB_API_BASE_URL}?action=upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || !result || result.status !== 200) {
            throw new Error(result && result.message ? result.message : 'No se pudo subir la imagen.');
        }

        currentUser.tieneFotoBlob = 1;
        currentUser.foto = null;

        renderUserInfo({ cacheBust: true });
        if (window.PWCI && window.PWCI.session) {
            window.PWCI.session.setUserData(currentUser, { cacheBust: true });
        }
        setPhotoUploadMessage('Foto de perfil actualizada correctamente.', 'success');
        setTimeout(() => setPhotoUploadMessage(null), 4000);
    } catch (error) {
        console.error('Error subiendo foto de perfil:', error);
        setPhotoUploadMessage(error.message || 'Error al subir la foto.', 'error');
    } finally {
        setPhotoUploadLoading(false);
    }
}

/**
 * Verificar autenticación
 */
function checkAuth() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken || !userData) {
        alert('⚠️ Debes iniciar sesión para ver tu perfil');
        window.location.href = '../pages/login.html';
        return false;
    }
    
    currentUser = userData;
    return true;
}

/**
 * Cargar datos del perfil
 */
async function loadProfile() {
    try {
        // Cargar información del usuario
        renderUserInfo();
        
        // Cargar publicaciones del usuario
        await loadUserPosts('todas');
        
        // Calcular estadísticas
        calculateStats();
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
        showError('No se pudo cargar el perfil');
    }
}

/**
 * Renderizar información del usuario
 */
function renderUserInfo(options = {}) {
    const { cacheBust = false } = options;
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileInitials = document.getElementById('profileInitials');
    const profilePhotoImg = document.getElementById('profilePhotoImg');
    const profilePhotoFallback = document.getElementById('profilePhotoFallback');
    const profilePhoto = document.getElementById('profilePhoto');
    const profileBirthdate = document.getElementById('profileBirthdate');
    const profileGender = document.getElementById('profileGender');
    const profileCountry = document.getElementById('profileCountry');
    const profileNationality = document.getElementById('profileNationality');
    
    if (profileName) profileName.textContent = currentUser.nombreCompleto || 'Usuario';
    if (profileEmail) profileEmail.textContent = currentUser.correoElectronico || '';
    if (profileBirthdate) profileBirthdate.textContent = formatBirthdate(currentUser.fechaNacimiento);
    if (profileGender) profileGender.textContent = formatOptional(currentUser.genero);
    if (profileCountry) profileCountry.textContent = formatOptional(currentUser.paisNacimiento);
    if (profileNationality) profileNationality.textContent = formatOptional(currentUser.nacionalidad);
    
    // Siempre mostrar iniciales (no tenemos foto de perfil implementada aún)
    const initials = getInitials(currentUser.nombreCompleto);
    if (profileInitials) {
        profileInitials.textContent = initials;
    }

    if (window.PWCI && window.PWCI.avatar && profilePhotoImg && profilePhotoFallback) {
        const avatarUrl = window.PWCI.avatar.getAvatarUrl({
            id: currentUser.idUsuario,
            foto: currentUser.foto,
            hasBlob: currentUser.tieneFotoBlob
        }, { cacheBust });
        window.PWCI.avatar.applyAvatar(profilePhotoImg, profilePhotoFallback, avatarUrl);
    } else if (profilePhoto) {
        profilePhoto.classList.add('bg-black');
    }
}

function populateProfileEditForm() {
    const nameInput = document.getElementById('editNombreCompleto');
    const birthInput = document.getElementById('editFechaNacimiento');
    const generoSelect = document.getElementById('editGenero');
    const countryInput = document.getElementById('editPaisNacimiento');
    const nationalityInput = document.getElementById('editNacionalidad');

    if (nameInput) nameInput.value = currentUser.nombreCompleto || '';
    if (birthInput) birthInput.value = currentUser.fechaNacimiento ? currentUser.fechaNacimiento.split('T')[0] : '';
    if (generoSelect) generoSelect.value = currentUser.genero || '';
    if (countryInput) countryInput.value = currentUser.paisNacimiento || '';
    if (nationalityInput) nationalityInput.value = currentUser.nacionalidad || '';
}

function toggleProfileEdit(forceState = null) {
    const section = document.getElementById('profileEditSection');
    if (!section) return;

    const nextState = forceState !== null ? forceState : !isEditingProfile;
    isEditingProfile = nextState;

    const messageBox = document.getElementById('editProfileMessage');
    if (messageBox) {
        messageBox.classList.add('hidden');
        messageBox.textContent = '';
        messageBox.classList.remove('text-red-600', 'text-green-600');
    }

    if (nextState) {
        populateProfileEditForm();
        section.classList.remove('hidden');
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        section.classList.add('hidden');
    }
}

function cancelProfileEdit() {
    toggleProfileEdit(false);
}

function setEditProfileLoading(isLoading) {
    const saveButton = document.getElementById('saveEditProfile');
    const cancelButton = document.getElementById('cancelEditProfile');
    if (saveButton) {
        saveButton.disabled = isLoading;
        saveButton.textContent = isLoading ? 'Guardando...' : 'Guardar cambios';
        saveButton.classList.toggle('opacity-70', isLoading);
        saveButton.classList.toggle('cursor-not-allowed', isLoading);
    }
    if (cancelButton) {
        cancelButton.disabled = isLoading;
        cancelButton.classList.toggle('opacity-70', isLoading);
        cancelButton.classList.toggle('cursor-not-allowed', isLoading);
    }
}

function setEditProfileMessage(message, type = 'error') {
    const messageBox = document.getElementById('editProfileMessage');
    if (!messageBox) return;
    messageBox.textContent = message;
    messageBox.classList.remove('hidden');
    messageBox.classList.remove('text-red-600', 'text-green-600', 'text-neutral-600');
    if (type === 'success') {
        messageBox.classList.add('text-green-600');
    } else if (type === 'info') {
        messageBox.classList.add('text-neutral-600');
    } else {
        messageBox.classList.add('text-red-600');
    }
}

function validateProfileForm(values) {
    if (!values.nombreCompleto || values.nombreCompleto.length < 3) {
        return 'El nombre completo debe tener al menos 3 caracteres';
    }

    if (!values.fechaNacimiento) {
        return 'Debes seleccionar tu fecha de nacimiento';
    }

    const birthDate = new Date(values.fechaNacimiento);
    if (Number.isNaN(birthDate.getTime())) {
        return 'La fecha de nacimiento no es valida';
    }

    const today = new Date();
    if (birthDate > today) {
        return 'La fecha de nacimiento no puede ser en el futuro';
    }

    const minAge = 12;
    const age = today.getFullYear() - birthDate.getFullYear() - ((today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) ? 1 : 0);
    if (age < minAge) {
        return 'Debes tener al menos 12 años';
    }

    return null;
}

async function handleProfileSave(event) {
    event.preventDefault();

    const form = event.target;
    const values = {
        nombreCompleto: form.nombreCompleto ? form.nombreCompleto.value.trim() : '',
        fechaNacimiento: form.fechaNacimiento ? form.fechaNacimiento.value : '',
        genero: form.genero ? form.genero.value.trim() : '',
        paisNacimiento: form.paisNacimiento ? form.paisNacimiento.value.trim() : '',
        nacionalidad: form.nacionalidad ? form.nacionalidad.value.trim() : ''
    };

    const validationError = validateProfileForm(values);
    if (validationError) {
        setEditProfileMessage(validationError, 'error');
        return;
    }

    const payload = {
        nombreCompleto: values.nombreCompleto,
        fechaNacimiento: values.fechaNacimiento,
        genero: values.genero || null,
        paisNacimiento: values.paisNacimiento || null,
        nacionalidad: values.nacionalidad || null
    };

    try {
        setEditProfileLoading(true);
        setEditProfileMessage('Guardando cambios...', 'info');

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            throw new Error('Sesion expirada');
        }

        const response = await fetch(`${API_BASE_URL}/usuarios/${currentUser.idUsuario}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = data && data.message ? data.message : 'No se pudo actualizar el perfil';
            throw new Error(message);
        }

        setEditProfileMessage('Perfil actualizado correctamente', 'success');
        showSuccess('Perfil actualizado correctamente');

        // Volver a cargar la informacion del usuario y publicaciones
        await loadUserPosts(currentFilter);
        calculateStats();

        toggleProfileEdit(false);
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        setEditProfileMessage(error.message || 'No se pudo actualizar el perfil', 'error');
    } finally {
        setEditProfileLoading(false);
    }
}

/**
 * Cargar publicaciones del usuario
 */
async function loadUserPosts(estado = 'todas') {
    try {
        const authToken = localStorage.getItem('authToken');
        const url = `${API_BASE_URL}/usuarios/${currentUser.idUsuario}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar datos del usuario');
        }
        
        const data = await response.json();
        
        if (data.data) {
            const userInfo = {
                nombreCompleto: data.data.nombreCompleto,
                correoElectronico: data.data.correoElectronico,
                fechaNacimiento: data.data.fechaNacimiento,
                genero: data.data.genero,
                paisNacimiento: data.data.paisNacimiento,
                nacionalidad: data.data.nacionalidad,
                foto: data.data.foto,
                tieneFotoBlob: data.data.tieneFotoBlob
            };
            currentUser = { ...currentUser, ...userInfo };
            if (window.PWCI && window.PWCI.session) {
                window.PWCI.session.setUserData(currentUser);
            }
            renderUserInfo();
        }
        
        // Guardar todas las publicaciones del usuario
        const allPosts = data.data.publicaciones || [];
        
        // Filtrar según el estado solicitado
        if (estado === 'todas') {
            userPosts = allPosts;
        } else {
            userPosts = allPosts.filter(p => p.estado === estado);
        }
        
        // Actualizar estadísticas desde el API
        if (data.data.estadisticas) {
            const stats = data.data.estadisticas;
            userStats.totalPosts = stats.totalPublicaciones || 0;
            userStats.aprobadas = stats.publicacionesAprobadas || 0;
            userStats.pendientes = stats.publicacionesPendientes || 0;
            userStats.rechazadas = stats.publicacionesRechazadas || 0;
            userStats.totalLikes = stats.totalLikes || 0;
            userStats.totalComentarios = stats.totalComentarios || 0;
            
            renderStats();
        }
        
        renderUserPosts();
        
    } catch (error) {
        console.error('Error:', error);
        showError('No se pudieron cargar las publicaciones');
    }
}

/**
 * Renderizar publicaciones del usuario
 */
function renderUserPosts() {
    const container = document.getElementById('postsContainer');
    
    if (!container) return;
    
    if (userPosts.length === 0) {
        container.innerHTML = `
            <div class="col-span-full bg-white rounded-xl shadow-md border border-neutral-200 p-12 text-center">
                <svg class="w-16 h-16 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p class="text-neutral-500 text-lg">No tienes publicaciones ${currentFilter === 'todas' ? '' : currentFilter === 'aprobada' ? 'aprobadas' : currentFilter === 'pendiente' ? 'pendientes' : 'rechazadas'}</p>
                <a href="../pages/createPost.html" class="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    Crear tu primera publicación
                </a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userPosts.map(post => `
        <div class="bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
            ${getPostImageHTML(post)}
            
            <div class="p-6 flex flex-col flex-grow">
                <div class="flex items-center justify-between mb-3">
                    <span class="px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(post.estado)}">
                        ${getStatusText(post.estado)}
                    </span>
                    <span class="text-xs text-neutral-500">${formatDate(post.fechaPublicacion)}</span>
                </div>
                
                <h3 class="text-lg font-bold text-neutral-900 mb-2 line-clamp-2">${post.titulo}</h3>
                <p class="text-neutral-600 text-sm mb-4 line-clamp-3">${post.contenido}</p>
                
                <div class="mt-auto">
                    <div class="flex items-center space-x-4 text-sm text-neutral-500 mb-3">
                        <span class="inline-flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                            </svg>
                            ${post.nombreCategoria || 'Sin categoría'}
                        </span>
                        <span>•</span>
                        <span>${post.totalLikes || 0} likes</span>
                        <span>•</span>
                        <span>${post.totalComentarios || 0} comentarios</span>
                    </div>
                    
                    <div class="flex gap-2">
                        <a href="../pages/postDetails.html?id=${post.idPublicacion}" 
                           class="flex-1 text-center bg-black hover:bg-neutral-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                            Ver Detalles
                        </a>
                        ${post.estado === 'pendiente' || post.estado === 'rechazada' ? `
                            <button onclick="editPost(${post.idPublicacion})" 
                                    class="bg-neutral-700 hover:bg-neutral-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                                Editar
                            </button>
                        ` : ''}
                        <button onclick="deletePost(${post.idPublicacion})" 
                                class="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Obtener HTML de imagen para tarjeta de post
 */
function getPostImageHTML(post) {
    // Si tiene BLOB, usar blob-api.php
    if (post.tieneBlob && post.tieneBlob == 1) {
        const imageUrl = `http://localhost/PWCI/PWCI-Backend/blob-api.php?action=download&tipo=publicacion&id=${post.idPublicacion}`;
        return `
            <div class="h-48 bg-neutral-100 overflow-hidden flex-shrink-0">
                <img src="${imageUrl}" alt="${post.titulo}" 
                     class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                     onerror="this.parentElement.innerHTML='<div class=\'h-full w-full bg-neutral-200 flex items-center justify-center\'><svg class=\'w-16 h-16 text-neutral-400\' fill=\'none\' stroke=\'currentColor\' viewBox=\'0 0 24 24\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\'></path></svg></div>'">
            </div>
        `;
    }
    // Si tiene URL, usar URL
    else if (post.urlMultimedia) {
        return `
            <div class="h-48 bg-neutral-100 overflow-hidden flex-shrink-0">
                <img src="${post.urlMultimedia}" alt="${post.titulo}" 
                     class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                     onerror="this.parentElement.innerHTML='<div class=\'h-full w-full bg-neutral-200 flex items-center justify-center\'><svg class=\'w-16 h-16 text-neutral-400\' fill=\'none\' stroke=\'currentColor\' viewBox=\'0 0 24 24\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\'></path></svg></div>'">
            </div>
        `;
    }
    // Sin imagen
    return `
        <div class="h-48 bg-neutral-200 flex items-center justify-center flex-shrink-0">
            <div class="text-center">
                <svg class="w-16 h-16 text-neutral-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p class="text-neutral-500 text-sm">Sin imagen</p>
            </div>
        </div>
    `;
}

/**
 * Calcular estadísticas del usuario
 * NOTA: Las estadísticas ya vienen del API en loadUserPosts
 */
function calculateStats() {
    // Las estadísticas ya están actualizadas desde el API
    // Solo renderizamos
    renderStats();
}

/**
 * Renderizar estadísticas
 */
function renderStats() {
    const statTotalPosts = document.getElementById('statTotalPosts');
    const statAprobadas = document.getElementById('statAprobadas');
    const statPendientes = document.getElementById('statPendientes');
    const statRechazadas = document.getElementById('statRechazadas');
    const statLikes = document.getElementById('statLikes');
    const statComentarios = document.getElementById('statComentarios');
    
    if (statTotalPosts) statTotalPosts.textContent = userStats.totalPosts;
    if (statAprobadas) statAprobadas.textContent = userStats.aprobadas;
    if (statPendientes) statPendientes.textContent = userStats.pendientes;
    if (statRechazadas) statRechazadas.textContent = userStats.rechazadas;
    if (statLikes) statLikes.textContent = userStats.totalLikes;
    if (statComentarios) statComentarios.textContent = userStats.totalComentarios;
    
    // Actualizar contadores en tabs
    const countTodas = document.getElementById('countTodas');
    const countAprobadas = document.getElementById('countAprobadas');
    const countPendientes = document.getElementById('countPendientes');
    const countRechazadas = document.getElementById('countRechazadas');
    
    if (countTodas) countTodas.textContent = userStats.totalPosts;
    if (countAprobadas) countAprobadas.textContent = userStats.aprobadas;
    if (countPendientes) countPendientes.textContent = userStats.pendientes;
    if (countRechazadas) countRechazadas.textContent = userStats.rechazadas;
}

/**
 * Cambiar filtro de publicaciones
 */
function changeFilter(estado) {
    currentFilter = estado;
    
    // Actualizar tabs activos con tema negro
    document.querySelectorAll('[data-filter]').forEach(tab => {
        if (tab.dataset.filter === estado) {
            tab.classList.remove('border-transparent', 'text-neutral-400');
            tab.classList.add('border-white', 'text-white');
        } else {
            tab.classList.remove('border-white', 'text-white');
            tab.classList.add('border-transparent', 'text-neutral-400');
        }
    });
    
    // Cargar publicaciones con nuevo filtro
    loadUserPosts(estado);
}

/**
 * Editar publicación
 */
function editPost(postId) {
    // Por ahora redirigir a la página de edición (que crearemos después)
    window.location.href = `../pages/createPost.html?edit=${postId}`;
}

/**
 * Eliminar publicación
 */
async function deletePost(postId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const authToken = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_BASE_URL}/publicaciones/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar publicación');
        }
        
        showSuccess('✓ Publicación eliminada exitosamente');
        
        // Recargar publicaciones
        await loadUserPosts(currentFilter);
        
        // Recalcular estadísticas
        calculateStats();
        
    } catch (error) {
        console.error('Error:', error);
        showError('No se pudo eliminar la publicación');
    }
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

function formatBirthdate(dateString) {
    if (!dateString) return 'Sin registro';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return 'Sin registro';
    }
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatOptional(value) {
    if (value === undefined || value === null || String(value).trim() === '') {
        return 'Sin registro';
    }
    return value;
}

function getStatusBadgeClass(estado) {
    switch (estado) {
        case 'pendiente':
            return 'bg-yellow-100 text-yellow-700';
        case 'aprobada':
            return 'bg-green-100 text-green-700';
        case 'rechazada':
            return 'bg-red-100 text-red-700';
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
    notification.className = 'fixed top-20 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
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
 * Inicialización
 */
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    if (!checkAuth()) return;
    
    initPhotoUploadControls();

    // Cargar perfil
    loadProfile();
    
    // Configurar event listeners para tabs
    document.querySelectorAll('[data-filter]').forEach(tab => {
        tab.addEventListener('click', () => {
            changeFilter(tab.dataset.filter);
        });
    });

    // Inicializar edición de perfil
    const editButton = document.getElementById('editProfileButton');
    const cancelButton = document.getElementById('cancelEditProfile');
    const editForm = document.getElementById('profileEditForm');

    if (editButton) {
        editButton.addEventListener('click', () => toggleProfileEdit());
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', cancelProfileEdit);
    }

    if (editForm) {
        editForm.addEventListener('submit', handleProfileSave);
    }
});
