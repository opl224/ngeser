
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ImageOff } from 'lucide-react';
import type { User, Post } from '@/lib/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { initialUsers, initialPosts } from '@/lib/data';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatTimestamp } from '@/lib/utils';

export default function UserPhotosPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [allUsers] = useLocalStorageState<User[]>('users', initialUsers);
  const [allPosts] = useLocalStorageState<Post[]>('posts', initialPosts);

  const [isLoading, setIsLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPhotos, setUserPhotos] = useState<Post[]>([]);

  useEffect(() => {
    if (userId && allUsers.length > 0 && allPosts.length > 0) {
      const foundUser = allUsers.find(u => u.id === userId);
      setProfileUser(foundUser || null);

      if (foundUser) {
        const photos = allPosts
          .filter(p => p.userId === userId && p.type === 'photo')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setUserPhotos(photos);
      }
      setIsLoading(false);
    } else if (allUsers.length > 0 && allPosts.length > 0) { // Handle case where userId might be missing but data is loaded
        setIsLoading(false);
    }
  }, [userId, allUsers, allPosts]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-headline text-muted-foreground">Memuat Foto...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background p-4 text-center">
        <ImageOff className="h-16 w-16 text-destructive mb-4" />
        <p className="text-xl font-headline text-foreground">Pengguna Tidak Ditemukan</p>
        <p className="text-muted-foreground mt-2">Pengguna yang Anda cari tidak ada.</p>
        <Button onClick={() => router.back()} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between p-3 border-b bg-background/80 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Kembali">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col items-center">
            <h1 className="text-md font-semibold text-foreground font-headline">Foto oleh</h1>
            <p className="text-sm text-primary font-headline">{profileUser.username}</p>
        </div>
        <div className="w-9 h-9" /> {/* Spacer to balance the back button */}
      </header>

      <main className="p-2 sm:p-4">
        {userPhotos.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:gap-4">
            {userPhotos.map(photo => (
              <Card key={photo.id} className="overflow-hidden shadow-md w-full max-w-lg mx-auto">
                <CardHeader className="p-3 flex flex-row items-center space-x-3">
                    <Link href={`/profile/${profileUser.id}`}>
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={profileUser.avatarUrl} alt={profileUser.username} data-ai-hint="user avatar small"/>
                            <AvatarFallback>{profileUser.username.substring(0,1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div>
                        <Link href={`/profile/${profileUser.id}`} className="text-sm font-semibold hover:underline font-headline">{profileUser.username}</Link>
                        <p className="text-xs text-muted-foreground">{formatTimestamp(photo.timestamp)}</p>
                    </div>
                </CardHeader>
                <Link href={`/post/${photo.id}`}>
                    <div className="aspect-square w-full relative bg-muted/30">
                    <Image
                        src={photo.mediaUrl}
                        alt={photo.caption || `Foto oleh ${profileUser.username}`}
                        layout="fill"
                        objectFit="cover"
                        className=""
                        data-ai-hint="user photo item"
                    />
                    </div>
                </Link>
                {photo.caption && (
                  <CardContent className="p-3">
                    <p className="text-sm text-foreground line-clamp-3">{photo.caption}</p>
                  </CardContent>
                )}
                 <CardFooter className="p-3 flex items-center justify-start gap-4 text-xs text-muted-foreground border-t">
                    <div><span className="font-medium">{photo.likes.length}</span> Suka</div>
                    <div><span className="font-medium">{photo.comments.length + photo.comments.reduce((sum, comment) => sum + (comment.replies?.length || 0), 0)}</span> Komentar</div>
                    <div><span className="font-medium">{photo.viewCount || 0}</span> Dilihat</div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center py-16 text-center">
            <ImageOff className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-headline text-foreground">Tidak Ada Foto</p>
            <p className="text-muted-foreground mt-2">
              {profileUser.username} belum mengunggah foto apapun.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
