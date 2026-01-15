// ===============================================
// BigMaterials Catalog Generator
// Version 3.0 - Funciona en InDesign pirata
// ===============================================

#target indesign

main();

function main() {
    // Leer archivo JSON
    var jsonFile = File(Folder.current + "/catalog-data.json");

    if (!jsonFile.exists) {
        alert("ERROR\n\nPrimero ejecuta en terminal:\nnode download-catalog-data.js");
        return;
    }

    jsonFile.open('r');
    var jsonString = jsonFile.read();
    jsonFile.close();

    var data = eval('(' + jsonString + ')');

    // Crear documento
    var doc = app.documents.add();
    doc.documentPreferences.pageWidth = "210mm";
    doc.documentPreferences.pageHeight = "297mm";

    // Procesar cada sección
    for (var s = 0; s < data.sections.length; s++) {
        var section = data.sections[s];

        // Página de título
        var titlePage = doc.pages.add();
        var titleText = titlePage.textFrames.add();
        titleText.geometricBounds = ["100mm", "20mm", "150mm", "190mm"];
        titleText.contents = section.name;
        titleText.paragraphs[0].pointSize = 48;
        titleText.paragraphs[0].justification = Justification.CENTER_ALIGN;

        // Dividir productos en páginas de 16
        var products = section.products;
        for (var p = 0; p < products.length; p += 16) {
            var page = doc.pages.add();

            // Grid 4x4
            for (var i = 0; i < 16 && (p + i) < products.length; i++) {
                var product = products[p + i];
                var row = Math.floor(i / 4);
                var col = i % 4;

                var x = 10 + (col * 47.5);
                var y = 10 + (row * 69.25);

                // Frame de imagen
                var imgBox = page.rectangles.add();
                imgBox.geometricBounds = [y + "mm", x + "mm", (y + 48) + "mm", (x + 47.5) + "mm"];
                imgBox.strokeWeight = 0.5;

                // Texto
                var txtBox = page.textFrames.add();
                txtBox.geometricBounds = [(y + 50) + "mm", x + "mm", (y + 69) + "mm", (x + 47.5) + "mm"];
                txtBox.contents = product.name + "\n" + (product.sku || "") + "\n$" + product.price.toFixed(2);
                txtBox.paragraphs[0].pointSize = 8;
                txtBox.paragraphs[0].justification = Justification.CENTER_ALIGN;
            }
        }
    }

    alert("✅ Catálogo creado!\n\nProductos: " + data.totalProducts + "\nPáginas: " + doc.pages.length);
}
