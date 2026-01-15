# BigMaterials Catalog Plugin - Instalación

## Para Usuarios (Sin UXP Developer Tool)

### Método 1: Doble Click (Recomendado) ✅

1. **Descargar:** `BigMaterials-Catalog-Generator-v1.0.0.ccx`
2. **Doble click** en el archivo
3. **Adobe Creative Cloud** se abre automáticamente
4. Click **"Install"**
5. **Abrir InDesign** → Window → Extensions → BigMaterials Catalog

### Método 2: Instalar desde Creative Cloud

1. Abre **Adobe Creative Cloud Desktop**
2. Ve a **Stock & Marketplace → Plugins**
3. Click **⋮** (menú) → **"Install from .ccx file"**
4. Selecciona `BigMaterials-Catalog-Generator-v1.0.0.ccx`

## Para Desarrolladores (Crear el .ccx)

### Opción A: Script Automático (Windows)

```bash
# Ejecutar desde la carpeta del proyecto
package-plugin.bat
```

Este script crea: `BigMaterials-Catalog-Generator-v1.0.0.ccx`

### Opción B: Manual

1. **Comprimir carpeta `indesign-plugin`** como ZIP
2. **Renombrar** de `.zip` a `.ccx`
3. **Listo** - Ya es instalable

## Archivos del Plugin

```
indesign-plugin/
├── manifest.json      # Configuración
├── index.html        # UI
├── styles.css        # Estilos
├── main.js          # Lógica
├── icons/
│   └── icon.png     # Ícono
└── README.md        # Documentación
```

## Distribución

**Opciones:**

1. **Email/Drive:** Envía el `.ccx` directamente
2. **Servidor web:** Sube a `https://inventario.big-m.mx/plugins/`
3. **Adobe Exchange:** Publicación pública ([gratis](https://developer.adobe.com/distribute/))

## Requisitos

- InDesign 2023 o superior
- Adobe Creative Cloud Desktop instalado
- Conexión a internet (para descargar productos)

## Verificación

Después de instalar, verifica:

1. **InDesign abierto** → Window → Extensions
2. **"BigMaterials Catalog"** aparece en la lista
3. Click para abrir el panel
4. URL debe mostrar: `https://inventario.big-m.mx/api/catalog/export`

## Troubleshooting

**Plugin no aparece:**
- Reinicia InDesign
- Reinstala el .ccx
- Verifica versión de InDesign (mín. 2023)

**Error al instalar:**
- Verifica que Creative Cloud Desktop esté actualizado
- El archivo .ccx no debe estar corrupto (re-descarga)

## Soporte

Email: soporte@bigmaterials.com
