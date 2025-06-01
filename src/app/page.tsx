
"use client";

import { PostCard } from '@/components/PostCard';
import type { Post, Comment as CommentType, User } from '@/lib/types';
import { initialPosts, initialUsers, getCurrentUserId } from '@/lib/data';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { StoryAvatarReel } from '@/components/StoryAvatarReel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Progress } from "@/components/ui/progress";

interface UserWithStoryCount extends User {
  storyCount: number;
  latestStoryTimestamp: string;
}

export default function FeedPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useLocalStorageState<Post[]>('posts', initialPosts);
  const [users, setUsers] = useLocalStorageState<User[]>('users', initialUsers); 
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [storyModalContent, setStoryModalContent] = useState<{ user: User; post: Post; storyCount: number } | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);

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
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPosts = localStorage.getItem('posts');
      if (storedPosts === null) { 
        localStorage.setItem('posts', JSON.stringify(initialPosts));
      }
      const storedUsers = localStorage.getItem('users');
      if (storedUsers === null) { 
        localStorage.setItem('users', JSON.stringify(initialUsers));
      }
    }
  }, []); 
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const usersWithStories = useMemo(() => {
    if (!posts || !users) return [];
    const userStoryData: Record<string, { count: number; latestTimestamp: string }> = {};

    posts.forEach(post => {
      if (post.type === 'story') {
        if (!userStoryData[post.userId]) {
          userStoryData[post.userId] = { count: 0, latestTimestamp: "1970-01-01T00:00:00.000Z" };
        }
        userStoryData[post.userId].count++;
        if (new Date(post.timestamp) > new Date(userStoryData[post.userId].latestTimestamp)) {
          userStoryData[post.userId].latestTimestamp = post.timestamp;
        }
      }
    });

    const usersFound = Object.keys(userStoryData)
        .map(userId => {
            const user = users.find(u => u.id === userId);
            return user ? { 
                ...user, 
                storyCount: userStoryData[userId].count,
                latestStoryTimestamp: userStoryData[userId].latestTimestamp 
            } : null;
        })
        .filter(Boolean) as UserWithStoryCount[];
    
    return usersFound.sort((a, b) => new Date(b.latestStoryTimestamp).getTime() - new Date(a.latestStoryTimestamp).getTime());
  }, [posts, users]);


  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isStoryModalOpen && storyModalContent && storyModalContent.post.mediaMimeType?.startsWith('image/')) {
      setStoryProgress(0); 
      const duration = 7000; 
      const interval = 50; 
      const steps = duration / interval;
      let currentStep = 0;
      
      timer = setInterval(() => {
        currentStep++;
        setStoryProgress((currentStep / steps) * 100);
        if (currentStep >= steps) {
          clearInterval(timer);
          
        }
      }, interval);
    }
    return () => clearInterval(timer);
  }, [isStoryModalOpen, storyModalContent]);


  const handleLikePost = (postId: string) => {
    if (!currentUserId) return;
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const likes = post.likes.includes(currentUserId)
            ? post.likes.filter(uid => uid !== currentUserId)
            : [...post.likes, currentUserId];
          return { ...post, likes };
        }
        return post;
      })
    );
  };

  const handleAddComment = (postId: string, text: string) => {
    if (!currentUserId) return;
    const newComment: CommentType = {
      id: `comment-${Date.now()}`,
      postId,
      userId: currentUserId,
      text,
      timestamp: new Date().toISOString(),
      replies: [],
    };
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      )
    );
    toast({ title: "Komentar Ditambahkan", description: "Komentar Anda telah diposting."});
  };

  const handleUpdatePostCaption = (postId: string, newCaption: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, caption: newCaption } : post
      )
    );
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  const handleToggleSavePost = (postId: string) => {
    if (!currentUserId) return;
    let toastInfoParcel: { title: string; description: string } | null = null;
  
    setUsers(prevUsers => {
      const newUsers = prevUsers.map(user => {
        if (user.id === currentUserId) {
          const currentSavedPosts = user.savedPosts || [];
          const isSaved = currentSavedPosts.includes(postId);
          const newSavedPosts = isSaved
            ? currentSavedPosts.filter(id => id !== postId)
            : [...currentSavedPosts, postId];
          
          if (isSaved) {
            toastInfoParcel = { title: "Postingan Dihapus", description: "Postingan telah dihapus dari daftar simpanan Anda." };
          } else {
            toastInfoParcel = { title: "Postingan Disimpan", description: "Postingan telah ditambahkan ke daftar simpanan Anda." };
          }
          return { ...user, savedPosts: newSavedPosts };
        }
        return user;
      });
      return newUsers;
    });
  
    if (toastInfoParcel) {
      toast(toastInfoParcel);
    }
  };

  const currentUser = useMemo(() => {
    return users.find(u => u.id === currentUserId);
  }, [users, currentUserId]);

  const handleStoryAvatarClick = (userId: string) => {
    const userWithStoryCount = usersWithStories.find(u => u.id === userId);
    if (!userWithStoryCount) return;
  
    const userStories = posts
      .filter(p => p.userId === userId && p.type === 'story')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (userStories.length > 0) {
      setStoryModalContent({ user: userWithStoryCount, post: userStories[0], storyCount: userWithStoryCount.storyCount });
      setIsStoryModalOpen(true);
    } else {
      toast({ title: "Tidak ada cerita", description: "Tidak ada cerita aktif dari pengguna ini untuk ditampilkan.", variant: "default" });
    }
  };


  if (authStatus === 'loading') {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-headline text-muted-foreground">Memuat Beranda...</p>
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

  const sortedPosts = [...posts.filter(p => p.type !== 'story')].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {usersWithStories.length > 0 && <StoryAvatarReel usersWithStories={usersWithStories} onAvatarClick={handleStoryAvatarClick} />}
      
      <h1 className="font-headline text-3xl text-foreground mb-8 text-center mt-6">Beranda Anda</h1>
      {sortedPosts.length > 0 ? (
        <div className="space-y-8">
          {sortedPosts.map(post => {
            const isSavedByCurrentUser = (currentUser?.savedPosts || []).includes(post.id);
            return (
              <PostCard 
                key={post.id} 
                post={post} 
                onLikePost={handleLikePost}
                onAddComment={handleAddComment}
                onUpdatePostCaption={handleUpdatePostCaption}
                onDeletePost={handleDeletePost}
                onToggleSavePost={handleToggleSavePost}
                isSavedByCurrentUser={isSavedByCurrentUser}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground text-lg">Belum ada postingan di beranda. Unggah konten Anda sendiri atau ikuti pengguna lain!</p>
          <Button onClick={() => router.push('/upload')} className="mt-4">Unggah Postingan</Button>
        </div>
      )}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rounded-full p-3 h-auto shadow-lg"
          variant="default" 
          size="icon"
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      )}

      <Dialog open={isStoryModalOpen} onOpenChange={setIsStoryModalOpen}>
        <DialogContent className="p-0 bg-black text-white w-full h-full sm:max-w-sm sm:h-auto sm:aspect-[9/16] sm:rounded-lg flex flex-col items-center justify-center overflow-hidden">
          {storyModalContent && (
            <div className="relative w-full h-full">
              <DialogHeader className="absolute top-0 left-0 right-0 px-3 pt-4 pb-3 z-10 bg-gradient-to-b from-black/60 to-transparent">
                 <DialogTitle className="sr-only">
                  Cerita oleh {storyModalContent.user.username}
                </DialogTitle>
                
                {storyModalContent.storyCount > 0 && (
                  <div className="flex space-x-1 mb-2 h-1">
                    {Array.from({ length: storyModalContent.storyCount }).map((_, index) => (
                      <div key={index} className="flex-1 bg-white/30 rounded-full overflow-hidden">
                        {index === 0 && storyModalContent.post.mediaMimeType?.startsWith('image/') && ( 
                           <div className="h-full bg-white rounded-full" style={{ width: `${storyProgress}%`, transition: 'width 0.05s linear' }}></div>
                        )}
                        {index === 0 && storyModalContent.post.mediaMimeType?.startsWith('video/') && (
                           <div className="h-full bg-white rounded-full w-full"></div> 
                        )}
                        
                         {index !== 0 && (
                           <div className="h-full bg-transparent rounded-full w-full"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7 border-2 border-white">
                    <AvatarImage src={storyModalContent.user.avatarUrl} alt={storyModalContent.user.username} />
                    <AvatarFallback className="bg-black/50 text-white">{storyModalContent.user.username.substring(0,1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-xs">{storyModalContent.user.username}</span>
                  <span className="text-xs text-gray-300 ml-1">
                    {formatDistanceToNow(new Date(storyModalContent.post.timestamp), { addSuffix: true, locale: localeID })}
                  </span>
                </div>
              </DialogHeader>
              
              <div className="w-full h-full flex items-center justify-center">
                {storyModalContent.post.mediaMimeType?.startsWith('image/') ? (
                  <Image 
                    src={storyModalContent.post.mediaUrl} 
                    alt={storyModalContent.post.caption || 'Story image'} 
                    layout="fill" 
                    objectFit="contain"
                    className="rounded-md"
                    data-ai-hint="story content image"
                  />
                ) : storyModalContent.post.mediaMimeType?.startsWith('video/') ? (
                  <video 
                    src={storyModalContent.post.mediaUrl} 
                    controls 
                    autoPlay 
                    playsInline
                    className="w-full h-full object-contain"
                    data-ai-hint="story content video"
                  />
                ) : (
                  <p className="text-center">Format media tidak didukung.</p>
                )}
              </div>
              
              {storyModalContent.post.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-xs text-white text-center">{storyModalContent.post.caption}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

