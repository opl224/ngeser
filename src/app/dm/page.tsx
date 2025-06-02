
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserId, initialUsers, initialConversations } from '@/lib/data';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import type { User, Conversation, Message as MessageType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, MessageSquare, Send, Search as SearchIcon, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Placeholder for now, will be expanded
export default function DirectMessagesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const [allUsers, setAllUsers] = useLocalStorageState<User[]>('users', initialUsers);
  const [conversations, setConversations] = useLocalStorageState<Conversation[]>('conversations', initialConversations);

  useEffect(() => {
    const id = getCurrentUserId();
    if (!id) {
      setAuthStatus('unauthenticated');
      router.push('/login');
    } else {
      setCurrentUserIdState(id);
      setAuthStatus('authenticated');
    }
  }, [router]);

  const currentUser = allUsers.find(u => u.id === currentUserId);

  if (authStatus === 'loading' || !currentUser) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-headline text-muted-foreground">Memuat Pesan...</p>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
     return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-headline text-muted-foreground">Mengalihkan ke halaman masuk...</p>
      </div>
    );
  }

  // For now, just a placeholder
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-primary" />
            Pesan Langsung
          </CardTitle>
          <CardDescription>
            Lihat percakapan Anda atau mulai yang baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              Fitur Pesan Langsung sedang dalam pengembangan.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Kembali lagi nanti untuk melihat percakapan Anda!
            </p>
            <Button onClick={() => router.push('/')} className="mt-6">
              Kembali ke Beranda
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
