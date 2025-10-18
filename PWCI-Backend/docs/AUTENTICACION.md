# Sistema de Autenticación - World Cup Hub

## 📋 Descripción

Sistema completo de **Inicio de Sesión** y **Registro de Usuarios** para la plataforma World Cup Hub. Incluye validaciones, gestión de sesiones y protección de páginas.

---

## 🚀 Características Implementadas

### Backend (PWCI-Backend)

#### ✅ Endpoints de API

1. **POST `/api.php/auth/login`**
   - Inicio de sesión de usuarios
   - Validación de credenciales
   - Verificación de contraseña con hash
   - Generación de token de sesión

2. **POST `/api.php/auth/register`**
   - Registro de nuevos usuarios
   - Validación de datos (email, contraseña, etc.)
   - Hash seguro de contraseñas con `password_hash()`
   - Verificación de correos duplicados
   - Creación automática de estadísticas de usuario

3. **POST `/api.php/auth/verify`**
   - Verificación de token de sesión

#### 🔐 Seguridad

- ✅ Contraseñas hasheadas con `PASSWORD_DEFAULT`
- ✅ Validación de formato de email
- ✅ Protección contra SQL Injection (PDO prepared statements)
- ✅ CORS habilitado para desarrollo
- ✅ Validación de datos de entrada

---

### Frontend (PWCI-Front)

#### 📄 Páginas Actualizadas

1. **`pages/login.html`**
   - Formulario funcional de inicio de sesión
   - Validación en tiempo real
   - Mensajes de error/éxito
   - Toggle para mostrar/ocultar contraseña
   - Redirección automática al feed

2. **`pages/signup.html`**
   - Formulario completo de registro
   - Campos: nombre, apellido, email, contraseña, fecha de nacimiento
   - Validación de edad (mínimo 13 años)
   - Validación de fortaleza de contraseña
   - Checkbox de términos y condiciones
   - Redirección automática al feed

#### 🎮 Controladores JavaScript

1. **`controllers/login.js`**
   - Manejo del formulario de login
   - Validación de campos
   - Peticiones AJAX al backend
   - Gestión de tokens y localStorage
   - Verificación de sesiones existentes

2. **`controllers/signup.js`**
   - Manejo del formulario de registro
   - Validaciones robustas (email, contraseña, edad)
   - Peticiones AJAX al backend
   - Creación de sesión automática
   - Gestión de errores

3. **`controllers/auth.js`** ⭐
   - Utilidades de autenticación
   - Funciones para verificar sesión
   - Protección de páginas
   - Funciones de logout
   - Helpers para obtener datos del usuario
   - Peticiones autenticadas a la API

---

## 📝 Uso del Sistema

### Para Registrarse

1. Ir a `pages/signup.html`
2. Llenar el formulario:
   - Nombre (requerido)
   - Apellido (opcional)
   - Email (requerido, formato válido)
   - Contraseña (mínimo 6 caracteres, debe contener letra y número)
   - Fecha de nacimiento (opcional, debe ser mayor de 13 años)
   - Aceptar términos y condiciones
3. Click en "Create account"
4. Redirección automática al feed con sesión iniciada

### Para Iniciar Sesión

1. Ir a `pages/login.html`
2. Ingresar:
   - Email registrado
   - Contraseña
3. Click en "Sign in"
4. Redirección automática al feed con sesión iniciada

### Datos de Sesión Almacenados

El sistema guarda en `localStorage`:
- `userData`: Datos del usuario (sin contraseña)
- `authToken`: Token de autenticación
- `loginTime`: Timestamp del inicio de sesión

---

## 🔧 Proteger Páginas

Para proteger páginas que requieren autenticación, agregar al inicio del archivo HTML:

```html
<!-- Incluir auth.js -->
<script src="../controllers/auth.js"></script>

<script>
  // Proteger página - requiere login
  protectPage();
  
  // O proteger solo para admins
  // protectPage(true);
</script>
```

### Ejemplo de uso en una página protegida:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Mi Feed</title>
  <script src="../controllers/auth.js"></script>
</head>
<body>
  <script>
    // Proteger esta página
    protectPage();
    
    // Mostrar datos del usuario
    document.addEventListener('DOMContentLoaded', function() {
      const userName = getUserName();
      const userId = getUserId();
      
      console.log('Usuario:', userName, 'ID:', userId);
      
      // Inicializar navbar con info del usuario
      initUserNavbar();
    });
  </script>
  
  <!-- Contenido de la página -->
  <div>
    <h1>Bienvenido, <span id="navUserName"></span></h1>
    <img id="navUserPhoto" src="" alt="Foto de perfil">
    <button id="logoutButton">Cerrar Sesión</button>
  </div>
</body>
</html>
```

---

## 🛠️ Funciones Disponibles (auth.js)

### Información del Usuario

```javascript
getUserData()          // Obtener todos los datos del usuario
getUserId()            // Obtener ID del usuario
getUserName()          // Obtener nombre completo
getUserEmail()         // Obtener email
getUserPhoto()         // Obtener URL de foto de perfil
getAuthToken()         // Obtener token de autenticación
```

### Verificaciones

```javascript
isAuthenticated()      // Verificar si hay sesión activa
isAdmin()              // Verificar si el usuario es admin
hasRole('admin')       // Verificar rol específico
isSessionExpired()     // Verificar si la sesión expiró (24h)
```

### Gestión de Sesión

```javascript
saveSession(userData, token)  // Guardar sesión
logout()                      // Cerrar sesión y redirigir
logout(false)                 // Cerrar sesión sin redirigir
updateUserData(newData)       // Actualizar datos en localStorage
```

### Protección y Peticiones

```javascript
protectPage()                 // Proteger página (requiere login)
protectPage(true)             // Proteger página (requiere admin)

// Hacer petición autenticada
authenticatedFetch('/usuarios/123', {
  method: 'GET'
}).then(response => response.json())
  .then(data => console.log(data));
```

---

## 📊 Estructura de Datos

### Usuario en localStorage

```json
{
  "idUsuario": 1,
  "nombreCompleto": "Juan Pérez",
  "correoElectronico": "juan@example.com",
  "genero": "M",
  "paisNacimiento": "México",
  "nacionalidad": "Mexicana",
  "foto": "url/foto.jpg",
  "rol": "usuario",
  "fechaRegistro": "2025-10-18 10:30:00",
  "activo": true
}
```

### Respuesta de Login/Register

```json
{
  "status": 200,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": { /* datos del usuario */ },
    "token": "abc123def456..."
  }
}
```

---

## ⚠️ Validaciones Implementadas

### Login
- ✅ Email no vacío
- ✅ Formato de email válido
- ✅ Contraseña no vacía
- ✅ Contraseña mínimo 6 caracteres
- ✅ Usuario debe estar activo

### Registro
- ✅ Nombre completo mínimo 3 caracteres
- ✅ Email único (no duplicado)
- ✅ Formato de email válido
- ✅ Contraseña mínimo 6 caracteres
- ✅ Contraseña debe contener letra y número
- ✅ Fecha de nacimiento válida (mayor de 13 años)
- ✅ Aceptar términos y condiciones

---

## 🔄 Flujo de Autenticación

```
1. Usuario llena formulario
   ↓
2. JavaScript valida datos en cliente
   ↓
3. Se envía petición POST a /auth/login o /auth/register
   ↓
4. Backend valida datos
   ↓
5. Backend verifica en base de datos
   ↓
6. Backend genera token
   ↓
7. Backend envía respuesta con usuario y token
   ↓
8. Frontend guarda en localStorage
   ↓
9. Redirección automática al feed
```

---

## 🐛 Manejo de Errores

### Mensajes de Error Comunes

| Error | Significado |
|-------|------------|
| "Credenciales incorrectas" | Email o contraseña incorrectos |
| "El correo electrónico ya está registrado" | El email ya existe en la BD |
| "Usuario desactivado" | La cuenta fue desactivada por admin |
| "Error de conexión" | No se puede conectar con el backend |
| "Formato de correo electrónico inválido" | Email mal formado |
| "La contraseña debe tener al menos 6 caracteres" | Contraseña muy corta |

---

## 📁 Archivos Modificados/Creados

### Backend
- ✅ `PWCI-Backend/config/database.php` - Corregida contraseña de BD
- ✅ `PWCI-Backend/api.php` - Agregados endpoints de autenticación

### Frontend
- ✅ `PWCI-Front/pages/login.html` - Actualizado con formulario funcional
- ✅ `PWCI-Front/pages/signup.html` - Actualizado con formulario funcional
- ✅ `PWCI-Front/controllers/login.js` - NUEVO
- ✅ `PWCI-Front/controllers/signup.js` - NUEVO
- ✅ `PWCI-Front/controllers/auth.js` - NUEVO

---

## 🧪 Cómo Probar

### 1. Asegurarse de que XAMPP esté corriendo
```
- Apache ✓
- MySQL ✓
```

### 2. Verificar la base de datos
- Base de datos: `BDM`
- Usuario: `root`
- Contraseña: `` (vacía)

### 3. Abrir en el navegador
```
http://localhost/PWCI/PWCI-Front/pages/signup.html
http://localhost/PWCI/PWCI-Front/pages/login.html
```

### 4. Registrar un usuario de prueba
- Nombre: Juan Pérez
- Email: juan@test.com
- Contraseña: test123
- Fecha: 2000-01-01

### 5. Iniciar sesión con ese usuario

---

## 🔐 Seguridad Adicional Recomendada (Para Producción)

- [ ] Implementar JWT (JSON Web Tokens) en lugar de tokens simples
- [ ] Agregar límite de intentos de login (rate limiting)
- [ ] Implementar verificación de email
- [ ] Agregar recuperación de contraseña
- [ ] Usar HTTPS en producción
- [ ] Implementar refresh tokens
- [ ] Agregar autenticación de dos factores (2FA)
- [ ] Implementar CSRF tokens

---

## 📞 Soporte

Si encuentras algún problema, revisa:

1. ✅ Que XAMPP esté corriendo
2. ✅ Que la base de datos `BDM` exista
3. ✅ Que la contraseña en `database.php` sea vacía
4. ✅ Que la consola del navegador no tenga errores
5. ✅ Que las rutas de los archivos JS sean correctas

---

## ✨ Características Futuras

- [ ] Recuperación de contraseña por email
- [ ] Edición de perfil de usuario
- [ ] Cambio de contraseña
- [ ] Verificación de email
- [ ] Login con Google/Facebook
- [ ] Recordar sesión ("Remember me")

---

**Desarrollado para World Cup Hub - 2025**
