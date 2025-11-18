# 📁 Archivos SQL del Proyecto

## ✅ Archivos Principales (USAR ESTOS)

### 1. `database.sql`
Crea la estructura completa de la base de datos:
- 6 tablas principales
- Claves foráneas
- Índices
- Estructura limpia

**Ejecutar primero** para crear la BD desde cero.

### 2. `STORED_PROCEDURES_DEFINITIVOS.sql`
Todos los 38 Stored Procedures que usa la aplicación:
- 8 SPs de Usuario
- 10 SPs de Publicación
- 5 SPs de Categoría
- 5 SPs de Mundial
- 5 SPs de Comentario
- 5 SPs de Interacción

**Ejecutar después** de database.sql

### 3. `datos_prueba.sql`
Datos de prueba completos para desarrollo:
- Usuarios de prueba
- Publicaciones de ejemplo
- Categorías
- Mundiales
- Comentarios
- Interacciones

**Ejecutar al final** si necesitas datos de prueba.

---

## 📋 Archivos de Soporte

- `DATABASE_DEFINITIVO.sql` - Backup alternativo de la estructura
- `insertar_datos_prueba.sql` - Script adicional de datos
- `datos_prueba_simple.sql` - Versión simplificada de datos de prueba
- `limpiar_datos.sql` - Limpia datos de prueba sin borrar estructura
- `views_functions_triggers.sql` - **PRÓXIMO A TRABAJAR** (Triggers, Views, Functions)

---

## 🚀 Orden de Ejecución Recomendado

```bash
# 1. Crear estructura
mysql -u root bdm < database.sql

# 2. Crear stored procedures
mysql -u root bdm < STORED_PROCEDURES_DEFINITIVOS.sql

# 3. (Opcional) Insertar datos de prueba
mysql -u root bdm < datos_prueba.sql
```

---

## ⚠️ Notas Importantes

- La tabla `Mundial` usa `paisSede` (NO `paisMundial`)
- Todos los SPs están corregidos y funcionando
- La base de datos se llama `bdm` (no `pwci`)
