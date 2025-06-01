
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

export default function FeedPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useLocalStorageState<Post[]>('posts', initialPosts);
  const [users, setUsers] = useLocalStorageState<User[]>('users', initialUsers); 
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [showScrollTop, setShowScrollTop] = useState(false);

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
    setUsers(prevUsers => {
      return prevUsers.map(user => {
        if (user.id === currentUserId) {
          const currentSavedPosts = user.savedPosts || [];
          const isSaved = currentSavedPosts.includes(postId);
          const newSavedPosts = isSaved
            ? currentSavedPosts.filter(id => id !== postId)
            : [...currentSavedPosts, postId];
          if (isSaved) {
            toast({ title: "Postingan Dihapus", description: "Postingan telah dihapus dari daftar simpanan Anda." });
          } else {
            toast({ title: "Postingan Disimpan", description: "Postingan telah ditambahkan ke daftar simpanan Anda." });
          }
          return { ...user, savedPosts: newSavedPosts };
        }
        return user;
      });
    });
  };

  const currentUser = useMemo(() => {
    return users.find(u => u.id === currentUserId);
  }, [users, currentUserId]);


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

  const sortedPosts = [...posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="font-headline text-3xl text-foreground mb-8 text-center">Beranda Anda</h1>
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
          <p className="text-muted-foreground text-lg">Belum ada postingan. Ikuti beberapa pengguna atau unggah konten Anda sendiri!</p>
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
    </div>
  );
}
