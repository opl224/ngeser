
import type { Metadata } from 'next';
import './globals.css';
import { AppNavbar } from '@/components/AppNavbar';
import { BottomNavbar } from '@/components/BottomNavbar'; // Import BottomNavbar
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Elegance',
  description: 'Pengalaman media sosial yang sederhana namun elegan.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background">
        <AppNavbar />
        <main className="flex-grow container mx-auto px-4 py-8 pb-20 sm:pb-8"> {/* Add padding-bottom for mobile to avoid overlap */}
          {children}
        </main>
        <BottomNavbar /> {/* Add BottomNavbar here */}
        <Toaster />
      </body>
    </html>
  );
}
