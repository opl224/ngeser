
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
import { UserPlus, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [users, setUsers] = useLocalStorageState<User[]>('users', initialUsers);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (getCurrentUserId()) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email.trim() || !fullName.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()) {
      toast({ title: "Input Tidak Lengkap", description: "Semua field harus diisi.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Password Tidak Cocok", description: "Password dan konfirmasi password tidak sama.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Word count validation for Full Name
    const fullNameWords = fullName.trim().split(/\s+/);
    if (fullNameWords.length > 15) {
      toast({
        title: "Nama Lengkap Terlalu Panjang",
        description: "Nama lengkap tidak boleh lebih dari 15 kata.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Word count validation for Username
    const usernameWords = username.trim().split(/\s+/);
    if (usernameWords.length > 15) {
      toast({
        title: "Nama Pengguna Terlalu Panjang",
        description: "Nama pengguna tidak boleh lebih dari 15 kata.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const currentUsers = Array.isArray(users) ? users : [];

    const emailExists = currentUsers.some(u => u && typeof u.email === 'string' && u.email.toLowerCase() === email.trim().toLowerCase());
    if (emailExists) {
      toast({ title: "Email Sudah Terdaftar", description: "Email ini sudah digunakan. Silakan gunakan email lain.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const usernameExists = currentUsers.some(u => u && typeof u.username === 'string' && u.username.toLowerCase() === username.trim().toLowerCase());
    if (usernameExists) {
      toast({ title: "Nama Pengguna Sudah Ada", description: "Nama pengguna ini sudah digunakan. Silakan pilih yang lain.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const newUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newUser: User = {
      id: newUserId,
      email: email.trim(),
      fullName: fullName.trim(),
      username: username.trim(),
      password: password, // Prototyping: store plaintext
      avatarUrl: `https://placehold.co/100x100.png?text=${username.trim().substring(0, 2).toUpperCase()}`,
      bio: '',
      followers: [],
      following: [],
      savedPosts: [],
      accountType: 'public',
      isVerified: false,
      pendingFollowRequests: [],
      sentFollowRequests: [],
    };

    setUsers(prevUsers => {
      const existingUsers = Array.isArray(prevUsers) ? prevUsers : [];
      return [...existingUsers, newUser];
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUserId', newUser.id);
      window.dispatchEvent(new CustomEvent('authChange'));
    }

    toast({
      title: `Selamat datang, ${newUser.username}!`,
      description: "Akun Anda telah berhasil dibuat dan Anda berhasil masuk.",
    });

    setIsLoading(false);
    router.push('/');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="flex items-center gap-2 mb-6">
        <Image src="/hand.png" alt="Ngeser logo" width={40} height={40} data-ai-hint="logo hand"/>
        <span className="font-headline text-4xl sm:text-5xl font-semibold text-foreground">Ngeser</span>
      </div>
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl flex items-center justify-center gap-2">
            <UserPlus className="h-7 w-7 text-primary" /> Daftar Akun Baru
          </CardTitle>
          <CardDescription>Buat akun untuk mulai berbagi dan terhubung.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email-register" className="font-medium">Email</Label>
              <Input
                id="email-register"
                type="email"
                placeholder="contoh@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                required
                data-ai-hint="email input field"
              />
            </div>
            <div>
              <Label htmlFor="fullName-register" className="font-medium">Nama Lengkap</Label>
              <Input
                id="fullName-register"
                type="text"
                placeholder="Nama Lengkap Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1"
                required
                data-ai-hint="full name input field"
              />
            </div>
            <div>
              <Label htmlFor="username-register" className="font-medium">Nama Pengguna</Label>
              <Input
                id="username-register"
                type="text"
                placeholder="Nama Pengguna Unik"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
                required
                data-ai-hint="username input field"
              />
            </div>
            <div>
              <Label htmlFor="password-register" className="font-medium">Password</Label>
              <Input
                id="password-register"
                type="password"
                placeholder="Buat password yang kuat"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                required
                data-ai-hint="password input field"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword-register" className="font-medium">Konfirmasi Password</Label>
              <Input
                id="confirmPassword-register"
                type="password"
                placeholder="Ketik ulang password Anda"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
                required
                data-ai-hint="confirm password input field"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Mendaftar...' : 'Daftar'}
            </Button>
             <p className="text-sm text-center text-muted-foreground">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-medium text-primary md:hover:underline">
                Masuk di sini
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

