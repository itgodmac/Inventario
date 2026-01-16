
export interface Product {
    id: string;
    name: string;
    nameEn: string | null;
    nameEs: string | null;
    sku: string | null;
    barcode: string | null;
    itemCode: string | null;
    category: string | null;
    stock: number;
    price: number;
    priceZG?: number;
    priceOth?: number;
    status: string;
    image: string | null;
    description: string | null;
    // Add other fields as needed based on Prisma schema
    updatedAt?: Date;
    createdAt?: Date;
}
