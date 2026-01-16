
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
        <div className="flex flex-col h-[100mm] w-[62mm] bg-white p-[4.6mm] box-border relative break-inside-avoid print:break-inside-avoid overflow-hidden font-poppins">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap');
      `}</style>

            {/* Top Row: Image + Text */}
            <div className="flex flex-row items-center mb-[5mm] gap-[4mm]">
                <div className="w-[20mm] h-[20mm] shrink-0 flex items-center justify-center bg-white rounded-[2mm] border border-transparent">
                    <img
                        className="w-full h-full object-cover rounded-[2mm]"
                        src={imageUrl}
                        alt="Imagen producto"
                    />
                </div>
                <div className="flex-1 flex flex-col justify-start overflow-hidden">
                    <div className="text-[10pt] font-bold uppercase mb-[1mm] leading-[1.1] break-words">
                        {mainText}
                    </div>
                    {variantText && (
                        <div className="text-[14pt] font-normal uppercase -mt-[1mm] whitespace-nowrap overflow-hidden text-ellipsis">
                            ({variantText})
                        </div>
                    )}
                </div>
            </div>

            {/* Middle Content - Pushed to bottom of available space before barcode? 
          Snippet says .middle-content { margin-top: auto; } 
      */}
            <div className="mt-auto">
                <div className="text-[12pt] font-bold text-center leading-[1.2] mb-0 uppercase">
                    {productName}
                    {idcodeValue && (
                        <>
                            <br />
                            <span className="text-[8pt] font-normal">{idcodeValue}</span>
                        </>
                    )}
                </div>

                <div className="border border-black p-[4px] text-[6pt] leading-[1.1] text-center mb-[2mm] mt-[2mm]">
                    CONTENIDO: {piezas} {unidad.toUpperCase()}{piezas > 1 ? 'S' : ''}<br />
                    IMPORTADO POR:<br />
                    MCA BIM AND STRUCTURAL SOLUTIONS SA DE CV<br />
                    MBS160722UD5<br />
                    BLVD. LÁZARO CÁRDENAS 17-A COL. LA ESMERALDA CP 22117<br />
                    TIJUANA, BC, MÉXICO<br />
                    HECHO EN CHINA
                </div>
            </div>

            {/* Footer: Barcode */}
            <div className="w-full text-center">
                {product.barcode && (
                    <img
                        src={`https://barcodeapi.org/api/128/${product.barcode}`}
                        alt="Código de Barras"
                        className="w-full h-[15mm] object-contain"
                    />
                )}
            </div>
        </div>
    );
}
