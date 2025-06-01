"use client";

import { PostCard } from '@/components/PostCard';
import type { Post, Comment as CommentType, User } from '@/lib/types';
import { initialPosts, initialUsers, getCurrentUserId } from '@/lib/data';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';

export default function FeedPage() {
  const [posts, setPosts] = useLocalStorageState<Post[]>('posts', initialPosts);
  const [users, setUsers] = useLocalStorageState<User[]>('users', initialUsers); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    // Ensure localStorage is only accessed on the client
    if (typeof window !== 'undefined') {
      const storedPosts = localStorage.getItem('posts');
      if (!storedPosts) {
        localStorage.setItem('posts', JSON.stringify(initialPosts));
      }
      const storedUsers = localStorage.getItem('users');
      if(!storedUsers) {
        localStorage.setItem('users', JSON.stringify(initialUsers));
      }
      setCurrentUserIdState(getCurrentUserId());
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
    };
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      )
    );
  };

  const sortedPosts = [...posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h1 className="font-headline text-3xl text-foreground mb-8 text-center">Your Feed</h1>
      {sortedPosts.length > 0 ? (
        <div className="space-y-8">
          {sortedPosts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onLikePost={handleLikePost}
              onAddComment={handleAddComment}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground text-lg">No posts yet. Follow some users or upload your own content!</p>
        </div>
      )}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rounded-full p-3 h-auto shadow-lg"
          variant="primary"
          size="icon"
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
