
"use client";

// import type { Metadata } from 'next'; // Static metadata is fine here, or use generateMetadata in page.tsx
import './globals.css';
import { AppNavbar } from '@/components/AppNavbar';
import { BottomNavbar } from '@/components/BottomNavbar';
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react'; // Import useState, useEffect
import { ThemeProvider } from 'next-themes';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Determine navbar visibility:
  // On server & initial client render (hasMounted = false), navbars are shown.
  // After client mount (hasMounted = true), visibility is based on pathname.
  const actualHideNavbars = hasMounted ? (pathname === '/dm' || pathname === '/reels') : false;

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <title>Ngeser</title>
        <meta name="description" content="Pengalaman media sosial yang sederhana namun elegan." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {!actualHideNavbars && <AppNavbar />}
          <main className={cn(
            "flex-grow",
            !actualHideNavbars && "pt-10", // Apply pt-10 only when navbars are shown
            actualHideNavbars ? "" : "container mx-auto px-4 pb-20 sm:pb-8"
          )}>
            {/* Wrap children with a div having pathname as key to force re-mount on navigation */}
            <div key={pathname}>
              {children}
            </div>
          </main>
          {!actualHideNavbars && <BottomNavbar />}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
