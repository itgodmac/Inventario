# BigMaterials Catalog Generator - InDesign Plugin

Plugin de Adobe InDesign para generar automáticamente el catálogo BigMaterials con productos desde la base de datos.

## Características

- **Generación automática**: Importa productos directamente desde la base de datos
- **Grid 4x4**: 16 productos por página organizados en cuadrícula
- **5 Secciones**: Organizado automáticamente por categorías
- **Imágenes de alta calidad**: Descarga directa desde Cloudinary
- **Multiidioma**: Soporte para español e inglés
- **Vista previa**: Muestra cantidad de productos y páginas antes de generar

## Instalación

### 1. Instalar UXP Developer Tool

1. Descarga [Adobe UXP Developer Tool](https://developer.adobe.com/console/servicesandapis/uxp)
2. Instala e inicia la aplicación

### 2. Cargar el Plugin

1. Abre UXP Developer Tool
2. Haz clic en "Add Plugin"
3. Navega a la carpeta `indesign-plugin`
4. Selecciona el archivo `manifest.json`
5. Haz clic en "Load"

### 3. Abrir en InDesign

1. Abre Adobe InDesign (versión 2023 o superior)
2. Ve a **Window → Extensions → BigMaterials Catalog**
3. El panel se abrirá en el lateral

## Uso

### Paso 1: Configurar API

1. En el campo "URL del API", ingresa:
   ```
   https://inventario.big-m.mx/api/catalog/export
   ```
   (por defecto ya viene configurado)

### Paso 2: Cargar Secciones

1. Haz clic en "Cargar Secciones"
2. El plugin se conectará al API y mostrará las categorías disponibles
3. Selecciona las secciones que quieres incluir en el catálogo

### Paso 3: Generar Catálogo

1. Selecciona el idioma (Español o English)
2. Revisa la vista previa (productos y páginas)
3. Haz clic en "Generar Catálogo"
4. El plugin creará automáticamente:
   - Página de título por cada sección
   - Páginas con grid 4x4 de productos
   - Imágenes descargadas de Cloudinary
   - Texto con nombre, SKU y precio

## Estructura del Catálogo

```
Documento InDesign
├── Sección 1: Ollas Revolvedoras
│   ├── Página de título
│   └── Páginas de productos (16 por página)
├── Sección 2: Putzmeister
│   ├── Página de título
│   └── Páginas de productos
...
```

### Grid 4x4 por Página

```
┌─────┬─────┬─────┬─────┐
│ P1  │ P2  │ P3  │ P4  │
├─────┼─────┼─────┼─────┤
│ P5  │ P6  │ P7  │ P8  │
├─────┼─────┼─────┼─────┤
│ P9  │ P10 │ P11 │ P12 │
├─────┼─────┼─────┼─────┤
│ P13 │ P14 │ P15 │ P16 │
└─────┴─────┴─────┴─────┘
```

Cada celda contiene:
- Imagen del producto (70% altura)
- Nombre del producto
- SKU
- Precio ($)

## API Endpoint

El plugin se conecta a:

**GET** `/api/catalog/export`

**Query Parameters:**
- `sections[]` (opcional): Filtrar por secciones específicas
- `language` (opcional): `es` | `en` (default: `es`)

**Response:**
```json
{
  "sections": [
    {
      "name": "Putzmeister",
      "products": [...],
      "productCount": 42
    }
  ],
  "totalProducts": 245,
  "totalPages": 16,
  "generatedAt": "2026-01-15T12:00:00Z"
}
```

## Requisitos

- **InDesign**: Versión 2023 o superior
- **Node.js**: Para el servidor API
- **Base de datos**: PostgreSQL con productos
- **Cloudinary**: Para imágenes

## Troubleshooting

### Plugin no carga
- Verifica que InDesign sea versión 2023+
- Reinstala desde UXP Developer Tool

### Error al conectar con API
- Verifica que el servidor esté corriendo (`npm run dev`)
- Verifica la URL del API en el plugin
- Revisa la consola del navegador en UXP Developer Tool

### Imágenes no se cargan
- Verifica que los productos tengan URLs válidas de Cloudinary
- Revisa los permisos de red del plugin

### Grid desalineado
- Verifica que el tamaño de página sea A4 (210x297mm)
- Ajusta los márgenes en `main.js` si es necesario

## Desarrollo

### Estructura de Archivos

```
indesign-plugin/
├── manifest.json    # Configuración del plugin
├── index.html       # Panel UI
├── styles.css       # Estilos del panel
├── main.js          # Lógica principal
├── icons/
│   └── icon.png     # Ícono 24x24
└── README.md        # Este archivo
```

### Modificar el Grid

Para cambiar el grid (ej. 3x3 en lugar de 4x4), edita en `main.js`:

```javascript
// Cambiar estas constantes
const cellWidth = (pageWidth - (margin * 4)) / 3; // 3 columnas
const cellHeight = (pageHeight - (margin * 4)) / 3; // 3 filas

// Y el loop
for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
        const index = row * 3 + col; // 9 productos por página
        ...
    }
}
```

### Debugging

1. Abre UXP Developer Tool
2. Con el plugin cargado, haz clic en "Debug"
3. Se abrirá Chrome DevTools
4. Usa `console.log()` en `main.js` para debugging

## Soporte

Para reportar bugs o solicitar features:
- Email: soporte@bigmaterials.com
- GitHub: [Repositorio del proyecto]

## Versión

**v1.0.0** - Enero 2026

## Licencia

Propietario BigMaterials
