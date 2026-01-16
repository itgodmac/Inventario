
'use client';

import { useEffect } from 'react';

export default function PrintTrigger() {
    useEffect(() => {
        // Clear title to prevent browser header
        document.title = '';

        // Add a small delay to allow images/barcodes to render
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return null;
}
