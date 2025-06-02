
"use client";

import { PostCard } from '@/components/PostCard';
import type { Post, Comment as CommentType, User, Notification } from '@/lib/types';
import { initialPosts, initialUsers, initialNotifications, getCurrentUserId } from '@/lib/data';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useEffect, useState, useMemo, useRef, Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { StoryAvatarReel } from '@/components/StoryAvatarReel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { formatTimestamp } from '@/lib/utils';


interface UserWithStoryCount extends User {
  storyCount: number;
  latestStoryTimestamp: string;
}

// Helper function for creating notifications
function createAndAddNotification(
  setNotifications: Dispatch<SetStateAction<Notification[]>>,
  newNotificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>
) {
  if (newNotificationData.actorUserId === newNotificationData.recipientUserId) {
    return; // Don't notify self
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
  const router = useRouter();
  const { toast } = useToast();
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

  // For story comment swipe and video control
  const [storyCommentInputVisible, setStoryCommentInputVisible] = useState(false);
  const [storyCommentText, setStoryCommentText] = useState('');
  const touchStartY = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50; // pixels
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStoryVideoManuallyPaused, setIsStoryVideoManuallyPaused] = useState(false);


  const currentSessionUser = useMemo(() => {
    if (!currentUserId || !users) return null;
    return users.find(u => u.id === currentUserId);
  }, [currentUserId, users]);


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


  const navigateStory = (direction: 'next' | 'prev') => {
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
        return {
          ...prev,
          post: currentUserStories[newIndex],
        };
      });
      setStoryProgress(0); 
      setStoryCommentInputVisible(false); 
      setStoryCommentText("");
      // setIsStoryVideoManuallyPaused(false); // Handled by specific video effect
    } else if (direction === 'next' && newIndex >= currentUserStories.length) {
      setIsStoryModalOpen(false); 
    } else if (direction === 'prev' && newIndex < 0) {
      // At the beginning, do nothing
    }
  };
  
  // Effect to reset states when story modal closes or user changes
  useEffect(() => {
    if (!isStoryModalOpen) {
      setCurrentUserStories([]);
      setCurrentStoryIndex(0);
      setStoryCommentInputVisible(false); 
      setStoryCommentText(""); 
      setIsStoryVideoManuallyPaused(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = ""; // Clear src to stop loading/buffering
      }
    }
  }, [isStoryModalOpen]);


  // Effect for Image Story Progress Timer
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
          navigateStory('next');
        }
      }, interval);
    }
    return () => {
      if (imageTimer) clearInterval(imageTimer);
    };
  }, [isStoryModalOpen, storyModalContent?.post.id, currentStoryIndex]); // storyModalContent.post.id ensures it reruns for new image

  // Effect for Video Story Autoplay/Reset on Story Change
  useEffect(() => {
    if (isStoryModalOpen && storyModalContent?.post.mediaMimeType?.startsWith('video/') && videoRef.current) {
      setIsStoryVideoManuallyPaused(false); // Reset manual pause for a new story
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // console.warn("Video story autoplay failed/blocked:", error);
        });
      }
    }
  }, [isStoryModalOpen, storyModalContent?.post.id, storyModalContent?.post.mediaUrl]); // Key dependencies for new video

  // Effect to Pause/Resume Video based on storyCommentInputVisible
  useEffect(() => {
    if (isStoryModalOpen && storyModalContent?.post.mediaMimeType?.startsWith('video/') && videoRef.current) {
      if (storyCommentInputVisible) {
        if (!videoRef.current.paused) {
          videoRef.current.pause();
        }
      } else {
        // Comment input is hidden. Resume video ONLY IF it wasn't manually paused by the user.
        if (videoRef.current.paused && !isStoryVideoManuallyPaused) {
          videoRef.current.play().catch(e => console.error("Error resuming video:", e));
        }
      }
    }
  }, [storyCommentInputVisible, isStoryModalOpen, storyModalContent?.post.mediaMimeType, isStoryVideoManuallyPaused]);


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

  const currentUser = useMemo(() => {
    return users.find(u => u.id === currentUserId);
  }, [users, currentUserId]);

  const handleStoryAvatarClick = (userId: string) => {
    const userWithStoryData = usersWithStories.find(u => u.id === userId);
    if (!userWithStoryData) return;
  
    const userAllStories = posts
      .filter(p => p.userId === userId && p.type === 'story')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); 
    
    if (userAllStories.length > 0) {
      setCurrentUserStories(userAllStories);
      setCurrentStoryIndex(0);
      setStoryModalContent({ user: userWithStoryData, post: userAllStories[0], storyCount: userAllStories.length });
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
    if (storyModalContent?.post.mediaMimeType?.startsWith('image/')) { // Only for images now, video tap handled by onClick
      touchStartY.current = e.touches[0].clientY;
      touchCurrentY.current = e.touches[0].clientY; 
    }
  };

  const handleTouchMoveStory = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null || !storyModalContent?.post.mediaMimeType?.startsWith('image/')) return;
    touchCurrentY.current = e.touches[0].clientY;
  };

  const handleTouchEndStory = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null || touchCurrentY.current === null || !storyModalContent?.post.mediaMimeType?.startsWith('image/')) {
      touchStartY.current = null;
      touchCurrentY.current = null;
      return;
    }

    const deltaY = touchStartY.current - touchCurrentY.current;

    if (deltaY > SWIPE_THRESHOLD) { // Swiped up
      setStoryCommentInputVisible(true);
    }

    touchStartY.current = null;
    touchCurrentY.current = null;
  };

  const handlePostStoryComment = () => {
    if (!storyCommentText.trim() || !storyModalContent || !currentUserId) return;
    
    handleAddComment(storyModalContent.post.id, storyCommentText.trim());
    
    setStoryCommentText('');
    setStoryCommentInputVisible(false);
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
          {storyModalContent && currentUserStories.length > 0 && (
            <div
              className="relative w-full h-full"
              onTouchStart={handleTouchStartStory} // Only for images now
              onTouchMove={handleTouchMoveStory}   // Only for images now
              onTouchEnd={handleTouchEndStory}     // Only for images now
            >
              <DialogHeader className="absolute top-0 left-0 right-0 px-3 pt-4 pb-3 z-20 bg-gradient-to-b from-black/60 to-transparent">
                 <DialogTitle className="sr-only">
                  Cerita oleh {storyModalContent.user.username}
                </DialogTitle>
                
                {currentUserStories.length > 0 && (
                  <div className="flex space-x-1 mb-2 h-1 w-full">
                    {currentUserStories.map((_, index) => (
                      <div key={index} className="flex-1 bg-white/30 rounded-full overflow-hidden">
                        {index === currentStoryIndex && storyModalContent.post.mediaMimeType?.startsWith('image/') && ( 
                           <div className="h-full bg-white rounded-full" style={{ width: `${storyProgress}%`, transition: 'width 0.05s linear' }}></div>
                        )}
                        {index === currentStoryIndex && storyModalContent.post.mediaMimeType?.startsWith('video/') && (
                           // Video progress can be handled by the video element's own UI if controls are shown, or custom if needed
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
                    <AvatarImage src={storyModalContent.user.avatarUrl} alt={storyModalContent.user.username} />
                    <AvatarFallback className="bg-black/50 text-white">{storyModalContent.user.username.substring(0,1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-xs">{storyModalContent.user.username}</span>
                  <span className="text-xs text-gray-300 ml-1">
                    {formatTimestamp(storyModalContent.post.timestamp)}
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

                {storyModalContent.post.mediaMimeType?.startsWith('image/') ? (
                  <Image 
                    key={storyModalContent.post.id}
                    src={storyModalContent.post.mediaUrl} 
                    alt={storyModalContent.post.caption || 'Story image'} 
                    layout="fill" 
                    objectFit="contain"
                    className="rounded-md"
                    data-ai-hint="story content image"
                  />
                ) : storyModalContent.post.mediaMimeType?.startsWith('video/') ? (
                  <video 
                    key={storyModalContent.post.id} // Key is important for re-mounting on story change
                    ref={videoRef}
                    src={storyModalContent.post.mediaUrl} // Src is directly set
                    playsInline // Important for mobile
                    className="w-full h-full object-contain"
                    data-ai-hint="story content video"
                    onEnded={() => navigateStory('next')} 
                    onClick={handleVideoClick} // For tap to play/pause
                    // controls // Remove default controls, we manage them
                    // autoPlay // Remove autoplay, manage programmatically
                  />
                ) : (
                  <p className="text-center">Format media tidak didukung.</p>
                )}
              </div>
              
              {storyModalContent.post.caption && !storyCommentInputVisible && (
                <div className="absolute bottom-0 left-0 right-0 p-3 z-20 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-xs text-white text-center">{storyModalContent.post.caption}</p>
                </div>
              )}
            </div>
          )}
          {isStoryModalOpen && storyModalContent && storyCommentInputVisible && currentSessionUser && ( // Show comment input for both image and video
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-background/80 backdrop-blur-sm z-30 sm:hidden flex items-start gap-2">
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

