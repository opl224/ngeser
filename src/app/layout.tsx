
"use client";

// import type { Metadata } from 'next'; // Static metadata is fine here, or use generateMetadata in page.tsx
import './globals.css';
// AppNavbar removed
import { BottomNavbar } from '@/components/BottomNavbar';
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import Image from 'next/image'; // Added for logo in minimal header
import Link from 'next/link'; // Added for logo link
import { MobileHeaderIcons } from '@/components/MobileHeaderIcons';


import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'; 
import { AppSidebar } from '@/components/AppSidebar';


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

  const actualHideBottomNavbarAndMainPadding = hasMounted ? (pathname === '/dm' || pathname === '/reels' || pathname === '/login' || pathname === '/register') : false;

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
          <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <SidebarInset>
              {/* Minimal top bar for mobile - Icons removed from here */}
              <header className={cn(
                "sticky top-0 z-30 h-14 flex items-center justify-between px-4 border-b bg-background/80 backdrop-blur-sm md:hidden",
                actualHideBottomNavbarAndMainPadding && "hidden" 
              )}>
                <Link href="/" className="flex items-center gap-2">
                  <Image src="/hand.png" alt="Ngeser logo" width={28} height={28} data-ai-hint="logo hand mobile" />
                  <span className="font-headline text-xl font-semibold text-foreground">Ngeser</span>
                </Link>
                <MobileHeaderIcons />
              </header>

              <main className={cn(
                "flex-grow",
                actualHideBottomNavbarAndMainPadding ? "" : "container mx-auto px-4 pb-20 sm:pb-8"
              )}>
                <div key={pathname}>
                  {children}
                </div>
              </main>
              {!actualHideBottomNavbarAndMainPadding && <BottomNavbar />}
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
