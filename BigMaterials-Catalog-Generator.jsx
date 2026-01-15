// ===============================================
// BigMaterials Catalog Generator - InDesign Script
// Version 1.0.0
// ===============================================

#target indesign

// Configuración
var API_URL = "https://inventario.big-m.mx/api/catalog/export";
var TEMP_FOLDER = Folder.temp + "/bigmaterials-catalog/";

// Main Function
function main() {
    // Verificar que InDesign esté abierto
    if (app.documents.length === 0) {
        alert("Por favor abre InDesign primero.");
        return;
    }

    // Mostrar diálogo de configuración
    var dialog = createDialog();
    if (dialog.show() == 2) return; // Cancel

    // Obtener secciones seleccionadas
    var selectedSections = [];
    if (dialog.section1.value) selectedSections.push("Ollas Revolvedoras");
    if (dialog.section2.value) selectedSections.push("Putzmeister");
    if (dialog.section3.value) selectedSections.push("Schwing");
    if (dialog.section4.value) selectedSections.push("Sistema Tuberias");
    if (dialog.section5.value) selectedSections.push("WAM");

    if (selectedSections.length === 0) {
        alert("Selecciona al menos una sección.");
        return;
    }

    var lang = dialog.langGroup.spanish.value ? "es" : "en";

    // Crear ventana de progreso
    var progressWin = createProgressWindow();
    progressWin.show();

    try {
        // 1. Fetch productos del API
        updateProgress(progressWin, 10, "Descargando productos del servidor...");
        var catalogData = fetchCatalogData(selectedSections, lang);

        if (!catalogData) {
            throw new Error("No se pudo conectar con el API");
        }

        // 2. Crear documento nuevo
        updateProgress(progressWin, 20, "Creando documento InDesign...");
        var doc = createDocument();

        // 3. Crear carpeta temporal para imágenes
        var tempFolder = new Folder(TEMP_FOLDER);
        if (!tempFolder.exists) tempFolder.create();

        var totalProgress = 30;
        var progressPerSection = 60 / catalogData.sections.length;

        // 4. Generar páginas por sección
        for (var i = 0; i < catalogData.sections.length; i++) {
            var section = catalogData.sections[i];

            updateProgress(progressWin, totalProgress, "Generando sección: " + section.name);

            // Página de título de sección
            createSectionTitlePage(doc, section.name);

            // Páginas de productos (16 por página)
            var products = section.products;
            var numPages = Math.ceil(products.length / 16);

            for (var p = 0; p < numPages; p++) {
                var pageProducts = products.slice(p * 16, (p + 1) * 16);
                createProductGridPage(doc, pageProducts, tempFolder);
            }

            totalProgress += progressPerSection;
        }

        updateProgress(progressWin, 100, "¡Catálogo generado exitosamente!");
        $.sleep(1000);
        progressWin.close();

        alert("Catálogo generado exitosamente!\n\n" +
            "Total productos: " + catalogData.totalProducts + "\n" +
            "Total páginas: " + doc.pages.length);

    } catch (error) {
        progressWin.close();
        alert("Error: " + error.message + "\n\nVerifica tu conexión a internet.");
    }
}

// Crear diálogo de configuración
function createDialog() {
    var dialog = new Window("dialog", "BigMaterials Catalog Generator");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";

    // Header
    var header = dialog.add("statictext", undefined, "Generador de Catálogo BigMaterials");
    header.graphics.font = ScriptUI.newFont("Arial", "Bold", 16);

    dialog.add("statictext", undefined, "Selecciona las secciones a incluir:");

    // Secciones
    dialog.section1 = dialog.add("checkbox", undefined, "Ollas Revolvedoras");
    dialog.section2 = dialog.add("checkbox", undefined, "Putzmeister");
    dialog.section3 = dialog.add("checkbox", undefined, "Schwing");
    dialog.section4 = dialog.add("checkbox", undefined, "Sistema de Tuberías");
    dialog.section5 = dialog.add("checkbox", undefined, "WAM");

    // Marcar todas por defecto
    dialog.section1.value = true;
    dialog.section2.value = true;
    dialog.section3.value = true;
    dialog.section4.value = true;
    dialog.section5.value = true;

    dialog.add("statictext", undefined, "");
    dialog.add("statictext", undefined, "Idioma:");

    // Idioma
    dialog.langGroup = dialog.add("group");
    dialog.langGroup.orientation = "row";
    dialog.langGroup.spanish = dialog.langGroup.add("radiobutton", undefined, "Español");
    dialog.langGroup.english = dialog.langGroup.add("radiobutton", undefined, "English");
    dialog.langGroup.spanish.value = true;

    // Botones
    var buttonGroup = dialog.add("group");
    buttonGroup.orientation = "row";
    buttonGroup.alignment = "right";
    buttonGroup.add("button", undefined, "Cancelar", { name: "cancel" });
    buttonGroup.add("button", undefined, "Generar Catálogo", { name: "ok" });

    return dialog;
}

// Crear ventana de progreso
function createProgressWindow() {
    var win = new Window("palette", "Generando Catálogo...");
    win.orientation = "column";
    win.alignChildren = "fill";
    win.spacing = 10;
    win.margins = 20;

    win.progressBar = win.add("progressbar", undefined, 0, 100);
    win.progressBar.preferredSize = [300, 20];

    win.statusText = win.add("statictext", undefined, "Iniciando...");
    win.statusText.preferredSize = [300, 20];

    return win;
}

// Actualizar ventana de progreso
function updateProgress(win, percent, message) {
    win.progressBar.value = percent;
    win.statusText.text = message;
    win.update();
}

// Fetch datos del API
function fetchCatalogData(sections, lang) {
    try {
        var url = API_URL + "?language=" + lang;

        // En ExtendScript usamos Socket para HTTP
        var response = httpGet(url);

        if (!response) return null;

        var data = eval("(" + response + ")"); // Parse JSON

        // Filtrar solo secciones seleccionadas
        if (sections.length > 0) {
            data.sections = data.sections.filter(function (section) {
                return sections.indexOf(section.name) !== -1;
            });
        }

        return data;
    } catch (e) {
        return null;
    }
}

// HTTP GET usando Socket (ExtendScript no tiene fetch)
function httpGet(url) {
    try {
        // Parsear URL
        var matches = url.match(/^https?:\/\/([^\/]+)(.*)/);
        if (!matches) return null;

        var host = matches[1];
        var path = matches[2] || "/";

        var socket = new Socket();
        if (socket.open(host + ":443", "BINARY")) {
            socket.write("GET " + path + " HTTP/1.1\r\n");
            socket.write("Host: " + host + "\r\n");
            socket.write("Connection: close\r\n\r\n");

            var response = "";
            while (!socket.eof) {
                response += socket.read();
            }
            socket.close();

            // Extraer body (después de \r\n\r\n)
            var bodyStart = response.indexOf("\r\n\r\n");
            if (bodyStart !== -1) {
                return response.substring(bodyStart + 4);
            }
        }
        return null;
    } catch (e) {
        return null;
    }
}

// Crear documento InDesign
function createDocument() {
    var doc = app.documents.add();
    doc.documentPreferences.pageWidth = "210mm";  // A4
    doc.documentPreferences.pageHeight = "297mm";
    doc.viewPreferences.rulerOrigin = RulerOrigin.PAGE_ORIGIN;
    return doc;
}

// Crear página de título de sección
function createSectionTitlePage(doc, sectionName) {
    var page = doc.pages.add();

    var titleFrame = page.textFrames.add();
    titleFrame.geometricBounds = ["100mm", "20mm", "150mm", "190mm"];
    titleFrame.contents = sectionName;

    titleFrame.paragraphs[0].appliedFont = app.fonts.item("Helvetica Neue");
    titleFrame.paragraphs[0].pointSize = 48;
    titleFrame.paragraphs[0].justification = Justification.CENTER_ALIGN;
}

// Crear página con grid 4x4 de productos
function createProductGridPage(doc, products, tempFolder) {
    var page = doc.pages.add();

    var margin = 10; // mm
    var cellWidth = 47.5; // (210 - 50) / 4
    var cellHeight = 69.25; // (297 - 50) / 4
    var imageHeight = cellHeight * 0.7;
    var textHeight = cellHeight * 0.3;

    for (var row = 0; row < 4; row++) {
        for (var col = 0; col < 4; col++) {
            var index = row * 4 + col;
            if (index >= products.length) break;

            var product = products[index];
            var x = margin + (col * cellWidth);
            var y = margin + (row * cellHeight);

            // Frame de imagen
            var imgFrame = page.rectangles.add();
            imgFrame.geometricBounds = [
                y + "mm",
                x + "mm",
                (y + imageHeight) + "mm",
                (x + cellWidth) + "mm"
            ];
            imgFrame.strokeWeight = 0.5;

            // Descargar e insertar imagen si existe
            if (product.image) {
                try {
                    var imgFile = downloadImage(product.image, product.id, tempFolder);
                    if (imgFile && imgFile.exists) {
                        imgFrame.place(imgFile);
                        imgFrame.fit(FitOptions.FILL_PROPORTIONALLY);
                        imgFrame.fit(FitOptions.CENTER_CONTENT);
                    }
                } catch (e) {
                    // Ignorar errores de imagen
                }
            }

            // Text frame (nombre + SKU + precio)
            var textFrame = page.textFrames.add();
            textFrame.geometricBounds = [
                (y + imageHeight + 2) + "mm",
                x + "mm",
                (y + cellHeight) + "mm",
                (x + cellWidth) + "mm"
            ];

            textFrame.contents = product.name + "\n" +
                (product.sku || "") + "\n" +
                "$" + product.price.toFixed(2);

            textFrame.paragraphs[0].appliedFont = app.fonts.item("Helvetica Neue");
            textFrame.paragraphs[0].pointSize = 8;
            textFrame.paragraphs[0].justification = Justification.CENTER_ALIGN;
        }
    }
}

// Descargar imagen (simulado - extendscript no puede descargar fácilmente)
function downloadImage(url, productId, folder) {
    // En producción real, necesitarías un endpoint que descargue las imágenes
    // o usar un script externo. Por ahora retornamos null.
    // Las imágenes se pueden agregar manualmente después
    return null;
}

// Ejecutar script
main();
