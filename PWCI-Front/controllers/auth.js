// Utilidades de autenticación y sesiones
const API_URL = 'http://localhost/PWCI/PWCI-Backend/api.php';

function getUserData() {
    try {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error al obtener datos:', error);
        return null;
    }
}

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function isAuthenticated() {
    const userData = getUserData();
    const token = getAuthToken();
    return userData !== null && token !== null;
}

function hasRole(rol) {
    const userData = getUserData();
    return userData && userData.rol === rol;
}

function isAdmin() {
    return hasRole('admin');
}

function saveSession(userData, token) {
    try {
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('authToken', token);
        localStorage.setItem('loginTime', new Date().toISOString());
    } catch (error) {
        console.error('Error al guardar sesión:', error);
    }
}

function logout(redirect = true) {
    try {
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        localStorage.removeItem('loginTime');
        
        if (redirect) {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

function isSessionExpired() {
    try {
        const loginTime = localStorage.getItem('loginTime');
        if (!loginTime) return true;
        
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
        
        // Sesión expira después de 24 horas
        return hoursDiff > 24;
    } catch (error) {
        console.error('Error al verificar expiración de sesión:', error);
        return true;
    }
}

/**
 * Proteger una página - requiere autenticación
 * Redirige al login si no hay sesión válida
 * @param {boolean} requireAdmin - Si requiere rol de administrador (default: false)
 */
function protectPage(requireAdmin = false) {
    if (!isAuthenticated() || isSessionExpired()) {
        logout(true);
        return;
    }
    
    if (requireAdmin && !isAdmin()) {
        alert('No tienes permisos para acceder a esta página');
        window.location.href = 'feed.html';
    }
}

/**
 * Actualizar datos del usuario en localStorage
 * @param {Object} newData - Nuevos datos del usuario (se mezclan con los existentes)
 */
function updateUserData(newData) {
    try {
        const currentData = getUserData();
        if (currentData) {
            const updatedData = { ...currentData, ...newData };
            localStorage.setItem('userData', JSON.stringify(updatedData));
        }
    } catch (error) {
        console.error('Error al actualizar datos del usuario:', error);
    }
}

function getUserName() {
    const userData = getUserData();
    return userData ? userData.nombreCompleto : 'Usuario';
}

function getUserId() {
    const userData = getUserData();
    return userData ? userData.idUsuario : null;
}

function getUserEmail() {
    const userData = getUserData();
    return userData ? userData.correoElectronico : null;
}

function getUserPhoto() {
    const userData = getUserData();
    return userData && userData.foto ? userData.foto : '../public/default-avatar.png';
}

async function authenticatedFetch(endpoint, options = {}) {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('No hay token de autenticación');
    }
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    
    try {
        const response = await fetch(url, mergedOptions);
        
        // Si es 401, la sesión no es válida
        if (response.status === 401) {
            logout(true);
            throw new Error('Sesión inválida');
        }
        
        return response;
    } catch (error) {
        console.error('Error en petición autenticada:', error);
        throw error;
    }
}

function initUserNavbar() {
    const userName = getUserName();
    const userPhoto = getUserPhoto();
    
    const userNameElement = document.getElementById('navUserName');
    const userPhotoElement = document.getElementById('navUserPhoto');
    const logoutButton = document.getElementById('logoutButton');
    
    if (userNameElement) {
        userNameElement.textContent = userName;
    }
    
    if (userPhotoElement) {
        userPhotoElement.src = userPhoto;
        userPhotoElement.alt = userName;
    }
    
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                logout(true);
            }
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getUserData,
        getAuthToken,
        isAuthenticated,
        hasRole,
        isAdmin,
        saveSession,
        logout,
        isSessionExpired,
        protectPage,
        updateUserData,
        getUserName,
        getUserId,
        getUserEmail,
        getUserPhoto,
        authenticatedFetch,
        initUserNavbar
    };
}
