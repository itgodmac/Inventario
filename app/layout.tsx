import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from "./components/theme-provider";

export const metadata: Metadata = {
    title: "RIPODOO - Next Generation ERP",
    description: "Advanced ERP System built with Next.js, featuring modern architecture and seamless workflows",
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#fef7ff' },
        { media: '(prefers-color-scheme: dark)', color: '#09090b' },
    ],
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 3000,
                            style: {
                                background: 'var(--card)',
                                color: 'var(--foreground)',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                fontSize: '14px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                border: '1px solid var(--border)',
                            },
                            success: {
                                iconTheme: {
                                    primary: 'var(--primary)',
                                    secondary: 'var(--primary-foreground)',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: 'var(--destructive)',
                                    secondary: 'var(--destructive-foreground)',
                                },
                            },
                        }}
                    />
                </ThemeProvider>
            </body>
        </html>
    );
}
