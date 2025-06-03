
"use client";

import { useEffect, useState, useMemo, FormEvent } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import type { User } from '@/lib/types';
import { initialUsers } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, AlertTriangle, Users } from 'lucide-react';

export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [allUsers] = useLocalStorageState<User[]>('users', initialUsers);
  
  // State for the search input on this page
  const [pageSearchQuery, setPageSearchQuery] = useState('');
  // State to hold the query that was actually used for filtering (from URL or page input)
  const [activeQuery, setActiveQuery] = useState('');

  useEffect(() => {
    const qFromUrl = searchParams.get('q');
    if (qFromUrl) {
      setActiveQuery(qFromUrl);
      setPageSearchQuery(qFromUrl); // Pre-fill input if query comes from URL
    } else {
      setActiveQuery(''); // No active query if not in URL
      // Don't clear pageSearchQuery here, user might be typing
    }
  }, [searchParams]);

  const filteredUsers = useMemo(() => {
    if (!activeQuery.trim()) return [];
    return allUsers.filter(user =>
      user.username.toLowerCase().includes(activeQuery.toLowerCase().trim())
    );
  }, [allUsers, activeQuery]);

  const handlePageSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pageSearchQuery.trim()) {
      // Update URL, which will trigger useEffect and re-filter
      router.push(`${pathname}?q=${encodeURIComponent(pageSearchQuery.trim())}`);
    } else {
      // If search is cleared, remove query from URL
      router.push(pathname);
    }
  };

  // Show search input if navigating directly to /search or if URL query is empty
  const showPageSearchInput = !searchParams.get('q');

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8 text-center">
        <Users className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-headline mb-2">
          Cari Pengguna
        </h1>
        <p className="text-muted-foreground">
          Temukan pengguna lain dalam komunitas Elegance.
        </p>
      </div>
      
      <form onSubmit={handlePageSearchSubmit} className="flex items-center gap-2 mb-8">
        <Input
          type="search"
          placeholder="Masukkan nama pengguna..."
          value={pageSearchQuery}
          onChange={(e) => setPageSearchQuery(e.target.value)}
          className="flex-grow h-11 text-base"
          data-ai-hint="search input on page"
        />
        <Button
          type="submit"
          variant="default" // Explicitly set variant
          className="h-11 w-11 p-0 sm:w-auto sm:px-8" // Custom responsive classes
        >
          <SearchIcon className="h-5 w-5" />
          <span className="hidden sm:ml-2 sm:inline">Cari</span>
        </Button>
      </form>

      {activeQuery && (
        <div className="mb-6">
          <h2 className="text-2xl font-headline mb-4 text-center">
            Hasil untuk: <span className="text-primary">&quot;{activeQuery}&quot;</span>
          </h2>
          {filteredUsers.length > 0 ? (
            <Card className="shadow-lg border-border">
              <CardHeader>
                <CardTitle className="font-headline text-xl">Pengguna Ditemukan ({filteredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredUsers.map(user => (
                  <Link
                    href={`/profile/${user.id}`}
                    key={user.id}
                    className="flex items-center gap-4 p-3 hover:bg-muted/70 rounded-lg transition-colors group border border-transparent hover:border-primary/50"
                  >
                    <Avatar className="h-14 w-14 border-2 border-primary/30 group-hover:border-primary transition-all">
                      <AvatarImage src={user.avatarUrl} alt={user.username} data-ai-hint="search result avatar" />
                      <AvatarFallback className="text-xl">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold font-headline text-lg text-foreground group-hover:text-primary transition-colors">{user.username}</p>
                      {user.bio && <p className="text-sm text-muted-foreground line-clamp-2">{user.bio}</p>}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-md border-destructive/50">
              <CardContent className="py-10 flex flex-col items-center justify-center text-center">
                <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
                <p className="text-2xl font-semibold text-foreground">Tidak Ada Hasil</p>
                <p className="text-muted-foreground mt-1">
                  Tidak ada pengguna yang cocok dengan &quot;{activeQuery}&quot;. Coba kata kunci lain.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
       {!activeQuery && !pageSearchQuery && (
         <p className="text-center text-muted-foreground mt-12">
            Mulai pencarian Anda dengan mengetik nama pengguna di atas dan tekan Cari.
          </p>
       )}
    </div>
  );
}
