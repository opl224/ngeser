
"use client";

import { useState, useEffect, ChangeEvent, useMemo, Dispatch, SetStateAction, useRef, useCallback } from 'react';
import type { User, Post, Comment as CommentType, Notification, Conversation } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// PostCard is not used for stories anymore, but kept for activity feed
import { PostCard } from './PostCard';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { initialUsers, initialPosts, initialNotifications, getCurrentUserId, initialConversations } from '@/lib/data';
import { Edit3, ImageIcon as ImageIconLucide, Save, Bookmark, MessageSquare, ShieldCheck, ShieldOff, Lock, LayoutGrid, Video, BadgeCheck, ListChecks, Heart, UserPlus, UserCheck as UserCheckIcon, Settings as SettingsIcon, Moon, Sun, Laptop, ShieldQuestion, LogOut, Trash2, GalleryVerticalEnd, PlayCircle, Send as SendIcon, X, MoreHorizontal, Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle as EditDialogTitle, // aliased to avoid conflict
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc,
  AlertDialogFooter as ADFooter,
  AlertDialogHeader as ADHeader,
  AlertDialogTitle as ADTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn, formatTimestamp } from '@/lib/utils';
import Image from 'next/image';

import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from 'next-themes';


interface UserProfileDisplayProps {
  userId: string;
}

function createAndAddNotification(
  setNotificationsGlobal: Dispatch<SetStateAction<Notification[]>>,
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
  setNotificationsGlobal(prev => [notification, ...prev]);
}


export function UserProfileDisplay({ userId }: UserProfileDisplayProps) {
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useLocalStorageState<User[]>('users', initialUsers);
  const [allPosts, setAllPosts] = useLocalStorageState<Post[]>('posts', initialPosts);
  const [notifications, setNotifications] = useLocalStorageState<Notification[]>('notifications', initialNotifications);
  const [conversations, setConversations] = useLocalStorageState<Conversation[]>('conversations', initialConversations);
  const [currentSessionUserId, setCurrentSessionUserId] = useState<string | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const [isClient, setIsClient] = useState(false);

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isPrivacySettingsModalOpen, setIsPrivacySettingsModalOpen] = useState(false);
  const [showDeleteDataConfirm, setShowDeleteDataConfirm] = useState(false);

  const [editedUsername, setEditedUsername] = useState('');
  const [editedFullName, setEditedFullName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedAvatarFile, setEditedAvatarFile] = useState<File | null>(null);
  const [editedAvatarPreview, setEditedAvatarPreview] = useState<string | null>(null);
  
  const [postFilterType, setPostFilterType] = useState<'story' | 'photo' | 'reel'>('story');

  const [editedAccountType, setEditedAccountType] = useState<'public' | 'private'>('public');
  const [editedIsVerified, setEditedIsVerified] = useState(false);

  const [activeMainTab, setActiveMainTab] = useState<'posts' | 'followers' | 'following' | 'activity'>('posts');
  const [activeActivitySubTab, setActiveActivitySubTab] = useState<'saved_nested' | 'liked_nested' | 'commented_nested'>('saved_nested');

  const [showDeleteStoryConfirmDialog, setShowDeleteStoryConfirmDialog] = useState(false);
  const [storyToDeleteId, setStoryToDeleteId] = useState<string | null>(null);
  const [showEditStoryCaptionDialog, setShowEditStoryCaptionDialog] = useState(false);
  const [storyToEditCaption, setStoryToEditCaption] = useState<Post | null>(null);
  const [currentEditingStoryCaption, setCurrentEditingStoryCaption] = useState("");

  const [isPostDetailModalOpen, setIsPostDetailModalOpen] = useState(false);
  const [selectedPostForModal, setSelectedPostForModal] = useState<Post | null>(null);
  const [galleryPosts, setGalleryPosts] = useState<Post[]>([]);
  const [initialGalleryScrollId, setInitialGalleryScrollId] = useState<string | null>(null);
  const galleryContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    setIsClient(true);
    const CUID = getCurrentUserId();
    setCurrentSessionUserId(CUID);
    const foundUser = allUsers.find(u => u.id === userId);
    setProfileUser(foundUser || null);
    if (foundUser) {
      setEditedUsername(foundUser.username);
      setEditedFullName(foundUser.fullName || '');
      setEditedBio(foundUser.bio || '');
      setEditedAvatarPreview(foundUser.avatarUrl);
      setEditedAccountType(foundUser.accountType || 'public');
      setEditedIsVerified(foundUser.isVerified || false);
    }
  }, [userId, allUsers]);

  const currentSessionUser = useMemo(() => {
    if (!currentSessionUserId) return null;
    return allUsers.find(u => u.id === currentSessionUserId);
  }, [allUsers, currentSessionUserId]);

  const isCurrentUserFollowingProfile = useMemo(() => {
    if (!currentSessionUserId || !profileUser || !currentSessionUser) return false;
    return (currentSessionUser.following || []).includes(profileUser.id);
  }, [currentSessionUserId, profileUser, currentSessionUser]);

  const canViewProfileContent = useMemo(() => {
    if (!profileUser) return false;
    if (profileUser.accountType === 'public') return true;
    if (currentSessionUserId === profileUser.id) return true;
    return isCurrentUserFollowingProfile;
  }, [profileUser, currentSessionUserId, isCurrentUserFollowingProfile]);

  const userPostsAndStories = useMemo(() => 
    allPosts
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), 
    [allPosts, userId]
  );
  
  const activeStoriesForProfileUser = useMemo(() => {
    if (!profileUser) return [];
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return userPostsAndStories
      .filter(p => p.type === 'story' && new Date(p.timestamp) > twentyFourHoursAgo)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); 
  }, [userPostsAndStories, profileUser]);


  const filteredGridContent = useMemo(() => { 
    if (!userPostsAndStories) return [];
    if (postFilterType === 'photo' || postFilterType === 'reel') {
        return userPostsAndStories.filter(post => post.type === postFilterType);
    }
    return []; 
  }, [userPostsAndStories, postFilterType]);


  const savedPostsForCurrentUser = useMemo(() => {
    if (!currentSessionUser || !currentSessionUser.savedPosts) return [];
    return allPosts.filter(post => (currentSessionUser.savedPosts || []).includes(post.id))
                   .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [allPosts, currentSessionUser]);

  const likedPostsForCurrentUser = useMemo(() => {
    if (!currentSessionUser) return [];
    return allPosts.filter(post => (post.likes || []).includes(currentSessionUser.id))
                   .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [allPosts, currentSessionUser]);

  const commentedPostsForCurrentUser = useMemo(() => {
    if (!currentSessionUser) return [];
    const commentedPostIds = new Set<string>();
    allPosts.forEach(post => {
      if ((post.comments || []).some(comment => comment.userId === currentSessionUser.id)) {
        commentedPostIds.add(post.id);
      }
    });
    return allPosts.filter(post => commentedPostIds.has(post.id))
                   .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [allPosts, currentSessionUser]);

  const isProfileUserFollowingCSU = useMemo(() => {
    if (!currentSessionUser || !profileUser) return false;
    return (profileUser.following || []).includes(currentSessionUser.id);
  }, [profileUser, currentSessionUser]);

  const modalPostAuthor = useMemo(() => {
    if (!selectedPostForModal) return null;
    return allUsers.find(u => u.id === selectedPostForModal.userId);
  }, [selectedPostForModal, allUsers]);


  const handleFollowToggle = () => {
    if (!currentSessionUserId || !profileUser) {
      toast({ title: "Kesalahan", description: "Pengguna saat ini atau pengguna profil tidak ditemukan.", variant: "destructive" });
      return;
    }
    if (currentSessionUserId === profileUser.id) {
      toast({ title: "Aksi Tidak Valid", description: "Tidak dapat melakukan aksi ini pada diri sendiri.", variant: "destructive" });
      return;
    }

    const CUIDUser = allUsers.find(u => u.id === currentSessionUserId);
    const targetProfileUser = allUsers.find(u => u.id === profileUser.id);

    if (!CUIDUser || !targetProfileUser) {
      toast({ title: "Kesalahan Data Pengguna", description: "Tidak dapat memverifikasi data pengguna untuk melanjutkan.", variant: "destructive" });
      return;
    }

    const isAlreadyFollowing = (CUIDUser.following || []).includes(targetProfileUser.id);
    const hasSentRequest = (CUIDUser.sentFollowRequests || []).includes(targetProfileUser.id);

    if (isAlreadyFollowing) {
      setAllUsers(prevUsers => prevUsers.map(u => {
        if (u.id === currentSessionUserId) return { ...u, following: (u.following || []).filter(id => id !== targetProfileUser.id) };
        if (u.id === targetProfileUser.id) return { ...u, followers: (u.followers || []).filter(id => id !== currentSessionUserId) };
        return u;
      }));
      toast({ title: "Berhenti Mengikuti", description: `Anda tidak lagi mengikuti ${targetProfileUser.username}.` });
    } else if (hasSentRequest) {
      setAllUsers(prevUsers => prevUsers.map(u => {
        if (u.id === currentSessionUserId) return { ...u, sentFollowRequests: (u.sentFollowRequests || []).filter(id => id !== targetProfileUser.id) };
        if (u.id === targetProfileUser.id) return { ...u, pendingFollowRequests: (u.pendingFollowRequests || []).filter(reqId => reqId !== currentSessionUserId) };
        return u;
      }));
      toast({ title: "Permintaan Dibatalkan", description: `Permintaan mengikuti ${targetProfileUser.username} dibatalkan.` });
    } else {
      if (targetProfileUser.accountType === 'public') {
        setAllUsers(prevUsers => prevUsers.map(u => {
          if (u.id === currentSessionUserId) return { ...u, following: [...new Set([...(u.following || []), targetProfileUser.id])] };
          if (u.id === targetProfileUser.id) return { ...u, followers: [...new Set([...(u.followers || []), currentSessionUserId])] };
          return u;
        }));
        toast({ title: "Mulai Mengikuti", description: `Anda sekarang mengikuti ${targetProfileUser.username}.` });
        createAndAddNotification(setNotifications, {
          recipientUserId: targetProfileUser.id,
          actorUserId: currentSessionUserId,
          type: 'follow'
        });
      } else { // Private account
        setAllUsers(prevUsers => prevUsers.map(u => {
          if (u.id === currentSessionUserId) return { ...u, sentFollowRequests: [...new Set([...(u.sentFollowRequests || []), targetProfileUser.id])] };
          if (u.id === targetProfileUser.id) return { ...u, pendingFollowRequests: [...new Set([...(u.pendingFollowRequests || []), currentSessionUserId])] };
          return u;
        }));
        toast({ title: "Permintaan Terkirim", description: `Permintaan mengikuti ${targetProfileUser.username} telah dikirim.` });
        createAndAddNotification(setNotifications, {
          recipientUserId: targetProfileUser.id,
          actorUserId: currentSessionUserId,
          type: 'follow_request'
        });
      }
    }
  };

  const handleLikePost = (postId: string) => {
    if (!currentSessionUserId) return;
    setAllPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const isAlreadyLiked = (post.likes || []).includes(currentSessionUserId);
          const likes = isAlreadyLiked
            ? (post.likes || []).filter(uid => uid !== currentSessionUserId)
            : [...new Set([...(post.likes || []), currentSessionUserId])];

          if (!isAlreadyLiked && post.userId !== currentSessionUserId) {
             createAndAddNotification(setNotifications, {
                recipientUserId: post.userId,
                actorUserId: currentSessionUserId,
                type: 'like',
                postId: post.id,
                postMediaUrl: post.mediaUrl,
            });
          }
          if (selectedPostForModal && selectedPostForModal.id === postId) {
            setSelectedPostForModal(prev => prev ? { ...prev, likes } : null);
          }
          if (galleryPosts.some(gp => gp.id === postId)) {
            setGalleryPosts(prevGalleryPosts => prevGalleryPosts.map(gp => gp.id === postId ? { ...gp, likes } : gp));
          }
          return { ...post, likes };
        }
        return post;
      })
    );
  };

  const handleAddComment = (postId: string, text: string) => {
    if (!currentSessionUserId) return;
    const newComment: CommentType = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      postId,
      userId: currentSessionUserId,
      text,
      timestamp: new Date().toISOString(),
      parentId: null,
      replies: [],
    };
    setAllPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
           if (post.userId !== currentSessionUserId) {
                createAndAddNotification(setNotifications, {
                    recipientUserId: post.userId,
                    actorUserId: currentSessionUserId,
                    type: 'comment',
                    postId: post.id,
                    commentId: newComment.id,
                    postMediaUrl: post.mediaUrl,
                });
            }
            const updatedPost = { ...post, comments: [...(post.comments || []), newComment] };
            if (selectedPostForModal && selectedPostForModal.id === postId) {
                setSelectedPostForModal(prev => prev ? { ...prev, comments: updatedPost.comments } : null);
            }
            if (galleryPosts.some(gp => gp.id === postId)) {
                setGalleryPosts(prevGalleryPosts => prevGalleryPosts.map(gp => gp.id === postId ? { ...gp, comments: updatedPost.comments } : gp));
            }
          return updatedPost;
        }
        return post;
      })
    );
    toast({ title: "Komentar Ditambahkan", description: "Komentar Anda telah diposting."});
  };
  
  const handleUpdatePostCaptionOnProfile = (postId: string, newCaption: string) => {
    setAllPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, caption: newCaption } : post
      )
    );
  };

  const handleDeletePostOnProfile = (postId: string) => {
    setAllPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };

  const handleToggleSavePost = (postId: string) => {
    if (!currentSessionUserId) return;
    let toastInfo: { title: string; description: string } | null = null;

    setAllUsers(prevUsers => {
      return prevUsers.map(user => {
        if (user.id === currentSessionUserId) {
          const currentSavedPosts = user.savedPosts || [];
          const isSaved = currentSavedPosts.includes(postId);
          const newSavedPosts = isSaved
            ? currentSavedPosts.filter(id => id !== postId)
            : [...new Set([...currentSavedPosts, postId])];

          if (isSaved) {
            toastInfo = { title: "Postingan Dihapus dari Simpanan", description: "Postingan telah dihapus dari daftar simpanan Anda." };
          } else {
            toastInfo = { title: "Postingan Disimpan", description: "Postingan telah ditambahkan ke daftar simpanan Anda." };
          }
          return { ...user, savedPosts: newSavedPosts };
        }
        return user;
      });
    });
    if (toastInfo) {
      toast(toastInfo);
    }
  };

  const handleOpenEditProfileModal = () => {
    if (profileUser) {
      setEditedUsername(profileUser.username);
      setEditedFullName(profileUser.fullName || '');
      setEditedBio(profileUser.bio || '');
      setEditedAvatarPreview(profileUser.avatarUrl);
      setEditedAvatarFile(null);
      setIsEditProfileModalOpen(true);
    }
  };

  const handleAvatarFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditedAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setEditedAvatarFile(null);
      setEditedAvatarPreview(profileUser?.avatarUrl || null);
    }
  };

  const handleSaveChanges = () => {
    if (!profileUser || !currentSessionUserId) {
      toast({ title: "Error", description: "Tidak dapat menyimpan, data pengguna tidak lengkap.", variant: "destructive" });
      return;
    }

    const fullNameWords = editedFullName.trim().split(/\s+/);
    if (fullNameWords.length > 15) {
      toast({
        title: "Nama Lengkap Terlalu Panjang",
        description: "Nama lengkap tidak boleh lebih dari 15 kata.",
        variant: "destructive",
      });
      return;
    }

    if (!editedFullName.trim()) {
      toast({
        title: "Gagal Menyimpan",
        description: "Nama lengkap tidak boleh kosong.",
        variant: "destructive",
      });
      return;
    }

    setAllUsers(prevUsers =>
      prevUsers.map(user => {
        if (user.id === currentSessionUserId) {
          return {
            ...user,
            fullName: editedFullName.trim(),
            bio: editedBio.trim(),
            avatarUrl: editedAvatarPreview || user.avatarUrl,
          };
        }
        return user;
      })
    );

    toast({
      title: "Profil Diperbarui",
      description: "Informasi profil Anda telah berhasil diperbarui.",
    });
    setIsEditProfileModalOpen(false);
  };

  const handleSendMessage = () => {
    if (!currentSessionUserId || !profileUser || currentSessionUserId === profileUser.id) return;
    router.push(`/dm?userId=${profileUser.id}`);
  };

  const handleOpenPrivacySettingsModal = () => {
    if (profileUser) {
        setEditedAccountType(profileUser.accountType || 'public');
        setEditedIsVerified(profileUser.isVerified || false);
        setIsPrivacySettingsModalOpen(true);
    } else {
        toast({ title: "Error", description: "Data pengguna saat ini tidak ditemukan.", variant: "destructive"});
    }
  };

  const handleSavePrivacySettings = () => {
    if (!profileUser || !currentSessionUserId) {
        toast({ title: "Error", description: "Tidak dapat menyimpan, data pengguna tidak lengkap.", variant: "destructive" });
        return;
    }
     setAllUsers(prevUsers =>
      prevUsers.map(user => {
        if (user.id === currentSessionUserId) { // Only current user can change their own privacy
          return {
            ...user,
            accountType: editedAccountType,
            isVerified: editedIsVerified,
          };
        }
        return user;
      })
    );
    toast({
      title: "Pengaturan Privasi Diperbarui",
      description: "Pengaturan privasi dan verifikasi akun Anda telah disimpan.",
    });
    setIsPrivacySettingsModalOpen(false);
  };

  const handleLogoutAndSaveData = () => {
     if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('users', JSON.stringify(allUsers));
        localStorage.setItem('posts', JSON.stringify(allPosts));
        localStorage.setItem('notifications', JSON.stringify(notifications));
        localStorage.setItem('conversations', JSON.stringify(conversations));
      } catch (error) {
        console.error("Error saving data to localStorage on logout:", error);
        toast({
          title: "Kesalahan Penyimpanan",
          description: "Gagal menyimpan data Anda sebelum keluar.",
          variant: "destructive",
        });
      }

      window.dispatchEvent(new CustomEvent('authChange'));
      localStorage.removeItem('currentUserId'); 
    }
    toast({
      title: "Berhasil Keluar",
      description: "Data Anda tersimpan. Anda telah berhasil keluar.",
    });
    router.push('/login');
  };

  const handleLogoutAndDeleteAllData = () => {
    setAllPosts([]);
    setAllUsers([]);
    setNotifications([]);
    setConversations([]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authChange'));
      localStorage.removeItem('currentUserId'); 
      localStorage.setItem('posts', '[]');
      localStorage.setItem('users', '[]');
      localStorage.setItem('notifications', '[]');
      localStorage.setItem('conversations', '[]');
    }
    toast({
      title: "Data Dihapus & Berhasil Keluar",
      description: "Semua data aplikasi telah dihapus. Anda telah berhasil keluar.",
      variant: "destructive",
    });
    setShowDeleteDataConfirm(false);
    router.push('/login');
  };

  const handleOpenDeleteStoryDialog = (storyId: string) => {
    setStoryToDeleteId(storyId);
    setShowDeleteStoryConfirmDialog(true);
  };

  const handleConfirmDeleteStory = () => {
    if (storyToDeleteId) {
      handleDeletePostOnProfile(storyToDeleteId);
      toast({ title: "Cerita Dihapus", description: "Cerita telah berhasil dihapus.", variant: "destructive" });
    }
    setShowDeleteStoryConfirmDialog(false);
    setStoryToDeleteId(null);
  };

  const handleOpenEditStoryCaptionDialog = (storyPost: Post) => {
    setStoryToEditCaption(storyPost);
    setCurrentEditingStoryCaption(storyPost.caption);
    setShowEditStoryCaptionDialog(true);
  };

  const handleSaveStoryCaption = () => {
    if (storyToEditCaption) {
      handleUpdatePostCaptionOnProfile(storyToEditCaption.id, currentEditingStoryCaption);
      toast({ title: "Keterangan Cerita Diperbarui" });
    }
    setShowEditStoryCaptionDialog(false);
    setStoryToEditCaption(null);
    setCurrentEditingStoryCaption("");
  };

  const handleOpenPostDetailModal = (post: Post, type: 'photo' | 'reel' | 'story') => {
    if (isMobile && (type === 'photo' || type === 'reel')) {
      const userFilteredContent = userPostsAndStories.filter(p => p.type === type)
                                   .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setGalleryPosts(userFilteredContent);
      setSelectedPostForModal(post); 
      setInitialGalleryScrollId(post.id);
      setIsPostDetailModalOpen(true);
    } else {
      setSelectedPostForModal(post);
      setGalleryPosts([]); 
      setInitialGalleryScrollId(null);
      setIsPostDetailModalOpen(true);
    }
  };

  useEffect(() => {
    if (isMobile && isPostDetailModalOpen && initialGalleryScrollId && galleryContainerRef.current && galleryPosts.length > 0) {
      const element = document.getElementById(`gallery-item-${initialGalleryScrollId}`);
      if (element) {
        galleryContainerRef.current.scrollTo({ top: element.offsetTop, behavior: 'auto' });
      }
      // setInitialGalleryScrollId(null); // Keep it to identify the initially clicked item for autoplay
    }
  }, [isMobile, isPostDetailModalOpen, initialGalleryScrollId, galleryPosts]);
  
  if (!profileUser) {
    return <div className="text-center py-10"><p className="text-xl text-muted-foreground font-headline">Pengguna tidak ditemukan.</p></div>;
  }

  const isCurrentUserProfile = currentSessionUserId === profileUser.id;
  const isRequestedByCSUtoPU = (currentSessionUser?.sentFollowRequests || []).includes(profileUser.id);


  let followButtonText = "Ikuti";
  let FollowButtonIconComponent = UserPlus;

  if (isCurrentUserFollowingProfile) {
    followButtonText = "Mengikuti";
    FollowButtonIconComponent = UserCheckIcon;
  } else if (isRequestedByCSUtoPU && profileUser.accountType === 'private') {
    followButtonText = "Diminta";
    FollowButtonIconComponent = UserPlus;
  } else {
    followButtonText = "Ikuti";
    FollowButtonIconComponent = UserPlus;
  }

  const isFollowButtonDisabled = profileUser.accountType === 'private' && isRequestedByCSUtoPU && !isCurrentUserFollowingProfile;


  return (
    <div className="mx-auto w-full sm:max-w-2xl">
        <Card className="mb-8 shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="relative p-6 bg-card flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-primary shadow-md">
                <AvatarImage src={profileUser.avatarUrl} alt={profileUser.username} data-ai-hint="portrait person large" />
                <AvatarFallback className="text-4xl font-headline">{profileUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              {isCurrentUserProfile && isMobile && isClient && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleOpenEditProfileModal}
                  className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full p-2 bg-background border-2 border-primary/70 shadow-md md:hover:bg-accent md:hidden"
                  aria-label="Edit Profil"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="text-center md:text-left md:flex-1">
              <div className="flex flex-col items-center md:items-start">
                {profileUser.fullName &&
                  <div className="flex items-center gap-2">
                    <CardTitle className="font-headline text-3xl md:text-4xl text-foreground">{profileUser.fullName}</CardTitle>
                    {profileUser.isVerified && <BadgeCheck className="h-6 w-6 md:h-7 md:w-7 text-primary" />}
                  </div>
                }
                <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                    <p className="text-lg">@{profileUser.username}</p>
                    {profileUser.accountType === 'private' && !isCurrentUserProfile && !isCurrentUserFollowingProfile && <Lock className="h-4 w-4" />}
                </div>
              </div>
              {profileUser.bio && <p className="text-muted-foreground mt-2 font-body text-sm md:text-base">{profileUser.bio}</p>}
              <div className="flex justify-center md:justify-start gap-4 mt-4 text-sm">
                <div><span className="font-semibold">{canViewProfileContent ? userPostsAndStories.length : "-"}</span> Postingan</div>
                <div><span className="font-semibold">{canViewProfileContent ? (profileUser.followers || []).length : "-"}</span> Pengikut</div>
                <div><span className="font-semibold">{canViewProfileContent ? (profileUser.following || []).length : "-"}</span> Mengikuti</div>
              </div>
              
             {!isCurrentUserProfile && currentSessionUserId && (
                <div className="hidden md:flex md:flex-col md:items-start md:gap-2 mt-4">
                    <div className="flex items-center gap-2">
                        <Button
                        onClick={handleFollowToggle}
                        variant={isCurrentUserFollowingProfile ? "secondary" : "default"}
                        size="sm"
                        disabled={isFollowButtonDisabled}
                        className="md:hover:bg-primary/90"
                        >
                        <FollowButtonIconComponent className="mr-2 h-4 w-4" />
                        {followButtonText}
                        </Button>
                        <Button 
                        onClick={handleSendMessage} 
                        variant="outline" 
                        size="sm" 
                        className="px-3 md:hover:bg-accent md:hover:text-accent-foreground"
                        >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            <span>Pesan</span>
                        </Button>
                    </div>
                </div>
              )}
            </div>
            
            {isCurrentUserProfile && (
              <div className="absolute top-4 right-4 md:top-6 md:right-6">
                {isMobile && isClient ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 md:hover:bg-accent md:hover:text-accent-foreground"
                                aria-label="Pengaturan Profil Mobile"
                            >
                                <SettingsIcon className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={5} className="z-[60]">   
                            <DropdownMenuItem onClick={handleOpenEditProfileModal} className="cursor-pointer">
                                <Edit3 className="mr-2 h-4 w-4" /> Edit Profil
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />                         
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <ListChecks className="mr-2 h-4 w-4" /> Aktivitas Saya
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                     <DropdownMenuItem onClick={() => { setActiveMainTab("activity"); setActiveActivitySubTab("saved_nested"); }}>
                                        <Bookmark className="mr-2 h-4 w-4" /> Disimpan
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setActiveMainTab("activity"); setActiveActivitySubTab("liked_nested"); }}>
                                        <Heart className="mr-2 h-4 w-4" /> Disukai
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setActiveMainTab("activity"); setActiveActivitySubTab("commented_nested"); }}>
                                        <MessageSquare className="mr-2 h-4 w-4" /> Dikomentari
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    {theme === 'light' && <Sun className="mr-2 h-4 w-4" />}
                                    {theme === 'dark' && <Moon className="mr-2 h-4 w-4" />}
                                    {theme === 'system' && <Laptop className="mr-2 h-4 w-4" />}
                                    Tema
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup value={theme || 'system'} onValueChange={setTheme}>
                                    <DropdownMenuRadioItem value="light">
                                        <Sun className="mr-2 h-4 w-4" /> Terang
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="dark">
                                        <Moon className="mr-2 h-4 w-4" /> Gelap
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="system">
                                        <Laptop className="mr-2 h-4 w-4" /> Sistem
                                    </DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuItem onClick={handleOpenPrivacySettingsModal} className="cursor-pointer">
                                <ShieldQuestion className="mr-2 h-4 w-4" /> Pengaturan Privasi
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={handleLogoutAndSaveData} className="cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" /> Keluar & Simpan Data
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setShowDeleteDataConfirm(true)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Keluar & Hapus Data
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hidden md:inline-flex md:hover:bg-accent md:hover:text-accent-foreground"
                        onClick={handleOpenEditProfileModal}
                        aria-label="Edit Profil Desktop"
                    >
                        <Edit3 className="h-5 w-5" />
                    </Button>
                )}
              </div>
            )}

            {!isCurrentUserProfile && currentSessionUserId && (
                <div className="flex w-full justify-center items-center gap-2 mt-4 md:hidden">
                    <Button
                      onClick={handleFollowToggle}
                      variant={isCurrentUserFollowingProfile ? "secondary" : "default"}
                      size="sm"
                      disabled={isFollowButtonDisabled}
                    >
                      <FollowButtonIconComponent className="mr-2 h-4 w-4" />
                      {followButtonText}
                    </Button>
                    <Button 
                      onClick={handleSendMessage} 
                      variant="outline" 
                      size="sm" 
                      className="px-3"
                    >
                        <MessageSquare className="h-4 w-4" />
                    </Button>
                </div>
            )}
          </CardHeader>
        </Card>


      <Dialog open={isEditProfileModalOpen} onOpenChange={setIsEditProfileModalOpen}>
        <DialogContent className={cn(
            "sm:max-w-[420px]",
            "h-full max-h-[calc(100dvh-4rem)] w-[calc(100%-2rem)] flex flex-col overflow-hidden" 
            )}>
          <DialogHeader>
            <EditDialogTitle className="font-headline text-2xl flex items-center gap-2">
              <Edit3 className="h-6 w-6 text-primary"/>Edit Profil
            </EditDialogTitle>
            <DialogDescription>
               Perbarui informasi profil Anda. Email dan Nama Pengguna tidak dapat diubah.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow min-h-0 -mx-6 px-6"> 
            <div className="grid gap-6 py-4 pr-2">
              <div className="space-y-2">
                <Label htmlFor="profile-email" className="font-medium">Email</Label>
                <Input
                  id="profile-email"
                  value={profileUser?.email || ''}
                  readOnly
                  className="mt-1 bg-muted/50 cursor-not-allowed"
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="profile-username" className="font-medium">Nama Pengguna (Username)</Label>
                <Input
                  id="profile-username"
                  value={editedUsername}
                  readOnly
                  className="mt-1 bg-muted/50 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fullname" className="font-medium">Nama Lengkap</Label>
                <Input
                  id="edit-fullname"
                  value={editedFullName}
                  onChange={(e) => setEditedFullName(e.target.value)}
                  className="mt-1"
                  placeholder="Masukkan nama lengkap Anda"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-bio" className="font-medium">Bio</Label>
                <Textarea
                  id="edit-bio"
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  className="mt-1 min-h-[80px]"
                  placeholder="Tulis sesuatu tentang diri Anda..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-avatar" className="font-medium">Gambar Profil</Label>
                <Input
                  id="edit-avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="mt-1 file:mr-4 file:py-0 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary md:hover:file:bg-primary/20"
                />
              </div>
              {editedAvatarPreview && (
                <div className="space-y-2">
                  <Label className="font-medium">Pratinjau Avatar</Label>
                  <div className="mt-2 flex justify-center">
                    <Avatar className="h-32 w-32 border-2 border-primary/50">
                      <AvatarImage src={editedAvatarPreview} alt="Pratinjau avatar baru" data-ai-hint="portrait person preview"/>
                      <AvatarFallback className="text-3xl">{editedUsername.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="mt-2 pt-4 border-t flex flex-row justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditProfileModalOpen(false)} className="md:hover:bg-accent md:hover:text-accent-foreground">Batal</Button>
            <Button onClick={handleSaveChanges} className="md:hover:bg-primary/90"><Save className="mr-2 h-4 w-4"/>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPrivacySettingsModalOpen} onOpenChange={setIsPrivacySettingsModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
                <EditDialogTitle className="font-headline text-2xl flex items-center gap-2">
                    <ShieldQuestion className="h-6 w-6 text-primary" />Pengaturan Privasi Akun
                </EditDialogTitle>
                <DialogDescription>
                Kelola siapa yang dapat melihat konten Anda dan status verifikasi akun.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
                <div className="space-y-3">
                <Label htmlFor="account-type-switch-profile" className="font-medium">Privasi Akun</Label>
                <div className="flex items-center space-x-3 p-3 border rounded-md bg-muted/30">
                    <Switch
                    id="account-type-switch-profile"
                    checked={editedAccountType === 'private'}
                    onCheckedChange={(checked) => setEditedAccountType(checked ? 'private' : 'public')}
                    disabled={!isCurrentUserProfile}
                    />
                    <Label htmlFor="account-type-switch-profile" className="text-sm flex items-center gap-1.5 cursor-pointer">
                    {editedAccountType === 'private' ? <Lock className="h-4 w-4"/> : <ShieldOff className="h-4 w-4"/>}
                    {editedAccountType === 'private' ? 'Akun Privat' : 'Akun Publik'}
                    </Label>
                </div>
                <p className="text-xs text-muted-foreground px-1">
                    Jika akun privat, hanya pengikut yang Anda setujui yang dapat melihat postingan Anda. Permintaan mengikuti akan diperlukan untuk pengguna baru yang ingin mengikuti Anda.
                </p>
                </div>
                <div className="space-y-3">
                <Label htmlFor="account-verified-switch-profile" className="font-medium">Verifikasi Akun (Centang Biru)</Label>
                <div className="flex items-center space-x-3 p-3 border rounded-md bg-muted/30">
                    <Switch
                    id="account-verified-switch-profile"
                    checked={editedIsVerified}
                    onCheckedChange={setEditedIsVerified}
                    disabled={!isCurrentUserProfile}
                    />
                    <Label htmlFor="account-verified-switch-profile" className="text-sm flex items-center gap-1.5 cursor-pointer">
                    {editedIsVerified ? <BadgeCheck className="h-4 w-4 text-primary"/> : <BadgeCheck className="h-4 w-4 text-muted"/>}
                    {editedIsVerified ? 'Akun Terverifikasi' : 'Akun Belum Terverifikasi'}
                    </Label>
                </div>
                <p className="text-xs text-muted-foreground px-1">
                    Aktifkan untuk menampilkan lencana verifikasi (centang biru) di profil Anda.
                </p>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsPrivacySettingsModalOpen(false)} className="md:hover:bg-accent md:hover:text-accent-foreground">Batal</Button>
                <Button onClick={handleSavePrivacySettings} className="md:hover:bg-primary/90" disabled={!isCurrentUserProfile}><Save className="mr-2 h-4 w-4"/>Simpan Perubahan</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    <AlertDialog open={showDeleteDataConfirm} onOpenChange={setShowDeleteDataConfirm}>
        <AlertDialogContent>
          <ADHeader>
            <ADTitle className="font-headline">Anda yakin?</ADTitle>
            <AlertDialogDesc>
              Tindakan ini akan menghapus semua data postingan, pengguna, notifikasi, dan percakapan secara permanen dari aplikasi ini di browser Anda.
              Data tidak dapat dipulihkan.
            </AlertDialogDesc>
          </ADHeader>
          <ADFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDataConfirm(false)}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutAndDeleteAllData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ya, Hapus Semua & Keluar
            </AlertDialogAction>
          </ADFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteStoryConfirmDialog} onOpenChange={setShowDeleteStoryConfirmDialog}>
        <AlertDialogContent>
          <ADHeader>
            <ADTitle className="font-headline">Hapus Cerita Ini?</ADTitle>
            <AlertDialogDesc>
              Tindakan ini tidak dapat dibatalkan. Cerita ini akan dihapus secara permanen.
            </AlertDialogDesc>
          </ADHeader>
          <ADFooter>
            <AlertDialogCancel onClick={() => setShowDeleteStoryConfirmDialog(false)}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteStory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ya, Hapus Cerita
            </AlertDialogAction>
          </ADFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditStoryCaptionDialog} onOpenChange={setShowEditStoryCaptionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <EditDialogTitle className="font-headline">Edit Keterangan Cerita</EditDialogTitle>
            <DialogDescription>
              Buat perubahan pada keterangan cerita Anda. Klik simpan jika sudah selesai.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              id="edit-story-caption"
              value={currentEditingStoryCaption}
              onChange={(e) => setCurrentEditingStoryCaption(e.target.value)}
              className="min-h-[100px]"
              rows={3}
              placeholder="Tulis keterangan untuk cerita Anda..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditStoryCaptionDialog(false)}>Batal</Button>
            <Button onClick={handleSaveStoryCaption}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPostDetailModalOpen} onOpenChange={(open) => {
          setIsPostDetailModalOpen(open);
          if (!open) {
            setGalleryPosts([]);
            setSelectedPostForModal(null);
            setInitialGalleryScrollId(null);
          }
        }}>
        <DialogContent className={cn(
          // Default (Desktop single post or mobile story)
          "sm:max-w-3xl md:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[90vh] p-0 flex flex-col bg-card text-card-foreground shadow-xl rounded-lg",
          // Mobile Gallery Override
          (isMobile && galleryPosts.length > 0) && "fixed inset-0 w-screen h-dvh bg-black p-0 flex flex-col rounded-none border-none shadow-none [&>button[aria-label=Close]]:hidden"
        )}>
           {/* Conditional DialogHeader for Mobile Gallery */}
          {isMobile && galleryPosts.length > 0 && (
            <DialogHeader className="sr-only">
              <EditDialogTitle>Galeri Postingan Pengguna</EditDialogTitle>
            </DialogHeader>
          )}
          
          {/* Mobile Gallery View */}
          {isMobile && galleryPosts.length > 0 && selectedPostForModal && (
            <>
              <div className="flex-1 flex flex-col h-full w-full">
                <div className="absolute top-0 left-0 right-0 z-20 p-3 flex items-center justify-start bg-gradient-to-b from-black/60 to-transparent">
                    <Button variant="ghost" size="icon" onClick={() => setIsPostDetailModalOpen(false)} className="text-white hover:bg-white/10">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    {profileUser && (
                       <Link href={`/profile/${profileUser.id}`} onClick={() => setIsPostDetailModalOpen(false)} className="ml-3 flex items-center gap-2 group">
                         <Avatar className="h-7 w-7 border border-white/50">
                           <AvatarImage src={profileUser.avatarUrl} alt={profileUser.username} data-ai-hint="gallery author avatar small"/>
                           <AvatarFallback>{profileUser.username.substring(0,1).toUpperCase()}</AvatarFallback>
                         </Avatar>
                         <span className="text-sm font-semibold text-white group-hover:underline">{profileUser.username}</span>
                       </Link>
                    )}
                </div>

                <div ref={galleryContainerRef} className="flex-1 h-full w-full overflow-y-auto snap-y snap-mandatory">
                    {galleryPosts.map((galleryPost) => {
                        const postAuthor = allUsers.find(u => u.id === galleryPost.userId);
                        return (
                        <div
                            key={galleryPost.id}
                            id={`gallery-item-${galleryPost.id}`}
                            className="h-dvh w-screen snap-start flex items-center justify-center relative"
                        >
                            {galleryPost.mediaMimeType?.startsWith('image/') ? (
                            <Image src={galleryPost.mediaUrl} alt={galleryPost.caption || 'Post media'} layout="fill" objectFit="contain" data-ai-hint={`${galleryPost.type} gallery image`}/>
                            ) : galleryPost.mediaMimeType?.startsWith('video/') ? (
                            <video src={galleryPost.mediaUrl} controls className="w-full h-full object-contain" data-ai-hint="gallery video content" autoPlay={galleryPost.id === initialGalleryScrollId} playsInline loop={galleryPost.id === initialGalleryScrollId} muted={galleryPost.id === initialGalleryScrollId} />
                            ) : (
                            <p className="text-white">Media tidak didukung.</p>
                            )}
                            
                            <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 z-10 bg-gradient-to-t from-black/70 via-black/40 to-transparent text-white">
                                {postAuthor && (
                                <div className="flex items-center justify-center gap-2 mb-1.5 text-center">
                                    <Link href={`/profile/${postAuthor.id}`} onClick={() => setIsPostDetailModalOpen(false)}>
                                    <Avatar className="h-8 w-8 border-2 border-white/70">
                                        <AvatarImage src={postAuthor.avatarUrl} data-ai-hint="gallery author avatar overlay"/>
                                        <AvatarFallback>{postAuthor.username.substring(0,1).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    </Link>
                                    <Link href={`/profile/${postAuthor.id}`} onClick={() => setIsPostDetailModalOpen(false)}>
                                        <p className="font-semibold text-sm hover:underline">{postAuthor.username}</p>
                                    </Link>
                                </div>
                                )}
                                {galleryPost.caption && <p className="text-xs line-clamp-2 mb-2 text-center">{galleryPost.caption}</p>}
                                
                                <div className="flex items-center justify-center gap-4">
                                    <Button variant="ghost" size="sm" onClick={() => handleLikePost(galleryPost.id)} className="text-white/80 hover:text-white p-0 flex items-center gap-1">
                                        <Heart className={cn("h-5 w-5", (galleryPost.likes || []).includes(currentSessionUserId!) && "fill-red-500 text-red-500")} />
                                        <span className="text-xs">{(galleryPost.likes || []).length}</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-white/80 hover:text-white p-0 flex items-center gap-1">
                                        <MessageSquare className="h-5 w-5" />
                                        <span className="text-xs">{(galleryPost.comments || []).length + (galleryPost.comments || []).reduce((acc, curr) => acc + (curr.replies?.length || 0), 0)}</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-white/80 p-0 flex items-center gap-1">
                                        <Eye className="h-5 w-5" />
                                        <span className="text-xs">{galleryPost.viewCount || 0}</span>
                                    </Button>
                                    {currentSessionUserId && (
                                        <Button variant="ghost" size="icon" onClick={() => handleToggleSavePost(galleryPost.id)} className="text-white/80 hover:text-white p-0 h-auto w-auto">
                                        <Bookmark className={cn("h-5 w-5", (currentSessionUser?.savedPosts || []).includes(galleryPost.id) && "fill-white")} />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
              </div>
            </>
          )}

          {/* Desktop Single Post View or Mobile Story View (or when gallery is empty) */}
          {(!isMobile || galleryPosts.length === 0) && selectedPostForModal && modalPostAuthor && (
            <>
              <DialogHeader className="p-3 border-b flex flex-row items-center justify-between sticky top-0 bg-card z-10">
                <div className="flex items-center gap-3">
                  <Link href={`/profile/${modalPostAuthor.id}`} onClick={() => setIsPostDetailModalOpen(false)}>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={modalPostAuthor.avatarUrl} alt={modalPostAuthor.username} data-ai-hint="user avatar modal" />
                      <AvatarFallback>{modalPostAuthor.username.substring(0,1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <EditDialogTitle className="text-sm font-semibold font-headline">
                      <Link href={`/profile/${modalPostAuthor.id}`} onClick={() => setIsPostDetailModalOpen(false)} className="hover:underline">
                        {modalPostAuthor.username}
                      </Link>
                    </EditDialogTitle>
                    <p className="text-xs text-muted-foreground">{formatTimestamp(selectedPostForModal.timestamp)}</p>
                  </div>
                </div>
              </DialogHeader>
              <ScrollArea className="flex-1 min-h-0 bg-background">
                <div className="p-0 md:p-1 flex flex-col lg:flex-row gap-0">
                  <div className={cn(
                      "w-full lg:w-2/3 flex-shrink-0 bg-black flex items-center justify-center relative overflow-hidden min-h-[300px] md:min-h-[400px] lg:min-h-0",
                      selectedPostForModal.type === 'story' ? 'lg:aspect-[9/16] lg:max-h-[calc(90vh-120px)]' : 'lg:max-h-[calc(90vh-120px)]'
                  )}>
                    {selectedPostForModal.mediaMimeType?.startsWith('image/') ? (
                      <Image src={selectedPostForModal.mediaUrl} alt={selectedPostForModal.caption || 'Post media'} layout="fill" objectFit="contain" data-ai-hint="modal image content"/>
                    ) : selectedPostForModal.mediaMimeType?.startsWith('video/') ? (
                      <video src={selectedPostForModal.mediaUrl} controls className="w-full h-full object-contain" data-ai-hint="modal video content"/>
                    ) : (
                      <p className="text-white">Format media tidak didukung.</p>
                    )}
                  </div>
                  <div className="w-full lg:w-1/3 flex flex-col p-4 bg-card">
                    <div className="flex items-center gap-2 mb-3">
                       <Link href={`/profile/${modalPostAuthor.id}`} onClick={() => setIsPostDetailModalOpen(false)}>
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={modalPostAuthor.avatarUrl} alt={modalPostAuthor.username} data-ai-hint="modal author avatar small"/>
                            <AvatarFallback>{modalPostAuthor.username.substring(0,1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                       </Link>
                       <Link href={`/profile/${modalPostAuthor.id}`} onClick={() => setIsPostDetailModalOpen(false)} className="font-semibold text-sm hover:underline">
                           {modalPostAuthor.username}
                       </Link>
                    </div>
                    {selectedPostForModal.caption && (
                        <ScrollArea className="max-h-28 mb-3 pr-2">
                         <p className="text-sm font-body text-foreground leading-relaxed whitespace-pre-wrap">{selectedPostForModal.caption}</p>
                        </ScrollArea>
                    )}
                    {selectedPostForModal.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {selectedPostForModal.hashtags.map(tag => (
                          <Link key={tag} href={`/search?q=${tag}`} onClick={() => setIsPostDetailModalOpen(false)} className="text-xs text-primary hover:underline">#{tag}</Link>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-x-1.5 mt-auto pt-3 border-t">
                      <Button variant="ghost" size="sm" onClick={() => handleLikePost(selectedPostForModal.id)} className="text-muted-foreground hover:text-destructive">
                        <Heart className={cn("h-5 w-5", (selectedPostForModal.likes || []).includes(currentSessionUserId!) && "fill-destructive text-destructive")} />
                        <span className="ml-1.5 text-xs">{(selectedPostForModal.likes || []).length}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                        <MessageSquare className="h-5 w-5" />
                        <span className="ml-1.5 text-xs">{(selectedPostForModal.comments || []).length + (selectedPostForModal.comments || []).reduce((acc, curr) => acc + (curr.replies?.length || 0), 0)}</span>
                      </Button>
                       <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <Eye className="h-5 w-5" />
                        <span className="ml-1.5 text-xs">{selectedPostForModal.viewCount || 0}</span>
                      </Button>
                      {currentSessionUserId && (
                        <Button variant="ghost" size="icon" onClick={() => handleToggleSavePost(selectedPostForModal.id)} className="ml-auto text-muted-foreground hover:text-primary">
                          <Bookmark className={cn("h-5 w-5", (currentSessionUser?.savedPosts || []).includes(selectedPostForModal.id) && "fill-primary text-primary")} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
         {!selectedPostForModal && isPostDetailModalOpen && ( 
            <DialogHeader>
                <EditDialogTitle className="sr-only">Memuat Detail Postingan</EditDialogTitle>
                <div className="flex items-center justify-center h-full">
                    <p>Memuat...</p>
                </div>
            </DialogHeader>
         )}
        </DialogContent>
      </Dialog>


      <div className="mt-8 w-full">
        {canViewProfileContent ? (
          <Tabs 
            value={activeMainTab} 
            onValueChange={(value) => setActiveMainTab(value as 'posts' | 'followers' | 'following' | 'activity')} 
            className="w-full"
          >
            <TabsList 
              className={`grid w-full mb-6 bg-muted/50 rounded-lg ${isCurrentUserProfile && !isMobile && isClient ? 'grid-cols-4' : 'grid-cols-3'}`}
            >
              <TabsTrigger value="posts" className="font-headline"><LayoutGrid className="h-4 w-4 mr-2"/>Postingan</TabsTrigger>
              <TabsTrigger value="followers" className="font-headline">Pengikut</TabsTrigger>
              <TabsTrigger value="following" className="font-headline">Mengikuti</TabsTrigger>
              {isCurrentUserProfile && !isMobile && isClient && <TabsTrigger value="activity" className="font-headline"><ListChecks className="h-4 w-4 mr-2"/>Aktivitas Saya</TabsTrigger>}
            </TabsList>

            <TabsContent value="posts">
              <div className="mb-4">
                <Tabs 
                  defaultValue="story" 
                  value={postFilterType}
                  onValueChange={(value) => setPostFilterType(value as 'story' | 'photo' | 'reel')}
                >
                   <TabsList className="grid w-full grid-cols-3 h-10 items-center p-1 text-muted-foreground bg-muted/50 rounded-lg">
                    <TabsTrigger value="story" className="font-headline"><GalleryVerticalEnd className="h-3.5 w-3.5 mr-1.5"/>Cerita</TabsTrigger>
                    <TabsTrigger value="photo" className="font-headline"><ImageIconLucide className="h-3.5 w-3.5 mr-1.5"/>Foto</TabsTrigger>
                    <TabsTrigger value="reel" className="font-headline"><Video className="h-3.5 w-3.5 mr-1.5"/>Reels</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
                {postFilterType === 'story' ? (
                    activeStoriesForProfileUser.length > 0 ? (
                        <div className="space-y-4">
                          {activeStoriesForProfileUser.map(storyPost => {
                              const storyAuthor = allUsers.find(u => u.id === storyPost.userId);
                              if (!storyAuthor) return null;
                              const totalCommentsAndReplies = (storyPost.comments || []).length + (storyPost.comments || []).reduce((acc, curr) => acc + (curr.replies?.length || 0), 0);
                              const isStoryLikedByCurrentUser = currentSessionUserId ? (storyPost.likes || []).includes(currentSessionUserId) : false;

                              return (
                                 <Link href={`/post/${storyPost.id}`} key={storyPost.id} className="block max-w-xs mx-auto group">
                                  <Card className="overflow-hidden shadow-md bg-card/80 md:hover:shadow-lg transition-shadow">
                                    <CardHeader className="relative flex flex-row items-center justify-between p-3 space-y-0">
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={storyAuthor.avatarUrl} alt={storyAuthor.username} data-ai-hint="user avatar small"/>
                                          <AvatarFallback>{storyAuthor.username.substring(0,1).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="text-xs font-semibold font-headline group-hover:text-primary">{storyAuthor.username}</p>
                                          <p className="text-xs text-muted-foreground">{formatTimestamp(storyPost.timestamp)}</p>
                                        </div>
                                      </div>
                                       {isCurrentUserProfile && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-50 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenEditStoryCaptionDialog(storyPost); }}>
                                              <Edit3 className="mr-2 h-4 w-4" />
                                              <span>Edit Keterangan</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenDeleteStoryDialog(storyPost.id);}}
                                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                            >
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              <span>Hapus Cerita</span>
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </CardHeader>
                                    <div className="relative w-full aspect-[9/16] bg-muted/20 rounded-md overflow-hidden my-2 max-h-64">
                                      {storyPost.mediaMimeType?.startsWith('image/') ? (
                                        <Image
                                          src={storyPost.mediaUrl}
                                          alt={storyPost.caption || `Cerita oleh ${profileUser.username}`}
                                          layout="fill"
                                          objectFit="cover"
                                          className="transition-opacity group-hover:opacity-90"
                                          data-ai-hint="story preview image"
                                        />
                                      ) : storyPost.mediaMimeType?.startsWith('video/') ? (
                                        <>
                                          <video
                                            src={storyPost.mediaUrl}
                                            className="w-full h-full object-cover"
                                            playsInline
                                            muted
                                            loop
                                            data-ai-hint="story preview video"
                                          />
                                          <PlayCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-white/80 pointer-events-none" />
                                        </>
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Media tidak didukung</div>
                                      )}
                                    </div>
                                    {storyPost.caption && (
                                      <CardContent className="p-3 pt-0 pb-2">
                                        <p className="text-xs text-muted-foreground line-clamp-2">{storyPost.caption}</p>
                                      </CardContent>
                                    )}
                                    <CardFooter className="px-3 pb-3 pt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                      <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLikePost(storyPost.id); }}
                                        className={cn(
                                          "flex items-center gap-1 hover:text-destructive",
                                          isStoryLikedByCurrentUser && "text-destructive"
                                        )}
                                        disabled={!currentSessionUserId}
                                      >
                                        <Heart className={cn("h-3.5 w-3.5", isStoryLikedByCurrentUser && "fill-destructive")} />
                                        <span>{(storyPost.likes || []).length}</span>
                                      </button>
                                      <div className="flex items-center gap-1">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        <span>{totalCommentsAndReplies}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Eye className="h-3.5 w-3.5" />
                                        <span>{storyPost.viewCount || 0}</span>
                                      </div>
                                    </CardFooter>
                                  </Card>
                                </Link>
                              );
                          })}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8 font-body">
                        Pengguna ini belum memiliki cerita aktif (dalam 24 jam terakhir).
                        </p>
                    )
                ) : filteredGridContent.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {filteredGridContent.map(post => (
                      <div 
                        key={post.id} 
                        className="relative aspect-square block group bg-muted/30 cursor-pointer"
                        onClick={() => handleOpenPostDetailModal(post, post.type as 'photo' | 'reel' | 'story')}
                        onKeyDown={(e) => e.key === 'Enter' && handleOpenPostDetailModal(post, post.type as 'photo' | 'reel' | 'story')}
                        role="button"
                        tabIndex={0}
                        aria-label={`Lihat detail ${post.type} oleh ${profileUser.username}`}
                      >
                        <Image
                          src={post.mediaUrl}
                          alt={post.caption || `Postingan ${post.type} oleh ${profileUser.username}`}
                          layout="fill"
                          objectFit="cover"
                          className="transition-opacity group-hover:opacity-80"
                          data-ai-hint={`${post.type} thumbnail`}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            {(post.type === 'reel' || (post.type === 'story' && post.mediaMimeType?.startsWith('video/'))) && 
                                <PlayCircle className="h-10 w-10 text-white" />
                            }
                        </div>
                        <div className="absolute top-1 right-1 p-0.5 bg-black/40 rounded-sm">
                            {post.type === 'story' && <GalleryVerticalEnd className="h-3.5 w-3.5 text-white" />}
                            {post.type === 'photo' && <ImageIconLucide className="h-3.5 w-3.5 text-white" />}
                            {post.type === 'reel' && <Video className="h-3.5 w-3.5 text-white" />}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8 font-body">
                    Belum ada {postFilterType === 'photo' ? 'foto' : 'reel'}.
                  </p>
                )}
            </TabsContent>

            <TabsContent value="followers">
              <UserList userIds={profileUser.followers || []} allUsers={allUsers} listTitle="Pengikut" />
            </TabsContent>
            <TabsContent value="following">
              <UserList userIds={profileUser.following || []} allUsers={allUsers} listTitle="Mengikuti" />
            </TabsContent>

            {isCurrentUserProfile && activeMainTab === 'activity' && (
              <TabsContent value="activity" forceMount className={cn(activeMainTab !== 'activity' && "hidden")}>
                <Tabs 
                  value={activeActivitySubTab} 
                  onValueChange={(value) => setActiveActivitySubTab(value as 'saved_nested' | 'liked_nested' | 'commented_nested')} 
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 rounded-lg">
                    <TabsTrigger value="saved_nested" className="font-headline"><Bookmark className="h-4 w-4 mr-2"/>Disimpan</TabsTrigger>
                    <TabsTrigger value="liked_nested" className="font-headline"><Heart className="h-4 w-4 mr-2"/>Disukai</TabsTrigger>
                    <TabsTrigger value="commented_nested" className="font-headline"><MessageSquare className="h-4 w-4 mr-2"/>Dikomentari</TabsTrigger>
                  </TabsList>

                  <TabsContent value="saved_nested">
                    {savedPostsForCurrentUser.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {savedPostsForCurrentUser.map(post => (
                          <PostCard
                            key={post.id}
                            post={post}
                            onLikePost={handleLikePost}
                            onAddComment={handleAddComment}
                            onUpdatePostCaption={handleUpdatePostCaptionOnProfile}
                            onDeletePost={handleDeletePostOnProfile}
                            onToggleSavePost={handleToggleSavePost}
                            isSavedByCurrentUser={(currentSessionUser?.savedPosts || []).includes(post.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8 font-body">Belum ada postingan yang disimpan.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="liked_nested">
                    {likedPostsForCurrentUser.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {likedPostsForCurrentUser.map(post => (
                          <PostCard
                            key={post.id}
                            post={post}
                            onLikePost={handleLikePost}
                            onAddComment={handleAddComment}
                            onUpdatePostCaption={handleUpdatePostCaptionOnProfile}
                            onDeletePost={handleDeletePostOnProfile}
                            onToggleSavePost={handleToggleSavePost}
                            isSavedByCurrentUser={(currentSessionUser?.savedPosts || []).includes(post.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8 font-body">Belum ada postingan yang disukai.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="commented_nested">
                    {commentedPostsForCurrentUser.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {commentedPostsForCurrentUser.map(post => (
                          <PostCard
                            key={post.id}
                            post={post}
                            onLikePost={handleLikePost}
                            onAddComment={handleAddComment}
                            onUpdatePostCaption={handleUpdatePostCaptionOnProfile}
                            onDeletePost={handleDeletePostOnProfile}
                            onToggleSavePost={handleToggleSavePost}
                            isSavedByCurrentUser={(currentSessionUser?.savedPosts || []).includes(post.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8 font-body">Belum ada postingan yang dikomentari.</p>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <Card className="w-full">
            <CardContent className="py-12 text-center">
              <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-headline text-foreground">Akun Ini Privat</h3>
              <p className="text-muted-foreground mt-1">Ikuti pengguna ini untuk melihat postingan dan aktivitas mereka.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface UserListProps {
  userIds: string[];
  allUsers: User[];
  listTitle: string;
}

function UserList({ userIds, allUsers, listTitle }: UserListProps) {
  if (userIds.length === 0) {
    return <p className="text-center text-muted-foreground py-8 font-body">Belum ada pengguna di daftar ini.</p>;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl">{listTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {userIds.map(id => {
          const user = allUsers.find(u => u.id === id);
          if (!user) return null;
          return (
            <Link href={`/profile/${user.id}`} key={id} className="flex items-center gap-3 p-3 md:hover:bg-muted/50 rounded-md transition-colors group">
              <Avatar className="h-10 w-10 border md:group-hover:border-primary">
                <AvatarImage src={user.avatarUrl} alt={user.username} data-ai-hint="portrait person"/>
                <AvatarFallback>{user.username.substring(0,1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1.5">
                <span className="font-medium font-headline text-foreground md:group-hover:text-primary">{user.username}</span>
                {user.isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

