
"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import type { User } from '@/lib/types';
import { initialUsers, getCurrentUserId } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { Film, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [users, setUsers] = useLocalStorageState<User[]>('users', initialUsers);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (getCurrentUserId()) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({
        title: "Nama pengguna diperlukan",
        description: "Silakan masukkan nama pengguna untuk masuk.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);

    let targetUser = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

    if (targetUser) {
      // User found
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUserId', targetUser.id);
      }
      toast({
        title: `Selamat datang kembali, ${targetUser.username}!`,
        description: "Anda telah berhasil masuk.",
      });
    } else {
      // Create new user
      const newUserId = `user-${Date.now()}`;
      const newUser: User = {
        id: newUserId,
        username: username.trim(),
        avatarUrl: `https://placehold.co/100x100.png?text=${username.trim().substring(0,2).toUpperCase()}`,
        bio: '',
        followers: [],
        following: [],
      };
      setUsers(prevUsers => [...prevUsers, newUser]);
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUserId', newUser.id);
      }
      toast({
        title: `Selamat datang, ${newUser.username}!`,
        description: "Akun baru Anda telah dibuat dan Anda berhasil masuk.",
      });
    }
    
    setIsLoading(false);
    router.push('/'); 
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="flex items-center gap-2 mb-8">
          <Film className="h-10 w-10 text-primary" />
          <span className="font-headline text-5xl font-semibold text-foreground">Elegance</span>
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl flex items-center justify-center gap-2">
            <LogIn className="h-7 w-7 text-primary" /> Masuk
          </CardTitle>
          <CardDescription>Masukkan nama pengguna Anda untuk melanjutkan atau membuat akun.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username" className="font-medium">Nama Pengguna</Label>
              <Input
                id="username"
                type="text"
                placeholder="contoh: NamaAnda"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
                required
                data-ai-hint="username input field"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || !username.trim()}>
              {isLoading ? 'Masuk...' : 'Masuk / Buat Akun'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="text-xs text-muted-foreground mt-8 text-center">
        &copy; {new Date().getFullYear()} Elegance Social. Hak cipta dilindungi. <br/>
        Proyek untuk tujuan demonstrasi.
      </p>
    </div>
  );
}
