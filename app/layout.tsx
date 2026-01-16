import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from "./components/theme-provider";

export const metadata: Metadata = {
    title: "RIPODOO - Next Generation ERP",
    description: "Advanced ERP System built with Next.js, featuring modern architecture and seamless workflows",
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
                                background: '#fff',
                                color: '#1C1C1E',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                fontSize: '14px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#34C759',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: '#FF3B30',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                </ThemeProvider>
            </body>
        </html>
    );
}
