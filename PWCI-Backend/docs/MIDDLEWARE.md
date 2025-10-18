# 🚀 Sistema de Middleware de Autenticación

## ✅ **Implementación Completa**

Se ha implementado un sistema completo de middleware de autenticación tanto en el **Backend (PHP)** como en el **Frontend (JavaScript)**.

---

## 🔒 **1. Middleware en el Backend**

### **Funciones Implementadas:**

#### **`requireAuth()` - Middleware Principal**
```php
// Valida que la petición tenga un token válido
$user = requireAuth();
// Retorna: array con datos del usuario autenticado
// Error: 401 si no hay token o es inválido
```

#### **`requireAdmin($user)` - Middleware de Autorización**
```php
// Valida que el usuario sea administrador
requireAdmin($user);
// Error: 403 si el usuario no es admin
```

#### **`validateToken($token)` - Validador de Tokens**
```php
// Valida token y retorna información del usuario
$user = validateToken($token);
// Retorna: array con datos del usuario o false
```

#### **`generateAuthToken($userId)` - Generador de Tokens**
```php
// Genera un token único para el usuario
$token = generateAuthToken($userId);
// Formato actual: hash_userId (mejorar con JWT en producción)
```

---

### **Endpoints que Usan Middleware:**

#### **Totalmente Protegidos (requieren autenticación):**
```php
GET  /usuarios           → requireAuth() + requireAdmin()
GET  /usuarios/{id}      → requireAuth()
POST /usuarios           → requireAuth() + requireAdmin()
```

#### **Parcialmente Protegidos:**
```php
GET  /publicaciones      → Público (sin auth)
GET  /publicaciones/{id} → Público (sin auth)
POST /publicaciones      → requireAuth() (crear requiere auth)

GET  /comentarios/{postId} → Público
POST /comentarios          → requireAuth() (comentar requiere auth)
```

#### **Públicos (sin autenticación):**
```php
POST /auth/login         → Público
POST /auth/register      → Público
GET  /mundiales          → Público
GET  /categorias         → Público
GET  /status             → Público
```

---

### **Uso del Middleware en Endpoints:**

**Ejemplo 1: Endpoint totalmente protegido**
```php
function handleUsuarios($method, $request, $input) {
    // MIDDLEWARE: Requiere autenticación
    $currentUser = requireAuth();
    
    // Solo admins pueden ver todos los usuarios
    requireAdmin($currentUser);
    
    // Continuar con la lógica...
}
```

**Ejemplo 2: Endpoint parcialmente protegido**
```php
function handlePublicaciones($method, $request, $input) {
    $currentUser = null;
    
    // Solo POST requiere autenticación
    if ($method === 'POST') {
        $currentUser = requireAuth();
    }
    
    // GET es público, POST usa $currentUser
}
```

---

## 🌐 **2. Interceptor en el Frontend**

### **APIClient - Cliente con Middleware**

#### **Características:**
- ✅ Agrega automáticamente el token a TODAS las peticiones
- ✅ Maneja errores automáticamente (401, 403, 404, 5xx)
- ✅ Cierra sesión automática si el token es inválido
- ✅ Convierte respuestas JSON automáticamente
- ✅ Proporciona métodos helper para endpoints comunes

---

### **Uso del Cliente API:**

#### **Cargar el script:**
```html
<script src="../controllers/api-client.js"></script>
```

#### **Ejemplo 1: Login (sin token)**
```javascript
try {
    const response = await AuthAPI.login('juan@test.com', 'password123');
    console.log('Login exitoso:', response.data.user);
    // Token guardado automáticamente
    window.location.href = 'feed.html';
} catch (error) {
    console.error('Error:', error.message);
    alert(error.message);
}
```

#### **Ejemplo 2: Crear Publicación (con token automático)**
```javascript
try {
    const post = await PostAPI.create({
        titulo: 'Mi primera publicación',
        contenido: 'Contenido del post...',
        idMundial: 1,
        idCategoria: 1
    });
    console.log('Publicación creada:', post);
} catch (error) {
    if (error.status === 401) {
        // Token inválido, ya cerró sesión automáticamente
        alert('Sesión expirada. Redirigiendo...');
    } else {
        alert(error.message);
    }
}
```

#### **Ejemplo 3: Obtener Usuarios (requiere admin)**
```javascript
try {
    const users = await UserAPI.getAll();
    console.log('Usuarios:', users.data);
} catch (error) {
    if (error.status === 403) {
        alert('No tienes permisos de administrador');
    }
}
```

#### **Ejemplo 4: Crear Comentario**
```javascript
try {
    const comment = await CommentAPI.create({
        idPublicacion: 1,
        contenido: 'Gran post!'
    });
    console.log('Comentario creado:', comment);
} catch (error) {
    console.error('Error:', error);
}
```

---

### **API Helpers Disponibles:**

```javascript
// Autenticación
AuthAPI.login(email, password)
AuthAPI.register(userData)
AuthAPI.logout()

// Usuarios (requiere auth)
UserAPI.getAll()          // Solo admin
UserAPI.getById(id)       // Cualquier usuario autenticado

// Publicaciones
PostAPI.getAll()          // Público
PostAPI.getById(id)       // Público
PostAPI.create(data)      // Requiere auth

// Comentarios
CommentAPI.getByPost(postId)  // Público
CommentAPI.create(data)       // Requiere auth

// Mundiales (público)
WorldCupAPI.getAll()

// Categorías (público)
CategoryAPI.getAll()
```

---

### **Uso Avanzado - Cliente Directo:**

```javascript
// Petición GET personalizada
const response = await api.get('/mi-endpoint');

// Petición POST personalizada
const response = await api.post('/mi-endpoint', {
    campo1: 'valor1',
    campo2: 'valor2'
});

// Petición con headers personalizados
const response = await api.fetch('/mi-endpoint', {
    method: 'POST',
    headers: {
        'X-Custom-Header': 'valor'
    },
    body: JSON.stringify(data)
});
```

---

## 🔄 **Flujo Completo con Middleware:**

### **Escenario: Crear una Publicación**

```
1. Frontend (JavaScript):
   PostAPI.create(data)
   ↓
2. Interceptor (api-client.js):
   - Lee token de localStorage
   - Agrega header: Authorization: Bearer TOKEN
   - Envía petición POST
   ↓
3. Backend (api.php):
   - Recibe petición en /publicaciones
   - Ejecuta requireAuth()
   ↓
4. Middleware (requireAuth):
   - Lee header Authorization
   - Extrae token
   - Valida token con validateToken()
   - Obtiene usuario de la BD
   - Retorna usuario o error 401
   ↓
5. Endpoint:
   - Usa $currentUser['idUsuario']
   - Crea publicación
   - Retorna respuesta
   ↓
6. Interceptor (handleResponse):
   - Verifica status code
   - Si 401: cierra sesión automáticamente
   - Si OK: parsea JSON y retorna
   ↓
7. Frontend:
   - Recibe respuesta
   - Muestra resultado
```

---

## 📋 **Ventajas del Sistema de Middleware:**

### **Backend:**
✅ **Centralizado**: Una función valida todos los tokens  
✅ **Reutilizable**: Se usa en múltiples endpoints  
✅ **Seguro**: Valida automáticamente cada petición  
✅ **Mantenible**: Cambios en un solo lugar  
✅ **Escalable**: Fácil agregar más validaciones  

### **Frontend:**
✅ **Automático**: No necesitas agregar tokens manualmente  
✅ **Consistente**: Todas las peticiones usan el mismo formato  
✅ **Manejo de errores**: Cierra sesión automática si token inválido  
✅ **Clean Code**: API helpers simplifican el código  
✅ **Type-Safe**: Estructura clara y predecible  

---

## 🧪 **Cómo Probar:**

### **1. Crear Cuenta:**
```javascript
await AuthAPI.register({
    nombreCompleto: 'Juan Pérez',
    correoElectronico: 'juan@test.com',
    contrasena: 'test123',
    fechaNacimiento: '2000-01-01'
});
// Token guardado automáticamente
```

### **2. Crear Publicación (ya autenticado):**
```javascript
await PostAPI.create({
    titulo: 'Test Post',
    contenido: 'Contenido de prueba',
    idMundial: 1,
    idCategoria: 1
});
// Token enviado automáticamente por el interceptor
```

### **3. Ver Publicaciones (sin auth):**
```javascript
const posts = await PostAPI.getAll();
console.log(posts);
// No requiere token
```

### **4. Comentar (requiere auth):**
```javascript
await CommentAPI.create({
    idPublicacion: 1,
    contenido: 'Gran post!'
});
// Token enviado automáticamente
```

---

## 🔐 **Seguridad:**

### **Backend:**
- ✅ Token validado en cada petición protegida
- ✅ Usuario verificado contra la base de datos
- ✅ Roles verificados (admin/usuario)
- ⚠️ **PENDIENTE**: Implementar JWT con expiración y firma

### **Frontend:**
- ✅ Token almacenado en localStorage
- ✅ Token agregado automáticamente a peticiones
- ✅ Sesión cerrada automática si token inválido
- ⚠️ **PENDIENTE**: Implementar refresh tokens

---

## 📝 **Próximas Mejoras:**

1. **JWT (JSON Web Tokens)** en lugar de tokens simples
2. **Refresh Tokens** para renovar sesiones automáticamente
3. **Token Expiration** con validación de tiempo
4. **Rate Limiting** para prevenir abuso
5. **CORS** configurado correctamente para producción
6. **HTTPS** obligatorio en producción

---

## ✅ **Resumen:**

**Middleware Backend:**
- ✅ `requireAuth()` - Valida tokens automáticamente
- ✅ `requireAdmin()` - Valida rol de administrador
- ✅ `validateToken()` - Verifica token contra BD
- ✅ `generateAuthToken()` - Genera tokens únicos

**Interceptor Frontend:**
- ✅ `APIClient` - Agrega tokens automáticamente
- ✅ `AuthAPI, PostAPI, CommentAPI, etc.` - Helpers para endpoints
- ✅ Manejo automático de errores y cierre de sesión
- ✅ Clean API para desarrollo rápido

---

**¡Sistema de Middleware Completo e Implementado!** 🎉
