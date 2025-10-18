// Cliente API con Interceptor de Autenticación
const API_BASE_URL = 'http://localhost/PWCI/PWCI-Backend/api.php';

class APIClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    getToken() {
        return localStorage.getItem('authToken');
    }

    hasToken() {
        return this.getToken() !== null;
    }

    // MIDDLEWARE: Interceptor automático de peticiones
    async fetch(endpoint, options = {}) {
        const token = this.getToken();
        
        // Configurar headers por defecto
        const defaultHeaders = {
            'Content-Type': 'application/json'
        };
        
        // Agregar token si está disponible
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }
        
        // Merge options
        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };
        
        // Construir URL completa
        const url = endpoint.startsWith('http') 
            ? endpoint 
            : `${this.baseURL}${endpoint}`;
        
        try {
            console.log(`[API] ${config.method || 'GET'} ${endpoint}`, config);
            
            const response = await fetch(url, config);
            
            // MIDDLEWARE: Manejo automático de respuestas
            return await this.handleResponse(response);
            
        } catch (error) {
            console.error('[API] Error en petición:', error);
            throw error;
        }
    }

    // MIDDLEWARE: Manejador automático de respuestas
    async handleResponse(response) {
        if (response.status === 401) {
            this.logout();
            throw new APIError('Sesión expirada', 401);
        }
        
        if (response.status === 403) {
            throw new APIError('No tienes permisos', 403);
        }
        
        if (response.status === 404) {
            throw new APIError('Recurso no encontrado', 404);
        }
        
        if (response.status >= 500) {
            throw new APIError('Error del servidor', response.status);
        }
        
        let data;
        try {
            data = await response.json();
        } catch (error) {
            throw new APIError('Error al procesar respuesta', 500);
        }
        
        if (!response.ok) {
            throw new APIError(data.message || 'Error en la petición', response.status, data);
        }
        
        return data;
    }

    logout() {
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        localStorage.removeItem('loginTime');
        
        // Redirigir según la ubicación actual
        const currentPath = window.location.pathname;
        if (!currentPath.includes('login.html')) {
            window.location.href = '../pages/login.html';
        }
    }

    async get(endpoint) {
        return this.fetch(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.fetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.fetch(endpoint, { method: 'DELETE' });
    }
}

/**
 * Clase de error personalizada para la API
 */
class APIError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

const api = new APIClient();

// ===== API HELPERS =====

const AuthAPI = {
    async login(email, password) {
        const response = await api.post('/auth/login', {
            correoElectronico: email,
            contrasena: password
        });
        
        if (response.data) {
            localStorage.setItem('userData', JSON.stringify(response.data.user));
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('loginTime', new Date().toISOString());
        }
        
        return response;
    },

    async register(userData) {
        const response = await api.post('/auth/register', userData);
        
        if (response.data) {
            const user = {
                idUsuario: response.data.idUsuario,
                nombreCompleto: response.data.nombreCompleto,
                correoElectronico: response.data.correoElectronico,
                rol: response.data.rol
            };
            localStorage.setItem('userData', JSON.stringify(user));
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('loginTime', new Date().toISOString());
        }
        
        return response;
    },

    logout() {
        api.logout();
    }
};

const UserAPI = {
    async getAll() {
        return await api.get('/usuarios');
    },

    async getById(id) {
        return await api.get(`/usuarios/${id}`);
    }
};

const PostAPI = {
    async getAll() {
        return await api.get('/publicaciones');
    },

    async getById(id) {
        return await api.get(`/publicaciones/${id}`);
    },

    async create(postData) {
        return await api.post('/publicaciones', postData);
    }
};

const CommentAPI = {
    async getByPost(postId) {
        return await api.get(`/comentarios/${postId}`);
    },

    async create(commentData) {
        return await api.post('/comentarios', commentData);
    }
};

const WorldCupAPI = {
    async getAll() {
        return await api.get('/mundiales');
    }
};

const CategoryAPI = {
    async getAll() {
        return await api.get('/categorias');
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        api,
        APIClient,
        APIError,
        AuthAPI,
        UserAPI,
        PostAPI,
        CommentAPI,
        WorldCupAPI,
        CategoryAPI
    };
}
