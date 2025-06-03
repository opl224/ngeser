
"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import type { User } from '@/lib/types';
import { initialUsers, getCurrentUserId } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useLocalStorageState<User[]>('users', initialUsers);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (getCurrentUserId()) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Input Tidak Lengkap",
        description: "Silakan masukkan nama pengguna dan password.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);

    const currentUsers = Array.isArray(users) ? users : [];
    const targetUser = currentUsers.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

    if (targetUser && targetUser.password === password) { // Prototyping: simple password check
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUserId', targetUser.id);
        window.dispatchEvent(new CustomEvent('authChange'));
      }
      toast({
        title: `Selamat datang kembali, ${targetUser.username}!`,
        description: "Anda telah berhasil masuk.",
      });
      router.push('/');
    } else {
      toast({
        title: "Login Gagal",
        description: "Nama pengguna atau password salah.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="flex items-center gap-2 mb-8">
          <Image src="/hand.png" alt="Ngeser logo" width={40} height={40} data-ai-hint="logo hand"/>
          <span className="font-headline text-4xl sm:text-5xl font-semibold text-foreground">Ngeser</span>
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl flex items-center justify-center gap-2">
            <LogIn className="h-7 w-7 text-primary" /> Masuk
          </CardTitle>
          <CardDescription>Masukkan nama pengguna dan password Anda.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username-login" className="font-medium">Nama Pengguna</Label>
              <Input
                id="username-login"
                type="text"
                placeholder="Nama Pengguna Anda"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
                required
                data-ai-hint="username input field"
              />
            </div>
            <div>
              <Label htmlFor="password-login" className="font-medium">Password</Label>
              <Input
                id="password-login"
                type="password"
                placeholder="Password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                required
                data-ai-hint="password input field"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading || !username.trim() || !password.trim()}>
              {isLoading ? 'Masuk...' : 'Masuk'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Belum punya akun?{' '}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Daftar di sini
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      <p className="text-xs text-muted-foreground mt-8 text-center">
        &copy; {new Date().getFullYear()} Ngeser Social. Hak cipta dilindungi. <br/>
      </p>
    </div>
  );
}
