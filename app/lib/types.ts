
export interface Product {
    id: string;
    name: string;
    nameEn: string | null;
    nameEs: string | null;
    sku: string | null;
    barcode: string | null;
    itemCode: string | null;
    photoId: string | null;
    uvaNombre: string | null;
    category: string | null;
    description: string | null;
    montaje: string | null;
    tipo: string | null;

    // Excel Columns N, Q, R
    rotacion: string | null;
    notes: string | null;
    pedido: string | null;

    // Stats
    stock: number;
    physicalStock: number | null;
    price: number;
    priceZG: number;
    priceOth: number;
    priceBM: number;
    ptijDll: number;
    ptijMxn: number;
    vecesG: number;

    status: string;
    image: string | null;
    updatedAt?: Date;
    createdAt?: Date;
}
