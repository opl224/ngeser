
"use client";

import Link from 'next/link';
import { Home, PlusSquare, User, Film, LogIn, Search as SearchIconLucide, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState, FormEvent } from 'react';
import { getCurrentUserId } from '@/lib/data';

export function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsClient(true);
    const updateAuthStatus = () => {
      setCurrentUserIdState(getCurrentUserId());
    };
    updateAuthStatus();
    
    window.addEventListener('storage', updateAuthStatus);
    window.addEventListener('authChange', updateAuthStatus);

    return () => {
      window.removeEventListener('storage', updateAuthStatus);
      window.removeEventListener('authChange', updateAuthStatus);
    };
  }, []); 

  const baseNavItems = [
    { href: '/', label: 'Beranda', icon: Home },
  ];

  const authNavItems = [
    { href: '/upload', label: 'Unggah', icon: PlusSquare },
    { href: '/profile', label: 'Profil', icon: User },
  ];
  
  const loginNavItem = { href: '/login', label: 'Masuk', icon: LogIn };

  const allNavItems = currentUserId 
    ? [...baseNavItems, ...authNavItems] 
    : [...baseNavItems, loginNavItem];

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(''); 
    }
  };

  if (!isClient) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Film className="h-7 w-7 text-primary" />
            <span className="font-headline text-2xl font-semibold text-foreground">Elegance</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Placeholder */}
          </div>
        </div>
      </header>
    );
  }
  
  if (pathname === '/login') {
     return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-center"> 
          <Link href="/" className="flex items-center gap-2">
            <Film className="h-7 w-7 text-primary" />
            <span className="font-headline text-2xl font-semibold text-foreground">Elegance</span>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-x-4">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Film className="h-7 w-7 text-primary" />
          <span className="font-headline text-2xl font-semibold text-foreground">Elegance</span>
        </Link>

        <div className="flex-1 hidden sm:flex justify-center px-2 md:px-4"> 
          <form onSubmit={handleSearchSubmit} className="flex items-center relative w-full max-w-sm md:max-w-md">
            <SearchIconLucide className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Cari pengguna..."
              className="pl-10 pr-3 py-2 text-sm h-9 w-full rounded-md bg-muted/50 hover:bg-muted focus:bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-ai-hint="search users input"
            />
          </form>
        </div>
        
        <div className="flex items-center gap-x-1 sm:gap-x-2">
            <nav className="items-center gap-1 sm:gap-0 flex-shrink-0 hidden sm:flex">
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
                <Link href={item.href} className="flex items-center gap-2"> 
                    <item.icon className="h-5 w-5" />
                    <span className="inline">{item.label}</span> 
                </Link>
                </Button>
            ))}
            </nav>
            
            {currentUserId && (
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Notifikasi"
                    className="text-muted-foreground hover:text-foreground"
                    // onClick={() => router.push('/notifications')} // Akan ditambahkan nanti
                >
                    <Bell className="h-5 w-5" />
                </Button>
            )}
        </div>
      </div>
    </header>
  );
}
