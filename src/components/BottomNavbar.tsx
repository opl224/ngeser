
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, BadgePlus, User, LogIn, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { getCurrentUserId } from '@/lib/data';

export function BottomNavbar() {
  const pathname = usePathname();
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const updateAuthStatus = () => {
      setCurrentUserIdState(getCurrentUserId());
    };
    updateAuthStatus(); // Initial check

    window.addEventListener('storage', updateAuthStatus);
    window.addEventListener('authChange', updateAuthStatus); // Listen to custom event

    return () => {
      window.removeEventListener('storage', updateAuthStatus);
      window.removeEventListener('authChange', updateAuthStatus);
    };
  }, []);

  if (!isClient) {
    return null; // Avoid SSR/hydration mismatch
  }

  // Do not show bottom navbar on the login page
  if (pathname === '/login') {
    return null;
  }

  const navItemsConfig = currentUserId
    ? [
        { href: '/', label: 'Beranda', icon: Home },
        { href: '/search', label: 'Cari', icon: Search },
        { href: '/upload', label: 'Unggah', icon: BadgePlus },
        { href: '/reels', label: 'Reels', icon: Film },
        { href: '/profile', label: 'Profil', icon: User },
      ]
    : [
        { href: '/', label: 'Beranda', icon: Home },
        { href: '/search', label: 'Cari', icon: Search },
        { href: '/login', label: 'Masuk', icon: LogIn },
      ];

  // Do not show bottom navbar on the DM page for a cleaner chat interface
  if (pathname === '/dm') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-51 block border-t bg-background/95 p-1 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:hidden">
      <div className="flex justify-around items-center h-14">
        {navItemsConfig.map((item) => {
          const isActive = pathname === item.href || (item.href === '/reels' && pathname.startsWith('/reels'));
          const isUpload = item.label === 'Unggah';
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-md flex-grow text-center h-full',
                isActive ? 'text-primary' : 'text-muted-foreground',
                'md:hover:bg-accent md:hover:text-accent-foreground transition-colors'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className={cn("h-6 w-6", isUpload && "h-7 w-7")} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
