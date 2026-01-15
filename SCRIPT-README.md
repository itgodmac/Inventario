# Importar TODOS los Productos a InDesign

## Paso 1: Descargar Productos + Imágenes

```bash
node download-catalog-data.js
```

Esto descarga:
- ✅ `catalog-data.json` - Datos de productos
- ✅ `catalog-images/` - Todas las fotos de Cloudinary

## Paso 2: Ejecutar Script en InDesign

**Desde el Panel de Scripts:**

1. InDesign → **Window → Utilities → Scripts**
2. Click derecho en **"User"** → **Reveal in Explorer**
3. **Copia toda la carpeta del proyecto** ahí (o solo estos archivos):
   - `BigMaterials-Catalog-Generator.jsx`
   - `catalog-data.json`
   - `catalog-images/` (carpeta completa)
4. En InDesign, **doble click** en el script

**O con atajo:**

1. Presiona **Ctrl + Alt + F11**
2. Selecciona `BigMaterials-Catalog-Generator.jsx`

## Qué Hace

- ✅ Importa **TODOS los productos** (ignora secciones)
- ✅ Grid 4x4 perfecto (16 productos por página)
- ✅ **Coloca las fotos automáticamente** desde `catalog-images/`
- ✅ Texto: nombre + SKU + precio

## Resultado

```
Página 1: Productos 1-16 (con fotos)
Página 2: Productos 17-32 (con fotos)
...
```

## Archivos Necesarios

```
tu-carpeta/
├── BigMaterials-Catalog-Generator.jsx
├── catalog-data.json
├── download-catalog-data.js
└── catalog-images/
    ├── 1000.jpg
    ├── 1001.jpg
    ├── 1002.jpg
    └── ...
```

**IMPORTANTE:** Todos los archivos deben estar en la MISMA carpeta para que el script encuentre las imágenes.

## Troubleshooting

**"No se encontró catalog-data.json"**
→ Ejecuta: `node download-catalog-data.js`

**Imágenes no aparecen**
→ Verifica que la carpeta `catalog-images/` esté en el mismo lugar que el .jsx
→ Ejecuta de nuevo: `node download-catalog-data.js` para re-descargar imágenes

**"No hay productos"**
→ El API no devolvió datos, verifica tu conexión
