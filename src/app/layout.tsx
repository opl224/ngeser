
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { AppNavbar } from '@/components/AppNavbar';
import { BottomNavbar } from '@/components/BottomNavbar'; // Import BottomNavbar
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react'; // Import React

// Metadata can still be defined but won't be dynamic in this client component
// For dynamic metadata based on path, specific page.tsx files should export it.
// export const metadata: Metadata = {
//   title: 'Elegance',
//   description: 'Pengalaman media sosial yang sederhana namun elegan.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isDMPage = pathname === '/dm';
  const isReelsPage = pathname === '/reels';
  const hideNavbars = isDMPage || isReelsPage;

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <title>Elegance</title>
        <meta name="description" content="Pengalaman media sosial yang sederhana namun elegan." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background">
        {!hideNavbars && <AppNavbar />}
        <main className={cn(
          "flex-grow",
          hideNavbars ? "" : "container mx-auto px-4 pt-16 pb-20 sm:pb-8"
        )}>
          {/* Wrap children with a div having pathname as key to force re-mount on navigation */}
          <div key={pathname}>
            {children}
          </div>
        </main>
        {!hideNavbars && <BottomNavbar />}
        <Toaster />
      </body>
    </html>
  );
}
