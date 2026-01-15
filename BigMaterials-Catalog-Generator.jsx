// ===============================================
// BigMaterials - Importar TODOS los Productos
// Grid 4x4 con fotos
// ===============================================

#target indesign

main();

function main() {
    // Obtener carpeta del script (no la carpeta actual)
    var scriptFolder = File($.fileName).parent;

    // Leer archivo JSON desde la carpeta del script
    var jsonFile = File(scriptFolder + "/catalog-data.json");

    if (!jsonFile.exists) {
        alert("ERROR\n\nArchivo no encontrado:\n" + jsonFile.fsName + "\n\nPrimero ejecuta:\nnode download-catalog-data.js");
        return;
    }

    jsonFile.open('r');
    var jsonString = jsonFile.read();
    jsonFile.close();

    var data = eval('(' + jsonString + ')');

    // Recopilar TODOS los productos (ignorar secciones)
    var allProducts = [];
    for (var s = 0; s < data.sections.length; s++) {
        for (var p = 0; p < data.sections[s].products.length; p++) {
            allProducts.push(data.sections[s].products[p]);
        }
    }

    if (allProducts.length === 0) {
        alert("No hay productos para importar");
        return;
    }

    // Mostrar confirmación
    var confirm = window.confirm(
        "Importar Catálogo BigMaterials\n\n" +
        "Total productos: " + allProducts.length + "\n" +
        "Páginas: " + Math.ceil(allProducts.length / 16) + "\n\n" +
        "¿Continuar?"
    );

    if (!confirm) return;

    // Crear documento
    var doc = app.documents.add();
    doc.documentPreferences.pageWidth = "210mm";
    doc.documentPreferences.pageHeight = "297mm";

    var imagesFolder = scriptFolder + "/catalog-images";

    // Dividir en páginas de 16 productos
    for (var p = 0; p < allProducts.length; p += 16) {
        var page = doc.pages.add();

        // Grid 4x4
        for (var i = 0; i < 16 && (p + i) < allProducts.length; i++) {
            var product = allProducts[p + i];
            var row = Math.floor(i / 4);
            var col = i % 4;

            var x = 10 + (col * 47.5);
            var y = 10 + (row * 69.25);

            // Frame de imagen
            var imgBox = page.rectangles.add();
            imgBox.geometricBounds = [y + "mm", x + "mm", (y + 48) + "mm", (x + 47.5) + "mm"];
            imgBox.strokeWeight = 0.5;
            imgBox.strokeColor = app.swatches.item("Black");

            // Intentar colocar imagen
            if (product.sku) {
                var imageFile = new File(imagesFolder + "/" + product.sku + ".jpg");
                if (imageFile.exists) {
                    try {
                        imgBox.place(imageFile);
                        imgBox.fit(FitOptions.FILL_PROPORTIONALLY);
                        imgBox.fit(FitOptions.CENTER_CONTENT);
                    } catch (e) {
                        // Imagen no se pudo colocar
                    }
                }
            }

            // Texto (nombre + SKU + precio)
            var txtBox = page.textFrames.add();
            txtBox.geometricBounds = [(y + 50) + "mm", x + "mm", (y + 69) + "mm", (x + 47.5) + "mm"];

            var productName = product.name || product.nameEs || product.nameEn || "Sin nombre";
            var productSku = product.sku || "";
            var productPrice = "$" + product.price.toFixed(2);

            txtBox.contents = productName + "\n" + productSku + "\n" + productPrice;
            txtBox.paragraphs[0].pointSize = 8;
            txtBox.paragraphs[0].justification = Justification.CENTER_ALIGN;

            try {
                txtBox.paragraphs[2].fontStyle = "Bold";
            } catch (e) {
                // Font style no disponible
            }
        }
    }

    alert(
        "✅ Catálogo importado!\n\n" +
        "Productos: " + allProducts.length + "\n" +
        "Páginas: " + doc.pages.length
    );
}
