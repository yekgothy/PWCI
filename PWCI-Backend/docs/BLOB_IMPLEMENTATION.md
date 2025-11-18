# Sistema BLOB Implementado ✅

## Archivos Creados:

### 1. SQL Scripts
- **IMPLEMENT_BLOB.sql** - Agrega columnas BLOB a tablas Usuario y Publicacion + 7 Stored Procedures nuevos
- **UPDATE_SP_BLOB_URLS.sql** - Actualiza SPs existentes para generar URLs automáticas de imágenes BLOB

### 2. Backend
- **imagen-api.php** - API REST para subir/obtener imágenes como BLOB

### 3. Frontend
- **blob-utils.js** - Funciones helper para trabajar con imágenes BLOB
- **test-blob.html** - Página de prueba del sistema BLOB

## Cómo Funciona:

### Almacenamiento:
1. Las imágenes se guardan como **MEDIUMBLOB** en la base de datos (hasta 16MB)
2. Se guardan 3 campos: `fotoBlob` (binario), `fotoMimeType` (tipo), `fotoNombre` (nombre archivo)
3. Los campos antiguos (`foto`, `urlMultimedia`) se mantienen para compatibilidad

### URLs Generadas:
- Foto de usuario: `http://localhost/PWCI/PWCI-Backend/imagen-api.php/usuario/{id}/foto`
- Multimedia publicación: `http://localhost/PWCI/PWCI-Backend/imagen-api.php/publicacion/{id}/multimedia`

### Stored Procedures Nuevos:
1. `sp_guardar_foto_usuario` - Guardar foto de usuario como BLOB
2. `sp_obtener_foto_usuario` - Obtener foto de usuario
3. `sp_guardar_multimedia_publicacion` - Guardar multimedia de publicación
4. `sp_obtener_multimedia_publicacion` - Obtener multimedia de publicación
5. `sp_crear_publicacion_con_blob` - Crear publicación con imagen BLOB
6. `sp_registrar_usuario_con_blob` - Registrar usuario con foto BLOB

### Stored Procedures Actualizados:
- `sp_obtener_publicaciones_aprobadas` - Ahora genera URLs de BLOB automáticamente
- `sp_obtener_publicacion_por_id` - Incluye URLs de BLOB
- `sp_obtener_publicaciones_por_estado` - Incluye URLs de BLOB
- `sp_obtener_usuario_por_id` - Incluye URL de foto BLOB
- `sp_obtener_comentarios_por_publicacion` - Incluye URLs de fotos
- `sp_obtener_todos_usuarios` - Incluye URLs de fotos

## Próximos Pasos:

1. **Ejecuta UPDATE_SP_BLOB_URLS.sql** en la base de datos
2. **Prueba el sistema** abriendo `http://localhost/PWCI/PWCI-Front/pages/test-blob.html`
3. **Verifica** que las imágenes se suben y descargan correctamente
4. El sistema usa automáticamente BLOB si está disponible, sino usa URLs antiguas

## Ventajas del BLOB:
✅ Cumple requisito académico
✅ Imágenes portables con la base de datos
✅ No depende de filesystem
✅ Control total sobre acceso
✅ Compatible con backups de BD

## Notas:
- Máximo 5MB para fotos de perfil
- Máximo 10MB para multimedia de publicaciones
- Formatos permitidos: JPG, PNG, GIF, WEBP
- Sistema retrocompatible con URLs antiguas
