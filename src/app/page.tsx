
"use client";

import { PostCard } from '@/components/PostCard';
import type { Post, Comment as CommentType, User, Notification } from '@/lib/types';
import { initialPosts, initialUsers, initialNotifications, getCurrentUserId } from '@/lib/data';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useEffect, useState, useMemo, useRef, Dispatch, SetStateAction, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, Send, Heart } from 'lucide-react'; // Added Heart
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { StoryAvatarReel } from '@/components/StoryAvatarReel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { formatTimestamp, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';


interface UserWithStoryCount extends User {
  storyCount: number;
  latestStoryTimestamp: string;
}

function createAndAddNotification(
  setNotifications: Dispatch<SetStateAction<Notification[]>>,
  newNotificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>
) {
  if (newNotificationData.actorUserId === newNotificationData.recipientUserId) {
    return;
  }
  const notification: Notification = {
    ...newNotificationData,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    isRead: false,
  };
  setNotifications(prev => [notification, ...prev]);
}


export default function FeedPage() {
  // Hooks are ordered: state, refs, other hooks (router, toast), memo, callback, effects
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [posts, setPosts] = useLocalStorageState<Post[]>('posts', initialPosts);
  const [users, setUsers] = useLocalStorageState<User[]>('users', initialUsers);
  const [notifications, setNotifications] = useLocalStorageState<Notification[]>('notifications', initialNotifications);
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [storyModalContent, setStoryModalContent] = useState<{ user: User; post: Post; storyCount: number } | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [currentUserStories, setCurrentUserStories] = useState<Post[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  const [storyCommentInputVisible, setStoryCommentInputVisible] = useState(false);
  const [storyCommentText, setStoryCommentText] = useState('');
  const [isStoryVideoManuallyPaused, setIsStoryVideoManuallyPaused] = useState(false);

  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Keep if used by PostCard or other components rendered here

  const SWIPE_THRESHOLD = 50;

  const currentSessionUser = useMemo(() => {
    if (!currentUserId || !users) return null;
    return users.find(u => u.id === currentUserId);
  }, [currentUserId, users]);

   const usersWithStories = useMemo(() => {
    if (!posts || !users || users.length === 0) return [];
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
    
    const CUID = currentSessionUser?.id;

    const usersFound = Object.keys(userStoryData)
        .map(userId => {
            const user = users.find(u => u.id === userId);
            if (!user) return null;
            if (user.id === CUID) return user; 
            if (user.accountType === 'public') return user;
            if (user.accountType === 'private' && CUID && currentSessionUser?.following.includes(user.id)) return user;
            return null;
        })
        .filter((user): user is User => user !== null)
        .map(user => ({
            ...user,
            storyCount: userStoryData[user.id].count,
            latestStoryTimestamp: userStoryData[user.id].latestTimestamp
        })) as UserWithStoryCount[];

    return usersFound.sort((a, b) => new Date(b.latestStoryTimestamp).getTime() - new Date(a.latestStoryTimestamp).getTime());
  }, [posts, users, currentSessionUser]);

  const feedPosts = useMemo(() => {
    if (!currentSessionUser || !users.length || !posts.length) return [];
    return posts
      .filter(post => {
        if (post.type === 'story') return false; // Exclude stories from main feed
        const author = users.find(u => u.id === post.userId);
        if (!author) return false; // Should not happen with consistent data
        if (author.accountType === 'public') return true;
        if (author.accountType === 'private' && (currentSessionUser.following.includes(author.id) || author.id === currentSessionUser.id)) {
          return true;
        }
        return false;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [posts, users, currentSessionUser]);

  const navigateStory = useCallback((direction: 'next' | 'prev') => {
    if (!storyModalContent || currentUserStories.length === 0) {
      setIsStoryModalOpen(false);
      return;
    }

    let newIndex = currentStoryIndex;
    if (direction === 'next') {
      newIndex = currentStoryIndex + 1;
    } else {
      newIndex = currentStoryIndex - 1;
    }

    if (newIndex >= 0 && newIndex < currentUserStories.length) {
      setCurrentStoryIndex(newIndex);
      setStoryModalContent(prev => {
        if (!prev) return null;
        const nextStoryData = posts.find(p => p.id === currentUserStories[newIndex].id) || currentUserStories[newIndex];
        return {
          ...prev,
          post: nextStoryData,
        };
      });
      setStoryProgress(0);
      setStoryCommentInputVisible(false);
      setStoryCommentText("");
    } else if (direction === 'next' && newIndex >= currentUserStories.length) {
      setIsStoryModalOpen(false);
    } else if (direction === 'prev' && newIndex < 0) {
      // At the beginning, do nothing
    }
  }, [currentUserStories, currentStoryIndex, storyModalContent, posts]);

  useEffect(() => {
    const id = getCurrentUserId();
    if (!id) {
      setAuthStatus('unauthenticated');
      // router.push('/login') will be called, but render cycle continues.
      // The conditional return below handles the UI for 'unauthenticated'.
    } else {
      setCurrentUserIdState(id);
      setAuthStatus('authenticated');
    }
  }, [router]); // No change needed to this useEffect's logic itself

  useEffect(() => {
    if (authStatus === 'unauthenticated' && !getCurrentUserId()) {
      router.push('/login');
    }
  }, [authStatus, router]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPosts = localStorage.getItem('posts');
      if (storedPosts === null) {
        localStorage.setItem('posts', JSON.stringify(initialPosts));
      }
      const storedUsers = localStorage.getItem('users');
      if (storedUsers === null) {
        localStorage.setItem('users', JSON.stringify(initialUsers.map(u => ({...u, accountType: 'public', pendingFollowRequests: [], sentFollowRequests: []}))));
      }
      const storedNotifications = localStorage.getItem('notifications');
      if (storedNotifications === null) {
        localStorage.setItem('notifications', JSON.stringify(initialNotifications));
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

  useEffect(() => {
    if (!isStoryModalOpen) {
      setCurrentUserStories([]);
      setCurrentStoryIndex(0);
      setStoryCommentInputVisible(false);
      setStoryCommentText("");
      setIsStoryVideoManuallyPaused(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
      }
      setStoryProgress(0);
    }
  }, [isStoryModalOpen]);


  useEffect(() => {
    let imageTimer: NodeJS.Timeout | undefined;
    if (isStoryModalOpen && storyModalContent?.post.mediaMimeType?.startsWith('image/')) {
      setStoryProgress(0);
      const duration = 7000;
      const interval = 50;
      const steps = duration / interval;
      let currentStep = 0;

      imageTimer = setInterval(() => {
        currentStep++;
        setStoryProgress((currentStep / steps) * 100);
        if (currentStep >= steps) {
          clearInterval(imageTimer!);
          imageTimer = undefined;
          navigateStory('next');
        }
      }, interval);
    }
    return () => {
      if (imageTimer) {
        clearInterval(imageTimer);
        imageTimer = undefined;
      }
    };
  }, [isStoryModalOpen, storyModalContent?.post.id, currentStoryIndex, navigateStory]);

  useEffect(() => {
    if (isStoryModalOpen && storyModalContent?.post.mediaMimeType?.startsWith('video/') && videoRef.current) {
      setIsStoryVideoManuallyPaused(false);
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // console.warn("Video story autoplay failed/blocked:", error);
        });
      }
    }
  }, [isStoryModalOpen, storyModalContent?.post.id, storyModalContent?.post.mediaUrl]);

  useEffect(() => {
    if (isStoryModalOpen && storyModalContent?.post.mediaMimeType?.startsWith('video/') && videoRef.current) {
      if (storyCommentInputVisible && isMobile) { // Only pause for mobile swipe-up input
        if (!videoRef.current.paused) {
          videoRef.current.pause();
        }
      } else {
        if (videoRef.current.paused && !isStoryVideoManuallyPaused) {
          videoRef.current.play().catch(e => console.error("Error resuming video:", e));
        }
      }
    }
  }, [storyCommentInputVisible, isStoryModalOpen, storyModalContent?.post.mediaMimeType, isStoryVideoManuallyPaused, isMobile]);

  // Helper functions (defined after all hooks)
  const handleVideoClick = () => {
    if (videoRef.current && storyModalContent?.post.mediaMimeType?.startsWith('video/')) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(e => console.error("Error playing video on tap:", e));
        setIsStoryVideoManuallyPaused(false);
      } else {
        videoRef.current.pause();
        setIsStoryVideoManuallyPaused(true);
      }
    }
  };

  const handleLikePost = (postId: string) => {
    if (!currentUserId) return;
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const isAlreadyLiked = post.likes.includes(currentUserId);
          const likes = isAlreadyLiked
            ? post.likes.filter(uid => uid !== currentUserId)
            : [...post.likes, currentUserId];

          if (!isAlreadyLiked && post.userId !== currentUserId) {
             createAndAddNotification(setNotifications, {
                recipientUserId: post.userId,
                actorUserId: currentUserId,
                type: 'like',
                postId: post.id,
                postMediaUrl: post.mediaUrl,
            });
          }
          // Ensure storyModalContent's post is updated if it's the one being liked,
          // to reflect changes immediately in the modal.
          if (storyModalContent && storyModalContent.post.id === postId) {
            setStoryModalContent(prev => prev ? { ...prev, post: { ...prev.post, likes } } : null);
          }
          return { ...post, likes };
        }
        return post;
      })
    );
  };

  const handleAddComment = (postId: string, text: string) => {
    if (!currentUserId) return;
    const newComment: CommentType = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      postId,
      userId: currentUserId,
      text,
      timestamp: new Date().toISOString(),
      parentId: null,
      replies: [],
    };
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
           const updatedPost = { ...post, comments: [...post.comments, newComment] };
            if (post.userId !== currentUserId) {
                createAndAddNotification(setNotifications, {
                    recipientUserId: post.userId,
                    actorUserId: currentUserId,
                    type: 'comment',
                    postId: post.id,
                    commentId: newComment.id,
                    postMediaUrl: post.mediaUrl,
                });
            }
          return updatedPost;
        }
        return post;
      })
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

  const handleStoryAvatarClick = (userId: string) => {
    const userWithStoryData = usersWithStories.find(u => u.id === userId);
    if (!userWithStoryData) return;

    const userAllStories = posts
      .filter(p => p.userId === userId && p.type === 'story')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (userAllStories.length > 0) {
      setCurrentUserStories(userAllStories);
      setCurrentStoryIndex(0);
      const initialStoryData = posts.find(p => p.id === userAllStories[0].id) || userAllStories[0];
      setStoryModalContent({ user: userWithStoryData, post: initialStoryData, storyCount: userAllStories.length });
      setIsStoryModalOpen(true);
      setStoryProgress(0);
      setStoryCommentInputVisible(false);
      setStoryCommentText("");
      setIsStoryVideoManuallyPaused(false);
    } else {
      toast({ title: "Tidak ada cerita", description: "Tidak ada cerita aktif dari pengguna ini untuk ditampilkan.", variant: "default" });
    }
  };

  const handleTouchStartStory = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
  };

  const handleTouchMoveStory = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null) return;
    touchCurrentY.current = e.touches[0].clientY;
  };

  const handleTouchEndStory = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null || touchCurrentY.current === null) {
      touchStartY.current = null;
      touchCurrentY.current = null;
      return;
    }

    const deltaY = touchStartY.current - touchCurrentY.current;

    if (deltaY > SWIPE_THRESHOLD) {
      setStoryCommentInputVisible(true);
    } else if (deltaY < -SWIPE_THRESHOLD && storyCommentInputVisible) {
      setStoryCommentInputVisible(false);
    }

    touchStartY.current = null;
    touchCurrentY.current = null;
  };

  const handlePostStoryComment = () => {
    if (!storyCommentText.trim() || !storyModalContent || !currentUserId) return;
    // Ensure we are using the latest post data for comment association
    const currentPostInModal = posts.find(p => p.id === storyModalContent.post.id) || storyModalContent.post;
    handleAddComment(currentPostInModal.id, storyCommentText.trim());

    setStoryCommentText('');
    if (isMobile) { // Only hide mobile input on submit
      setStoryCommentInputVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToReelFeed = (postId: string) => {
    router.push('/reels');
  };

  // Conditional returns after all hooks are defined
  if (authStatus === 'loading') {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-headline text-muted-foreground">Memuat Beranda...</p>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    // useEffect above handles router.push. This is a fallback UI.
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-headline text-muted-foreground">Mengalihkan ke halaman masuk...</p>
      </div>
    );
  }

  // Main component render if authenticated
  return (
    <div className="w-full max-w-2xl mx-auto">
      {usersWithStories.length > 0 && <StoryAvatarReel usersWithStories={usersWithStories} onAvatarClick={handleStoryAvatarClick} />}
            {feedPosts.length > 0 ? (
        <div className="space-y-4">
          {feedPosts.map(post => {
            const isSavedByCurrentUser = (currentSessionUser?.savedPosts || []).includes(post.id);
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
                onReelClick={post.type === 'reel' ? handleNavigateToReelFeed : undefined}
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
          className="fixed bottom-20 right-6 rounded-full p-3 h-auto shadow-lg sm:bottom-6"
          variant="default"
          size="icon"
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      )}

      <Dialog open={isStoryModalOpen} onOpenChange={setIsStoryModalOpen}>
        <DialogContent
          className={cn(
            "p-0 bg-black text-white flex flex-col items-center justify-center overflow-hidden",
            "max-w-sm w-full h-auto max-h-[90vh] aspect-[9/16] rounded-lg"
          )}
        >
          {storyModalContent && currentUserStories.length > 0 && (
            (() => {
              const currentPostInModal = posts.find(p => p.id === storyModalContent.post.id) || storyModalContent.post;
              const userForStory = users.find(u => u.id === currentPostInModal.userId) || storyModalContent.user;

              return (
                <div
                  className="relative w-full h-full"
                  onTouchStart={isMobile ? handleTouchStartStory : undefined}
                  onTouchMove={isMobile ? handleTouchMoveStory : undefined}
                  onTouchEnd={isMobile ? handleTouchEndStory : undefined}
                >
                  <DialogHeader className="absolute top-0 left-0 right-0 px-3 pt-4 pb-3 z-20 bg-gradient-to-b from-black/60 to-transparent">
                    <DialogTitle className="sr-only">
                      Cerita oleh {userForStory.username}
                    </DialogTitle>

                    {currentUserStories.length > 0 && (
                      <div className="flex space-x-1 mb-2 h-1 w-full">
                        {currentUserStories.map((story, index) => (
                          <div key={story.id} className="flex-1 bg-white/30 rounded-full overflow-hidden">
                            {index === currentStoryIndex && currentPostInModal.mediaMimeType?.startsWith('image/') && (
                              <div className="h-full bg-white rounded-full" style={{ width: `${storyProgress}%` }}></div>
                            )}
                            {index === currentStoryIndex && currentPostInModal.mediaMimeType?.startsWith('video/') && (
                              <div className="h-full bg-white rounded-full w-full"></div>
                            )}
                            {index < currentStoryIndex && (
                              <div className="h-full bg-white rounded-full w-full opacity-80"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 border-2 border-white">
                        <AvatarImage src={userForStory.avatarUrl} alt={userForStory.username} />
                        <AvatarFallback className="bg-black/50 text-white">{userForStory.username.substring(0,1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-xs">{userForStory.username}</span>
                      <span className="text-xs text-gray-300 ml-1">
                        {formatTimestamp(currentPostInModal.timestamp)}
                      </span>
                    </div>
                  </DialogHeader>

                  <div className="w-full h-full flex items-center justify-center relative">
                    <div
                      className="absolute left-0 top-0 h-full w-1/3 z-10 cursor-pointer"
                      onClick={() => navigateStory('prev')}
                      role="button"
                      aria-label="Cerita Sebelumnya"
                    />
                    <div
                      className="absolute right-0 top-0 h-full w-1/3 z-10 cursor-pointer"
                      onClick={() => navigateStory('next')}
                      role="button"
                      aria-label="Cerita Berikutnya"
                    />

                    {currentPostInModal.mediaMimeType?.startsWith('image/') ? (
                      <Image
                        key={currentPostInModal.id}
                        src={currentPostInModal.mediaUrl}
                        alt={currentPostInModal.caption || 'Story image'}
                        layout="fill"
                        objectFit="contain"
                        className="rounded-md"
                        data-ai-hint="story content image"
                      />
                    ) : currentPostInModal.mediaMimeType?.startsWith('video/') ? (
                      <video
                        key={currentPostInModal.id}
                        ref={videoRef}
                        src={currentPostInModal.mediaUrl}
                        playsInline
                        className="w-full h-full object-contain"
                        data-ai-hint="story content video"
                        onEnded={() => navigateStory('next')}
                        onClick={handleVideoClick}
                      />
                    ) : (
                      <p className="text-center">Format media tidak didukung.</p>
                    )}

                    {/* Like Button for Story */}
                    {currentUserId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); 
                          handleLikePost(currentPostInModal.id);
                        }}
                        className="absolute bottom-16 right-4 z-30 flex flex-col items-center text-white p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors active:scale-95"
                        aria-label="Sukai cerita"
                      >
                        <Heart
                          className={cn(
                            "h-6 w-6 transition-colors duration-150 ease-in-out",
                            currentPostInModal.likes.includes(currentUserId) && "fill-red-500 text-red-500"
                          )}
                        />
                        <span className="text-xs font-medium mt-1">
                          {currentPostInModal.likes.length > 0 ? currentPostInModal.likes.length : ''}
                        </span>
                      </button>
                    )}
                  </div>
                  
                  {/* Desktop Comment Input */}
                  {!isMobile && isStoryModalOpen && storyModalContent && currentSessionUser && (
                    <div className="absolute bottom-3 left-3 right-3 p-0 z-30 flex items-center gap-2">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage src={currentSessionUser.avatarUrl} alt={currentSessionUser.username} data-ai-hint="user avatar story comment desktop"/>
                        <AvatarFallback>{currentSessionUser.username.substring(0,1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <Textarea
                        placeholder={`Balas cerita ${storyModalContent.user.username}...`}
                        value={storyCommentText}
                        onChange={(e) => setStoryCommentText(e.target.value)}
                        className="text-sm min-h-[40px] max-h-[100px] flex-grow resize-none bg-black/50 text-white placeholder:text-gray-300 border-gray-600 focus:border-white rounded-full px-4 py-2"
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handlePostStoryComment();
                          }
                        }}
                      />
                      <Button size="icon" onClick={handlePostStoryComment} disabled={!storyCommentText.trim()} className="h-9 w-9 bg-primary hover:bg-primary/80 rounded-full flex-shrink-0">
                        <Send className="h-4 w-4"/>
                      </Button>
                    </div>
                  )}

                  {/* Caption */}
                  {currentPostInModal.caption && (
                    (!isMobile || !storyCommentInputVisible) && ( // Hide if mobile comment input is visible
                      <div className={cn(
                        "absolute left-0 right-0 p-3 z-20 bg-gradient-to-t from-black/50 to-transparent text-center",
                        !isMobile && currentSessionUser ? "bottom-16" : "bottom-0" // Position above desktop comment bar if present
                      )}>
                        <p className="text-xs text-white">{currentPostInModal.caption}</p>
                      </div>
                    )
                  )}
                </div>
              )
            })()
          )}
          {/* Mobile Comment Input (Swipe-up) */}
          {isMobile && isStoryModalOpen && storyModalContent && storyCommentInputVisible && currentSessionUser && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-background/80 backdrop-blur-sm z-30 flex items-start gap-2 sm:hidden">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarImage src={currentSessionUser.avatarUrl} alt={currentSessionUser.username} data-ai-hint="user avatar small" />
                <AvatarFallback>{currentSessionUser.username.substring(0,1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <Textarea
                placeholder={`Balas cerita ${storyModalContent?.user.username}...`}
                value={storyCommentText}
                onChange={(e) => setStoryCommentText(e.target.value)}
                className="text-sm min-h-[40px] flex-grow resize-none bg-white/20 text-white placeholder:text-gray-300 border-gray-400 focus:border-white"
                rows={1}
              />
              <Button size="icon" onClick={handlePostStoryComment} disabled={!storyCommentText.trim()} className="h-10 w-10 bg-primary hover:bg-primary/80">
                <Send className="h-4 w-4"/>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

