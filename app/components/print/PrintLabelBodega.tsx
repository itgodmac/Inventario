
import React from 'react';
import { Product } from '@/app/lib/types';

interface PrintLabelBodegaProps {
    product: Product;
    piezas?: number; // Optional prop for content count, default to 1
}

export default function PrintLabelBodega({ product, piezas = 1 }: PrintLabelBodegaProps) {
    const imageUrl = product.image || "https://via.placeholder.com/80";

    // Logic from snippet
    // UVA: selectedVariant ? selectedVariant.uva : product.uva
    // We only have product here for now.
    const uvaValue = product.uvaNombre || null;

    const displayName = product.nameEs || product.name;

    // Main Text: "UVA value" OR "Product Name"
    // If UVA exists, use it? The snippet says:
    // const mainText = uvaValue || (selectedProduct ... ? name : name);
    const mainText = uvaValue || displayName;

    // Product Name (Above Content): Always product name?
    const productName = displayName;

    // ID Code: selectedVariant.idcode : product.idcode
    const idcodeValue = product.itemCode || null;

    // Variant Text: Logic was complex involving selectedVariant. 
    // For now, if nameEs is different and present, maybe use it? Or just leave empty as we don't have variants yet.
    const variantText = '';

    // Measures
    // Product schema doesn't have measures yet, stubbing or using description if suitable?
    // const hasMeasures = ...; 

    const unidad = "PIEZA";

    return (
        <div className="flex flex-col h-[100mm] w-[62mm] bg-white p-[3mm] box-border relative break-inside-avoid print:break-inside-avoid overflow-hidden font-poppins text-black">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap');
        @media print {
            * {
                color: #000000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            body {
                background-color: white !important;
            }
        }
      `}</style>

            {/* Top Row: Image + Text (Reduced height) */}
            <div className="flex flex-row items-center mb-[3mm] gap-[3mm] text-black shrink-0">
                <div className="w-[15mm] h-[15mm] shrink-0 flex items-center justify-center bg-white rounded-[1mm] border border-transparent">
                    <img
                        className="w-full h-full object-contain rounded-[1mm]"
                        src={imageUrl}
                        alt="Imagen producto"
                    />
                </div>
                <div className="flex-1 flex flex-col justify-center overflow-hidden">
                    <div className="text-[11pt] font-black uppercase leading-[1.1] break-words text-black">
                        {mainText}
                    </div>
                </div>
            </div>

            {/* Middle Content - Descriptive (Now pushed to bottom) */}
            <div className="flex-grow flex flex-col justify-end overflow-hidden pb-1">
                <div className="text-[15.5pt] font-black text-center leading-[1.1] mb-1 uppercase text-black line-clamp-4">
                    {productName}
                </div>
                {idcodeValue && (
                    <div className="text-[9.5pt] font-bold text-center text-black uppercase">
                        {idcodeValue}
                    </div>
                )}
            </div>

            {/* Bottom Section: Legal Box + Barcode (Fixed at bottom) */}
            <div className="shrink-0">
                <div className="border-[1.2px] border-black p-[3px] text-[6.5pt] font-bold leading-[1.0] text-center mb-[2mm] text-black">
                    CONTENIDO: {piezas} {unidad.toUpperCase()}{piezas > 1 ? 'S' : ''}<br />
                    IMPORTADO POR: MCA BIM AND STRUCTURAL SOLUTIONS SA DE CV<br />
                    MBS160722UD5 | BLVD. LÁZARO CÁRDENAS 17-A COL. LA ESMERALDA CP 22117<br />
                    TIJUANA, BC, MÉXICO | HECHO EN CHINA
                </div>

                <div className="w-full text-center pb-2">
                    {product.barcode && (
                        <div className="flex flex-col items-center">
                            <img
                                src={`https://barcodeapi.org/api/128/${product.barcode}`}
                                alt="Código de Barras"
                                className="w-full h-[15mm] object-contain"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
