# Documentación de Arquitectura MVC + POO
## PWCI - Plataforma Web Copa del Mundo

---

## 📋 Cumplimiento de Requisitos Académicos

### ✅ Programación Orientada a Objetos (POO)
Se implementaron las siguientes clases:

1. **Database.php** - Clase Singleton para gestión de conexión a BD
2. **Usuario.php** - Modelo que representa la entidad Usuario
3. **Publicacion.php** - Modelo que representa la entidad Publicación
4. **Comentario.php** - Modelo que representa la entidad Comentario
5. **Categoria.php** - Modelo que representa la entidad Categoría
6. **Mundial.php** - Modelo que representa la entidad Mundial
7. **Interaccion.php** - Modelo que representa likes y dislikes
8. **BaseController.php** - Controlador base con métodos comunes
9. **AuthController.php** - Controlador de autenticación

### ✅ Arquitectura MVC (Modelo-Vista-Controlador)

#### Modelos (models/)
Clases que interactúan con la base de datos usando **ÚNICAMENTE Stored Procedures**:
- `Database.php` - Gestión de conexión y ejecución de SPs
- `Usuario.php` - Operaciones de usuarios
- `Publicacion.php` - Operaciones de publicaciones
- `Comentario.php` - Operaciones de comentarios
- `Categoria.php` - Operaciones de categorías
- `Mundial.php` - Operaciones de mundiales
- `Interaccion.php` - Operaciones de likes/dislikes

#### Vistas (PWCI-Front/)
Interfaz de usuario en HTML/CSS/JavaScript:
- `pages/` - Páginas HTML
- `components/` - Componentes reutilizables
- `controllers/` - JavaScript que consume el API

#### Controladores (controllers/)
Clases que reciben peticiones HTTP y coordinan Modelos y Vistas:
- `BaseController.php` - Funcionalidad común
- `AuthController.php` - Autenticación (login/register)

---

## 🏗️ Estructura de Archivos

```
PWCI-Backend/
│
├── api.php                 # Punto de entrada del API
├── api_old_backup.php      # Backup del API anterior
│
├── models/                 # MODELOS (capa de datos)
│   ├── Database.php        # Gestión de conexión BD
│   ├── Usuario.php
│   ├── Publicacion.php
│   ├── Comentario.php
│   ├── Categoria.php
│   ├── Mundial.php
│   └── Interaccion.php
│
├── controllers/            # CONTROLADORES (lógica de negocio)
│   ├── BaseController.php
│   └── AuthController.php
│
├── config/
│   └── database.php        # (Deprecado, ahora usa Database.php)
│
└── sql/                    # Stored Procedures
    ├── database.sql
    ├── stored_procedures_CORREGIDOS.sql
    └── ...
```

---

## 🔧 Cómo Funciona

### 1. Clase Database (Singleton Pattern)

```php
// Obtener instancia única
$db = Database::getInstance();

// Ejecutar SP que devuelve datos (SELECT)
$usuarios = $db->callProcedure('sp_obtener_usuarios', []);

// Ejecutar SP de INSERT/UPDATE/DELETE
$idNuevo = $db->executeProcedure('sp_crear_usuario', [$nombre, $email]);
```

### 2. Modelos

Cada modelo representa una tabla de la BD y usa métodos orientados a objetos:

```php
$usuario = new Usuario();
$usuario->nombreCompleto = "Juan Pérez";
$usuario->correoElectronico = "juan@example.com";
$usuario->contrasena = password_hash("123456", PASSWORD_DEFAULT);
$usuario->fechaNacimiento = "2000-01-01";
$usuario->genero = "Masculino";
$usuario->paisNacimiento = "Mexico";
$usuario->nacionalidad = "Mexicana";

$idUsuario = $usuario->registrar(); // Llama a sp_registrar_usuario
```

### 3. Controladores

Los controladores heredan de `BaseController` y usan los modelos:

```php
class AuthController extends BaseController {
    public function login() {
        $input = $this->getInput();
        $usuarioModel = new Usuario();
        $usuario = $usuarioModel->login($input['email']);
        
        if (password_verify($input['contrasena'], $usuario['contrasena'])) {
            $token = $this->createToken(...);
            $this->sendResponse(['token' => $token], 200);
        }
    }
}
```

---

## ✅ Cumplimiento de Prohibiciones

### ❌ NO usamos SQL directo
Todas las consultas se hacen mediante SPs:
```php
// ✅ CORRECTO
$db->callProcedure('sp_obtener_usuarios', []);

// ❌ PROHIBIDO (no existe en el código)
// $db->query("SELECT * FROM Usuario"); 
```

### ❌ NO usamos SELECT *
Todos los SPs especifican columnas:
```sql
-- ✅ CORRECTO
SELECT idUsuario, nombreCompleto, correoElectronico FROM Usuario;

-- ❌ PROHIBIDO
-- SELECT * FROM Usuario;
```

---

## 📊 Ventajas de esta Arquitectura

1. **Separación de responsabilidades**: Cada capa tiene una función específica
2. **Reutilización de código**: Los modelos se pueden usar en cualquier controlador
3. **Mantenibilidad**: Más fácil de entender y modificar
4. **Escalabilidad**: Fácil agregar nuevos endpoints
5. **Cumplimiento académico**: POO + MVC + SPs exclusivamente

---

## 🎓 Para la Evaluación

Este proyecto cumple con:
- ✅ Programación Orientada a Objetos (9 clases)
- ✅ Arquitectura MVC claramente definida
- ✅ Clase específica para conexión BD (Database.php con Singleton)
- ✅ Todas las consultas usan Stored Procedures
- ✅ NO se usa SELECT * en ninguna parte
- ✅ NO se usa SQL directo en código PHP

**Fecha de implementación**: Noviembre 2025
**Versión**: 3.0 MVC
