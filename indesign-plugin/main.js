const { app } = require("indesign");

let catalogData = null;
let selectedSections = new Set();

// DOM Elements
const apiUrlInput = document.getElementById('apiUrl');
const sectionsGroup = document.getElementById('sectionsGroup');
const loadSectionsBtn = document.getElementById('loadSectionsBtn');
const generateBtn = document.getElementById('generateBtn');
const languageSelect = document.getElementById('language');
const progressContainer = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const previewSection = document.getElementById('previewSection');
const previewText = document.getElementById('previewText');

// Event Listeners
loadSectionsBtn.addEventListener('click', loadSections);
generateBtn.addEventListener('click', generateCatalog);

// Load available sections from API
async function loadSections() {
    const apiUrl = apiUrlInput.value.trim();

    if (!apiUrl) {
        showError('Por favor ingresa la URL del API');
        return;
    }

    try {
        showProgress(10, 'Cargando secciones...');

        const response = await fetch(apiUrl + '?language=' + languageSelect.value);

        if (!response.ok) {
            throw new Error('Error al conectar con el API');
        }

        catalogData = await response.json();

        // Clear previous sections
        sectionsGroup.innerHTML = '';
        selectedSections.clear();

        // Populate sections
        catalogData.sections.forEach(section => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = section.name;
            checkbox.checked = true;
            checkbox.addEventListener('change', updatePreview);

            selectedSections.add(section.name);

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(`${section.name} (${section.productCount} productos)`));
            sectionsGroup.appendChild(label);
        });

        updatePreview();
        generateBtn.disabled = false;
        hideProgress();

    } catch (error) {
        showError('Error: ' + error.message);
        hideProgress();
    }
}

// Update preview when sections change
function updatePreview() {
    const checkboxes = sectionsGroup.querySelectorAll('input[type="checkbox"]');
    selectedSections.clear();

    let totalProducts = 0;
    checkboxes.forEach(cb => {
        if (cb.checked) {
            selectedSections.add(cb.value);
            const section = catalogData.sections.find(s => s.name === cb.value);
            if (section) {
                totalProducts += section.productCount;
            }
        }
    });

    const totalPages = Math.ceil(totalProducts / 16);
    previewText.textContent = `${totalProducts} productos en ${totalPages} páginas`;
    previewSection.style.display = 'block';
    generateBtn.disabled = selectedSections.size === 0;
}

// Main catalog generation function
async function generateCatalog() {
    if (!catalogData || selectedSections.size === 0) {
        showError('Primero carga las secciones');
        return;
    }

    try {
        showProgress(0, 'Iniciando generación...');
        generateBtn.disabled = true;

        // Create new document
        showProgress(10, 'Creando documento...');
        const doc = app.documents.add();

        // Set document preferences
        doc.documentPreferences.pageWidth = "210mm";  // A4
        doc.documentPreferences.pageHeight = "297mm";
        doc.viewPreferences.rulerOrigin = RulerOrigin.PAGE_ORIGIN;

        let progress = 20;
        const progressPerSection = 70 / selectedSections.size;

        // Generate pages for each selected section
        for (const section of catalogData.sections) {
            if (!selectedSections.has(section.name)) continue;

            showProgress(progress, `Generando ${section.name}...`);

            // Add section title page
            await createSectionTitlePage(doc, section.name);

            // Add product pages (16 products per page in 4x4 grid)
            const products = section.products;
            const numPages = Math.ceil(products.length / 16);

            for (let p = 0; p < numPages; p++) {
                const pageProducts = products.slice(p * 16, (p + 1) * 16);
                await createProductGridPage(doc, pageProducts);
            }

            progress += progressPerSection;
        }

        showProgress(100, '¡Catálogo generado!');
        await sleep(1500);
        hideProgress();
        generateBtn.disabled = false;

    } catch (error) {
        showError('Error al generar: ' + error.message);
        console.error(error);
        hideProgress();
        generateBtn.disabled = false;
    }
}

// Create section title page
async function createSectionTitlePage(doc, sectionName) {
    const page = doc.pages.add();

    // Create text frame for section title
    const titleFrame = page.textFrames.add({
        geometricBounds: ["100mm", "20mm", "150mm", "190mm"]
    });

    titleFrame.contents = sectionName;
    titleFrame.paragraphs[0].appliedFont = "Helvetica Neue";
    titleFrame.paragraphs[0].pointSize = 48;
    titleFrame.paragraphs[0].justification = Justification.CENTER_ALIGN;
    titleFrame.fillColor = app.swatches.item("Black");
}

// Create 4x4 product grid page
async function createProductGridPage(doc, products) {
    const page = doc.pages.add();

    const margin = 10; // mm
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const cellWidth = (pageWidth - (margin * 5)) / 4; // 4 columns
    const cellHeight = (pageHeight - (margin * 5)) / 4; // 4 rows
    const imageHeight = cellHeight * 0.7; // 70% for image
    const textHeight = cellHeight * 0.3; // 30% for text

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const index = row * 4 + col;
            if (index >= products.length) break;

            const product = products[index];
            const x = margin + (col * (cellWidth + margin));
            const y = margin + (row * (cellHeight + margin));

            // Image frame
            const imgFrame = page.rectangles.add({
                geometricBounds: [
                    `${y}mm`,
                    `${x}mm`,
                    `${y + imageHeight}mm`,
                    `${x + cellWidth}mm`
                ]
            });

            imgFrame.strokeWeight = 0.5;
            imgFrame.strokeColor = app.swatches.item("Black");

            // If product has image, try to place it
            if (product.image && product.image.startsWith('http')) {
                try {
                    // Download image to temp location
                    const imagePath = await downloadImage(product.image, product.id);
                    if (imagePath) {
                        imgFrame.place(imagePath);
                        imgFrame.fit(FitOptions.FILL_PROPORTIONALLY);
                        imgFrame.fit(FitOptions.CENTER_CONTENT);
                    }
                } catch (e) {
                    console.error('Error loading image:', e);
                }
            }

            // Text frame (name + SKU + price)
            const textFrame = page.textFrames.add({
                geometricBounds: [
                    `${y + imageHeight + 2}mm`,
                    `${x}mm`,
                    `${y + cellHeight}mm`,
                    `${x + cellWidth}mm`
                ]
            });

            textFrame.contents = `${product.name}\n${product.sku || ''}\n$${product.price.toFixed(2)}`;

            // Style text
            textFrame.paragraphs[0].appliedFont = "Helvetica Neue";
            textFrame.paragraphs[0].pointSize = 8;
            textFrame.paragraphs[0].justification = Justification.CENTER_ALIGN;
            textFrame.paragraphs[1].pointSize = 7;
            textFrame.paragraphs[2].pointSize = 9;
            textFrame.paragraphs[2].fontStyle = "Bold";
        }
    }
}

// Download image from URL
async function downloadImage(url, productId) {
    try {
        const fs = require("uxp").storage.localFileSystem;
        const folder = await fs.getTemporaryFolder();

        const response = await fetch(url);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        const file = await folder.createFile(`${productId}.jpg`, { overwrite: true });
        await file.write(arrayBuffer, { format: require("uxp").storage.formats.binary });

        return file.nativePath;
    } catch (error) {
        console.error('Download error:', error);
        return null;
    }
}

// UI Helper functions
function showProgress(percent, message) {
    progressContainer.style.display = 'block';
    progressBar.value = percent;
    progressText.textContent = message;
}

function hideProgress() {
    progressContainer.style.display = 'none';
}

function showError(message) {
    const existingError = document.querySelector('.error');
    if (existingError) existingError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.querySelector('.panel').prepend(errorDiv);

    setTimeout(() => errorDiv.remove(), 5000);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
