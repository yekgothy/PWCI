/**
 * Utilidades para manejo de imágenes con BLOB
 * Funciones helper para subir y obtener imágenes del sistema BLOB
 */

const IMAGEN_API_URL = 'http://localhost/PWCI/PWCI-Backend/imagen-api.php';

/**
 * Subir foto de perfil de usuario
 * @param {number} userId - ID del usuario
 * @param {File} file - Archivo de imagen
 * @returns {Promise<Object>} Respuesta del servidor
 */
async function uploadUserPhoto(userId, file) {
    try {
        const authToken = localStorage.getItem('authToken');
        const formData = new FormData();
        formData.append('foto', file);

        const response = await fetch(`${IMAGEN_API_URL}/usuario/${userId}/foto`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Error al subir la foto');
        }

        return await response.json();
    } catch (error) {
        console.error('Error uploading photo:', error);
        throw error;
    }
}

/**
 * Subir multimedia para una publicación existente
 * @param {number} publicacionId - ID de la publicación
 * @param {File} file - Archivo de imagen
 * @returns {Promise<Object>} Respuesta del servidor
 */
async function uploadPublicacionMedia(publicacionId, file) {
    try {
        const authToken = localStorage.getItem('authToken');
        const formData = new FormData();
        formData.append('multimedia', file);

        const response = await fetch(`${IMAGEN_API_URL}/publicacion/${publicacionId}/multimedia`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Error al subir la multimedia');
        }

        return await response.json();
    } catch (error) {
        console.error('Error uploading media:', error);
        throw error;
    }
}

/**
 * Obtener URL de foto de usuario
 * @param {number} userId - ID del usuario
 * @returns {string} URL de la imagen
 */
function getUserPhotoUrl(userId) {
    return `${IMAGEN_API_URL}/usuario/${userId}/foto`;
}

/**
 * Obtener URL de multimedia de publicación
 * @param {number} publicacionId - ID de la publicación
 * @returns {string} URL de la imagen
 */
function getPublicacionMediaUrl(publicacionId) {
    return `${IMAGEN_API_URL}/publicacion/${publicacionId}/multimedia`;
}

/**
 * Crear publicación con imagen BLOB
 * Ejemplo de uso completo: primero crear la publicación, luego subir la imagen
 */
async function crearPublicacionConImagen(postData, imageFile) {
    try {
        const API_BASE_URL = 'http://localhost/PWCI/PWCI-Backend/api.php';
        const authToken = localStorage.getItem('authToken');

        // 1. Crear la publicación sin imagen
        const response = await fetch(`${API_BASE_URL}/publicaciones`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });

        if (!response.ok) {
            throw new Error('Error al crear publicación');
        }

        const result = await response.json();
        const publicacionId = result.data.idPublicacion;

        // 2. Si hay imagen, subirla
        if (imageFile) {
            await uploadPublicacionMedia(publicacionId, imageFile);
        }

        return result;

    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Actualizar foto de perfil
 * Ejemplo de uso en página de perfil
 */
async function actualizarFotoPerfil(imageFile) {
    try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const userId = userData.idUsuario;

        if (!userId) {
            throw new Error('Usuario no autenticado');
        }

        const result = await uploadUserPhoto(userId, imageFile);
        
        console.log('Foto actualizada:', result);
        
        // Actualizar la imagen en la página
        const imgElements = document.querySelectorAll('.user-photo');
        imgElements.forEach(img => {
            img.src = getUserPhotoUrl(userId) + '?t=' + Date.now(); // Cache bust
        });

        return result;

    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

/**
 * Previsualizar imagen antes de subirla
 * @param {File} file - Archivo de imagen
 * @param {HTMLImageElement} imgElement - Elemento img donde mostrar la preview
 */
function previewImage(file, imgElement) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imgElement.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Validar archivo de imagen
 * @param {File} file - Archivo a validar
 * @param {number} maxSizeMB - Tamaño máximo en MB
 * @returns {Object} { valid: boolean, error: string }
 */
function validateImageFile(file, maxSizeMB = 5) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!file) {
        return { valid: false, error: 'No se seleccionó ningún archivo' };
    }

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Tipo de archivo no permitido. Use JPG, PNG, GIF o WEBP' };
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
        return { valid: false, error: `El archivo es demasiado grande. Máximo ${maxSizeMB}MB` };
    }

    return { valid: true, error: null };
}

// Exportar funciones para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        uploadUserPhoto,
        uploadPublicacionMedia,
        getUserPhotoUrl,
        getPublicacionMediaUrl,
        crearPublicacionConImagen,
        actualizarFotoPerfil,
        previewImage,
        validateImageFile
    };
}
