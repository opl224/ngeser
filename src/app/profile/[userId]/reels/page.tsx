
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, VideoOff } from 'lucide-react';
import type { User, Post } from '@/lib/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { initialUsers, initialPosts } from '@/lib/data';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatTimestamp } from '@/lib/utils';
import { PlayCircle, Heart, MessageSquare, Eye } from 'lucide-react';

export default function UserReelsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [allUsers] = useLocalStorageState<User[]>('users', initialUsers);
  const [allPosts] = useLocalStorageState<Post[]>('posts', initialPosts);
  const [currentUserId] = useLocalStorageState<string | null>('currentUserId', null);


  const [isLoading, setIsLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userReels, setUserReels] = useState<Post[]>([]);

  useEffect(() => {
    if (userId && allUsers.length > 0 && allPosts.length > 0) {
      const foundUser = allUsers.find(u => u.id === userId);
      setProfileUser(foundUser || null);

      if (foundUser) {
        const reels = allPosts
          .filter(p => p.userId === userId && p.type === 'reel')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setUserReels(reels);
      }
      setIsLoading(false);
    } else if (allUsers.length > 0 && allPosts.length > 0) {
        setIsLoading(false);
    }
  }, [userId, allUsers, allPosts]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-headline text-muted-foreground">Memuat Reels...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background p-4 text-center">
        <VideoOff className="h-16 w-16 text-destructive mb-4" />
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
            <h1 className="text-md font-semibold text-foreground font-headline">Reels oleh</h1>
            <p className="text-sm text-primary font-headline">{profileUser.username}</p>
        </div>
        <div className="w-9 h-9" /> {/* Spacer to balance the back button */}
      </header>

      <main className="p-2 sm:p-4">
        {userReels.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:gap-4">
            {userReels.map(reel => (
              <Card key={reel.id} className="overflow-hidden shadow-md w-full max-w-lg mx-auto">
                <CardHeader className="p-3 flex flex-row items-center space-x-3">
                    <Link href={`/profile/${profileUser.id}`}>
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={profileUser.avatarUrl} alt={profileUser.username} data-ai-hint="user avatar small"/>
                            <AvatarFallback>{profileUser.username.substring(0,1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div>
                        <Link href={`/profile/${profileUser.id}`} className="text-sm font-semibold hover:underline font-headline">{profileUser.username}</Link>
                        <p className="text-xs text-muted-foreground">{formatTimestamp(reel.timestamp)}</p>
                    </div>
                </CardHeader>
                <Link href={`/post/${reel.id}`}>
                    <div className="aspect-[9/16] w-full relative bg-muted/30">
                    {reel.mediaMimeType?.startsWith('video/') ? (
                        <>
                        <video
                            src={reel.mediaUrl}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                            loop
                            data-ai-hint="user reel item"
                        />
                        <PlayCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 text-white/80 pointer-events-none" />
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Format tidak didukung</div>
                    )}
                    </div>
                </Link>
                {reel.caption && (
                  <CardContent className="p-3">
                    <p className="text-sm text-foreground line-clamp-3">{reel.caption}</p>
                  </CardContent>
                )}
                 <CardFooter className="p-3 flex items-center justify-start gap-4 text-xs text-muted-foreground border-t">
                    <div className="flex items-center gap-1">
                        <Heart className={`h-3.5 w-3.5 ${(reel.likes || []).includes(currentUserId ?? '') ? 'text-destructive fill-destructive' : '' }`} />
                        <span>{reel.likes.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{reel.comments.length + reel.comments.reduce((sum, comment) => sum + (comment.replies?.length || 0), 0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{reel.viewCount || 0}</span>
                    </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center py-16 text-center">
            <VideoOff className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-headline text-foreground">Tidak Ada Reels</p>
            <p className="text-muted-foreground mt-2">
              {profileUser.username} belum mengunggah reels apapun.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

