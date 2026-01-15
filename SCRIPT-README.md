# BigMaterials Catalog Generator - Script InDesign

## Instalación Súper Simple ✅

**NO necesitas instalar nada**. Solo arrastrar el archivo.

### Usar el Script

1. **Descarga:** `BigMaterials-Catalog-Generator.jsx`
2. **Abre InDesign**
3. **Arrastra** el archivo `.jsx` a la ventana de InDesign
4. El script se ejecuta automáticamente

O desde el menú:
- **File → Scripts → Other Script...**
- Selecciona `BigMaterials-Catalog-Generator.jsx`

## Funcionalidades

- ✅ Seleccionar secciones del catálogo
- ✅ Idioma español/inglés
- ✅ Grid 4x4 automático (16 productos por página)
- ✅ Páginas de título por sección
- ✅ Texto con nombre, SKU y precio
- ✅ Conexión directa al API

## Importante: Imágenes

⚠️ **Limitación de ExtendScript:** No puede descargar imágenes automáticamente por HTTPS.

**Solución:**
1. El script crea el layout completo
2. Los frames de imágenes quedan vacíos
3. Usa **File → Place** para agregar imágenes manualmente
4. O ejecuta un script separado de descarga

**Alternativa (Próximamente):**
- Crear endpoint que descargue imágenes como ZIP
- Extraer ZIP localmente
- Script las coloca automáticamente

## Diferencias con Plugin UXP

| Feature | Script .jsx | Plugin UXP |
|---------|-------------|------------|
| Instalación | ❌ No requiere | ✅ Requiere .ccx |
| Uso | Arrastrar archivo | Panel lateral |
| Imágenes | ❌ Manual | ✅ Automático |
| Distribución | 📧 Email directo | 📦 Archivo .ccx |
| Compatibilidad | InDesign CS6+ | InDesign 2023+ |

## Requisitos

- InDesign CS6 o superior
- Conexión a internet (para datos del API)
- Windows/Mac

## Troubleshooting

**Script no se ejecuta:**
- Verifica que InDesign esté abierto
- Arrastra de nuevo el archivo

**Error de conexión:**
- Verifica internet
- El API debe estar en: `https://inventario.big-m.mx/api/catalog/export`

**Imágenes no aparecen:**
- Normal - ExtendScript no descarga HTTPS
- Agrégalas manualmente después

## Próximas Mejoras

1. Script de descarga de imágenes por lote
2. Integración con Cloudinary CLI
3. Versión con Node.js helper para imágenes
