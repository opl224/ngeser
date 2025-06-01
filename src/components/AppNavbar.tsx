"use client";

import Link from 'next/link';
import { Home, PlusSquare, User, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function AppNavbar() {
  const pathname = usePathname();
  const currentUserId = typeof window !== 'undefined' ? (localStorage.getItem('currentUserId') || 'user1') : 'user1';


  const navItems = [
    { href: '/', label: 'Feed', icon: Home },
    { href: '/upload', label: 'Upload', icon: PlusSquare },
    { href: `/profile/${currentUserId}`, label: 'Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Film className="h-7 w-7 text-primary" />
          <span className="font-headline text-2xl font-semibold text-foreground">Elegance</span>
        </Link>
        <nav className="flex items-center gap-2">
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              asChild
              className={cn(
                "text-sm font-medium",
                pathname === item.href ? "text-primary hover:text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Link href={item.href} className="flex items-center gap-2">
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
