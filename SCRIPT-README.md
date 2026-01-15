# Cómo Usar el Script

## Paso 1: Descargar Datos

Abre terminal en la carpeta del proyecto y ejecuta:

```bash
node download-catalog-data.js
```

Esto crea el archivo `catalog-data.json`

## Paso 2: Ejecutar en InDesign

**IMPORTANTE: El script Y el archivo catalog-data.json deben estar en la MISMA carpeta**

### Método 1: Arrastrar (NO FUNCIONA - InDesign lo abre)

### Método 2: Desde InDesign ✅

1. Abre InDesign
2. **File → Scripts → Other Script...** (NO existe en menú, usa atajo)
3. Presiona: **Ctrl + Alt + F11** (Windows) o **Cmd + Opt + F11** (Mac)
4. Busca y selecciona `BigMaterials-Catalog-Generator.jsx`
5. Se ejecuta automáticamente

### Método 3: Panel Scripts (Recomendado) ✅

1. En InDesign: **Window → Utilities → Scripts**
2. En el panel, haz click derecho en la carpeta **"User"**
3. Selecciona **"Reveal in Explorer"** (Windows) o **"Reveal in Finder"** (Mac)
4. **COPIA** estos 2 archivos a esa carpeta:
   - `BigMaterials-Catalog-Generator.jsx`
   - `catalog-data.json`
5. Vuelve a InDesign
6. En el panel Scripts, **doble click** en `BigMaterials-Catalog-Generator`

## Qué Hace

- Lee `catalog-data.json` (debe estar en la misma carpeta)
- Crea documento A4 automáticamente
- Página de título por cada sección
- Grid 4x4 con 16 productos por página
- Texto: nombre + SKU + precio

## Imágenes

⚠️ Las imágenes NO se descargan automáticamente (ExtendScript no puede hacer HTTPS)

**Para agregar imágenes después:**
1. Selecciona un frame vacío
2. File → Place
3. Selecciona la imagen
4. Se coloca en el frame

## Troubleshooting

**"No se encontró catalog-data.json"**
→ Ejecuta: `node download-catalog-data.js`
→ Copia `catalog-data.json` a la misma carpeta donde está el .jsx

**Script no aparece en el panel**
→ Verifica que lo copiaste a la carpeta correcta (User scripts folder)
→ Reinicia InDesign

**Ctrl+Alt+F11 no funciona**
→ Prueba con Ctrl+Alt+Shift+F11
→ O busca en: File → Scripts (puede estar oculto)

## Ubicación de Scripts

**Windows:**
```
C:\Users\[TuUsuario]\AppData\Roaming\Adobe\InDesign\[Version]\[Idioma]\Scripts\Scripts Panel\
```

**Mac:**
```
~/Library/Preferences/Adobe InDesign/Version [X]/Scripts/Scripts Panel/
```
