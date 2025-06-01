
"use client";

import Link from 'next/link';
import { Home, PlusSquare, User, Film, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { getCurrentUserId } from '@/lib/data';

export function AppNavbar() {
  const pathname = usePathname();
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Component has mounted
    setCurrentUserIdState(getCurrentUserId());
    
    // Listen to storage changes to update login state, e.g., after login/logout
    const handleStorageChange = () => {
      setCurrentUserIdState(getCurrentUserId());
    };
    window.addEventListener('storage', handleStorageChange);
    // Custom event for login/logout as 'storage' event might not fire for same-tab changes
    window.addEventListener('authChange', handleStorageChange);


    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleStorageChange);
    };
  }, [pathname]); // Re-check on pathname change for SPA navigations

  // Base nav items always visible
  const baseNavItems = [
    { href: '/', label: 'Beranda', icon: Home },
  ];

  // Nav items for authenticated users
  const authNavItems = [
    { href: '/upload', label: 'Unggah', icon: PlusSquare },
    { href: '/profile', label: 'Profil', icon: User },
  ];
  
  // Nav item for unauthenticated users
  const loginNavItem = { href: '/login', label: 'Masuk', icon: LogIn };

  const allNavItems = currentUserId 
    ? [...baseNavItems, ...authNavItems] 
    : [...baseNavItems, loginNavItem];


  if (!isClient) {
    // Render a placeholder or minimal navbar during SSR/pre-hydration
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Film className="h-7 w-7 text-primary" />
            <span className="font-headline text-2xl font-semibold text-foreground">Elegance</span>
          </Link>
          <nav className="flex items-center gap-2">
            {/* Placeholder for nav items */}
          </nav>
        </div>
      </header>
    );
  }


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Film className="h-7 w-7 text-primary" />
          <span className="font-headline text-2xl font-semibold text-foreground">Elegance</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {allNavItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              asChild
              className={cn(
                "text-sm font-medium px-2 sm:px-3",
                pathname === item.href ? "text-primary hover:text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Link href={item.href} className="flex items-center gap-1 sm:gap-2">
                <item.icon className="h-5 w-5" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
