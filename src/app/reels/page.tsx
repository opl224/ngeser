
"use client";

import { useEffect, useState, useMemo, Dispatch, SetStateAction, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Post, User, Comment as CommentType, Notification } from '@/lib/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { initialPosts, initialUsers, initialNotifications, getCurrentUserId } from '@/lib/data';
import { ReelCard } from '@/components/ReelCard';
import { Loader2, VideoOff, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

function findComment(comments: CommentType[], targetId: string): CommentType | null {
  for (const comment of comments) {
    if (comment.id === targetId) return comment;
    if (comment.replies && comment.replies.length > 0) {
      const foundInReplies = findComment(comment.replies, targetId);
      if (foundInReplies) return foundInReplies;
    }
  }
  return null;
}

function getRootParentId(allRootComments: CommentType[], commentIdToFindRootFor: string): string {
  let safety = 0;
  const maxDepth = 100; 

  let currentComment = findComment(allRootComments, commentIdToFindRootFor);

  if (!currentComment) {
    return commentIdToFindRootFor;
  }

  if (currentComment.parentId === null) {
    return currentComment.id;
  }
  
  let rootCandidateId = currentComment.parentId; 
  
  while(safety < maxDepth) {
    const parentOfCandidate = findComment(allRootComments, rootCandidateId);
    if (!parentOfCandidate || parentOfCandidate.parentId === null) {
      break;
    }
    rootCandidateId = parentOfCandidate.parentId;
    safety++;
  }
  return rootCandidateId;
}

const addReplyToRootComment = (rootComments: CommentType[], rootCommentId: string, newReply: CommentType): CommentType[] => {
  return rootComments.map(comment => {
    if (comment.id === rootCommentId) {
      return { ...comment, replies: [...(comment.replies || []), newReply] };
    }
    return comment;
  });
};


export default function ReelsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [allPosts, setAllPosts] = useLocalStorageState<Post[]>('posts', initialPosts);
  const [allUsers, setAllUsers] = useLocalStorageState<User[]>('users', initialUsers);
  const [notifications, setNotifications] = useLocalStorageState<Notification[]>('notifications', initialNotifications);
  
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const reelRefs = useMemo(() => new Map<string, HTMLDivElement>(), []);


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
  
  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    return allUsers.find(u => u.id === currentUserId);
  }, [currentUserId, allUsers]);

  const reels = useMemo(() => {
    if (!currentUser || !allUsers.length || !allPosts.length) return [];
    return allPosts
      .filter(post => {
        if (post.type !== 'reel') return false;
        const author = allUsers.find(u => u.id === post.userId);
        if (!author) return false;
        if (author.accountType === 'public') return true;
        if (author.accountType === 'private' && ((currentUser.following || []).includes(author.id) || author.id === currentUser.id)) {
          return true;
        }
        return false;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [allPosts, allUsers, currentUser]);


  const handleLikeReel = useCallback((postId: string) => {
    if (!currentUserId) return;
    setAllPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const isAlreadyLiked = post.likes.includes(currentUserId);
          const newLikes = isAlreadyLiked
            ? post.likes.filter(uid => uid !== currentUserId)
            : [...new Set([...post.likes, currentUserId])];
          
          if (!isAlreadyLiked && post.userId !== currentUserId) {
             createAndAddNotification(setNotifications, {
                recipientUserId: post.userId,
                actorUserId: currentUserId,
                type: 'like',
                postId: post.id,
                postMediaUrl: post.mediaUrl,
            });
          }
          return { ...post, likes: newLikes };
        }
        return post;
      })
    );
  }, [currentUserId, setAllPosts, setNotifications]);

  const handleAddCommentToReel = useCallback((postId: string, text: string, replyToCommentId?: string) => {
    if (!currentUserId || !text.trim()) return;
    
    const newComment: CommentType = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      postId,
      userId: currentUserId,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      parentId: null, 
      replies: [], 
    };

    setAllPosts(prevPosts => 
      prevPosts.map(p => {
        if (p.id === postId) {
          let updatedComments;
          if (replyToCommentId) { 
            const structuralParentId = getRootParentId(p.comments, replyToCommentId);
            newComment.parentId = structuralParentId; 
            updatedComments = addReplyToRootComment(p.comments, structuralParentId, newComment);
            
            if (p.userId !== currentUserId) {
              createAndAddNotification(setNotifications, {
                recipientUserId: p.userId,
                actorUserId: currentUserId,
                type: 'comment', 
                postId: p.id,
                commentId: newComment.id,
                postMediaUrl: p.mediaUrl,
              });
            }
            const directlyRepliedToComment = findComment(p.comments, replyToCommentId);
            if (directlyRepliedToComment && directlyRepliedToComment.userId !== currentUserId && directlyRepliedToComment.userId !== p.userId) {
              createAndAddNotification(setNotifications, {
                recipientUserId: directlyRepliedToComment.userId,
                actorUserId: currentUserId,
                type: 'reply',
                postId: p.id,
                commentId: replyToCommentId, 
                postMediaUrl: p.mediaUrl,
              });
            }
          } else { 
            newComment.parentId = null;
            updatedComments = [...p.comments, newComment];
            if (p.userId !== currentUserId) {
                createAndAddNotification(setNotifications, {
                    recipientUserId: p.userId,
                    actorUserId: currentUserId,
                    type: 'comment',
                    postId: p.id,
                    commentId: newComment.id, 
                    postMediaUrl: p.mediaUrl,
                });
            }
          }
          return { ...p, comments: updatedComments };
        }
        return p;
      })
    );
    toast({ title: "Komentar Ditambahkan", description: "Komentar Anda telah diposting."});
  }, [currentUserId, setAllPosts, setNotifications, toast]);

  const handleDeleteReel = useCallback((postId: string) => {
    setAllPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    toast({ title: "Reel Dihapus", description: "Reel telah berhasil dihapus.", variant: "destructive"});
    if (activeReelIndex >= reels.length - 1 && reels.length > 1) {
        setActiveReelIndex(reels.length - 2);
    } else if (reels.length === 1) { 
        setActiveReelIndex(0);
    }
  }, [setAllPosts, toast, activeReelIndex, reels.length]);

  const handleEditReelCaption = useCallback((postId: string, newCaption: string) => {
    setAllPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, caption: newCaption } : post
      )
    );
    toast({ title: "Keterangan Diperbarui", description: "Keterangan reel telah diperbarui."});
  }, [setAllPosts, toast]);

  const handleToggleSaveReel = useCallback((postId: string) => {
    if (!currentUserId || !currentUser) return;
    let toastInfoParcel: { title: string; description: string } | null = null;

    setAllUsers(prevUsers => {
      const newUsers = prevUsers.map(user => {
        if (user.id === currentUserId) {
          const currentSavedPosts = user.savedPosts || [];
          const isSaved = currentSavedPosts.includes(postId);
          const newSavedPosts = isSaved
            ? currentSavedPosts.filter(id => id !== postId)
            : [...new Set([...currentSavedPosts, postId])];

          if (isSaved) {
            toastInfoParcel = { title: "Reel Dihapus dari Simpanan", description: "Reel telah dihapus dari daftar simpanan Anda." };
          } else {
            toastInfoParcel = { title: "Reel Disimpan", description: "Reel telah ditambahkan ke daftar simpanan Anda." };
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
  }, [currentUserId, currentUser, setAllUsers, toast]);

  const handleFollowToggleReelAuthor = useCallback((authorId: string) => {
    if (!currentUserId || !currentUser || authorId === currentUserId) return;
    const authorUser = allUsers.find(u => u.id === authorId);
    if (!authorUser) return;

    const isCurrentlyFollowing = (currentUser.following || []).includes(authorId);
    const hasSentRequest = (currentUser.sentFollowRequests || []).includes(authorId);

    if (authorUser.accountType === 'public') {
        setAllUsers(prevUsers => prevUsers.map(u => {
            if (u.id === currentUserId) return { ...u, following: isCurrentlyFollowing ? (u.following || []).filter(id => id !== authorId) : [...new Set([...(u.following || []), authorId])] };
            if (u.id === authorId) return { ...u, followers: isCurrentlyFollowing ? (u.followers || []).filter(id => id !== currentUserId) : [...new Set([...(u.followers || []), currentUserId])] };
            return u;
        }));
        if (isCurrentlyFollowing) {
            toast({ title: "Berhenti Mengikuti", description: `Anda tidak lagi mengikuti ${authorUser.username}.` });
        } else {
            toast({ title: "Mulai Mengikuti", description: `Anda sekarang mengikuti ${authorUser.username}.` });
            createAndAddNotification(setNotifications, { recipientUserId: authorId, actorUserId: currentUserId, type: 'follow' });
        }
    } else { // Private account
        if (isCurrentlyFollowing) { // Unfollow
            setAllUsers(prevUsers => prevUsers.map(u => {
                if (u.id === currentUserId) return { ...u, following: (u.following || []).filter(id => id !== authorId) };
                if (u.id === authorId) return { ...u, followers: (u.followers || []).filter(id => id !== currentUserId) };
                return u;
            }));
            toast({ title: "Berhenti Mengikuti", description: `Anda tidak lagi mengikuti ${authorUser.username}.` });
        } else if (hasSentRequest) { // Cancel request
            setAllUsers(prevUsers => prevUsers.map(u => {
                if (u.id === currentUserId) return { ...u, sentFollowRequests: (u.sentFollowRequests || []).filter(id => id !== authorId) };
                if (u.id === authorId) return { ...u, pendingFollowRequests: (u.pendingFollowRequests || []).filter(id => id !== currentUserId) };
                return u;
            }));
            toast({ title: "Permintaan Dibatalkan" });
        } else { // Send request
            setAllUsers(prevUsers => prevUsers.map(u => {
                if (u.id === currentUserId) return { ...u, sentFollowRequests: [...new Set([...(u.sentFollowRequests || []), authorId])] };
                if (u.id === authorId) return { ...u, pendingFollowRequests: [...new Set([...(u.pendingFollowRequests || []), currentUserId])] };
                return u;
            }));
            toast({ title: "Permintaan Terkirim" });
            createAndAddNotification(setNotifications, { recipientUserId: authorId, actorUserId: currentUserId, type: 'follow_request' });
        }
    }
  }, [currentUserId, currentUser, allUsers, setAllUsers, setNotifications, toast]);


  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = reels.findIndex(r => r.id === entry.target.id);
            if (index !== -1) {
              setActiveReelIndex(index);
            }
          }
        });
      },
      { threshold: 0.7 } 
    );

    const currentRefs = Array.from(reelRefs.values());
    currentRefs.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => {
      currentRefs.forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [reels, reelRefs]);


  if (authStatus === 'loading' || !currentUser) {
    return (
      <div className="flex flex-col justify-center items-center h-dvh bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-headline text-muted-foreground">Memuat Reels...</p>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="flex flex-col justify-center items-center h-dvh bg-black">
        <p className="text-xl font-headline text-muted-foreground">Silakan masuk untuk melihat Reels.</p>
         <Button onClick={() => router.push('/login')} className="mt-4">Masuk</Button>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-dvh bg-black text-center p-4">
        <VideoOff className="h-20 w-20 text-muted-foreground mb-6" />
        <h2 className="text-2xl font-headline text-white mb-2">Tidak Ada Reels</h2>
        <p className="text-muted-foreground mb-6">Belum ada video reels untuk ditampilkan.</p>
        <Button onClick={() => router.push('/upload')} variant="outline">Unggah Reel Pertama Anda</Button>
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-y-scroll snap-y snap-mandatory bg-black relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-20 text-white bg-black/30 hover:bg-black/50 hover:text-white"
        aria-label="Kembali"
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>
      {reels.map((reel, index) => {
        const author = allUsers.find(u => u.id === reel.userId);
        const isSaved = (currentUser?.savedPosts || []).includes(reel.id);
        const isFollowingAuthor = (currentUser?.following || []).includes(reel.userId);
        const hasSentRequestToAuthor = (currentUser?.sentFollowRequests || []).includes(reel.userId);
        return (
          <div
            key={reel.id}
            id={reel.id} 
            ref={el => el ? reelRefs.set(reel.id, el) : reelRefs.delete(reel.id)}
            className="h-dvh snap-start relative flex items-center justify-center"
          >
            {author && currentUser && (
              <ReelCard
                post={reel}
                author={author}
                currentUser={currentUser}
                isCurrentlyActive={index === activeReelIndex}
                isSavedByCurrentUser={isSaved}
                isFollowingAuthor={isFollowingAuthor}
                hasSentRequestToAuthor={hasSentRequestToAuthor}
                onLikeReel={handleLikeReel}
                onAddCommentToReel={handleAddCommentToReel}
                onDeleteReel={handleDeleteReel}
                onEditReelCaption={handleEditReelCaption}
                onToggleSaveReel={handleToggleSaveReel}
                onFollowAuthor={handleFollowToggleReelAuthor}
                allUsers={allUsers}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
