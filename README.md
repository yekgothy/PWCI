# PWCI - Proyecto Web Copa del Mundo

## Descripción

Este es un proyecto web desarrollado para gestionar información relacionada con la Copa del Mundo. El proyecto consta de un frontend en HTML/CSS/JavaScript y un backend con base de datos SQL.

## Estructura del Proyecto

```
PWCI/
├── PWCI-Backend/          # Backend del proyecto
│   ├── database.sql       # Script de base de datos
│   └── MODELO E-R.jpg     # Modelo Entidad-Relación
└── PWCI-Front/           # Frontend del proyecto
    ├── admin/            # Panel de administración
    ├── components/       # Componentes reutilizables
    ├── controllers/      # Lógica de controladores
    ├── pages/           # Páginas principales
    └── public/          # Recursos estáticos
```

## Características

### Frontend
- **Panel de Administración**: Gestión de posts, comentarios, categorías y datos de la Copa del Mundo
- **Páginas de Usuario**: Login, registro, feed, creación de posts, detalles de perfil
- **Componentes Reutilizables**: Navbar, footer, cards, sidebars
- **Recursos**: Fuentes personalizadas, imágenes y videos

### Backend
- **Base de Datos**: Script SQL con estructura completa
- **Modelo E-R**: Diagrama de la base de datos

## Páginas Disponibles

### Páginas Públicas
- `landingPage.html` - Página de inicio
- `login.html` - Inicio de sesión
- `signup.html` - Registro de usuarios
- `home.html` - Página principal
- `feed.html` - Feed de posts

### Páginas de Usuario
- `createPost.html` - Crear nuevos posts
- `postDetails.html` - Detalles de posts individuales
- `profileDetails.html` - Detalles del perfil de usuario

### Panel de Administración
- `adminPanel.html` - Panel principal de administración
- `approvePost.html` - Aprobación de posts
- `categoryManagement.html` - Gestión de categorías
- `commentManagement.html` - Gestión de comentarios
- `worldCupManagement.html` - Gestión de datos de la Copa del Mundo

## Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: SQL
- **Recursos**: Fuentes OTF personalizadas, imágenes PNG/JPG, videos MP4

## Instalación y Uso

1. Clona este repositorio
2. Configura la base de datos usando el archivo `PWCI-Backend/database.sql`
3. Abre las páginas HTML en tu navegador web preferido
4. Para el panel de administración, accede a los archivos en la carpeta `admin/`

## Contribución

Este proyecto está en desarrollo. Para contribuir:

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto es parte de un trabajo académico.

---

Desarrollado para el curso de Programación Web y Construcción de Interfaces