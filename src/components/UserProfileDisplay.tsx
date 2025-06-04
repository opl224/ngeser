
"use client";

import { useState, useEffect, ChangeEvent, useMemo, Dispatch, SetStateAction } from 'react';
import type { User, Post, Comment as CommentType, Notification, Conversation } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from './PostCard';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { initialUsers, initialPosts, initialNotifications, getCurrentUserId, initialConversations } from '@/lib/data';
import { Edit3, ImageIcon as ImageIconLucide, Save, Bookmark, MessageSquare, ShieldCheck, ShieldOff, Lock, LayoutGrid, Video, BadgeCheck, ListChecks, Heart, UserPlus, UserCheck as UserCheckIcon, Settings as SettingsIcon, Moon, Sun, Laptop, ShieldQuestion, LogOut, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle as EditDialogTitle,
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
import { cn } from '@/lib/utils';

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
  const [postFilterType, setPostFilterType] = useState<'all' | 'photo' | 'reel'>('all');

  const [editedAccountType, setEditedAccountType] = useState<'public' | 'private'>('public');
  const [editedIsVerified, setEditedIsVerified] = useState(false);

  const [activeMainTab, setActiveMainTab] = useState<'posts' | 'followers' | 'following' | 'activity'>('posts');
  const [activeActivitySubTab, setActiveActivitySubTab] = useState<'saved_nested' | 'liked_nested' | 'commented_nested'>('saved_nested');


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

  const allProfilePostsNonStory = useMemo(() => allPosts
    .filter(p => p.userId === userId && p.type !== 'story')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [allPosts, userId]);

  const filteredDisplayPosts = useMemo(() => {
    if (postFilterType === 'all') {
      return allProfilePostsNonStory;
    }
    return allProfilePostsNonStory.filter(post => post.type === postFilterType);
  }, [allProfilePostsNonStory, postFilterType]);


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
          return { ...post, comments: [...(post.comments || []), newComment] };
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
        if (user.id === currentSessionUserId) {
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
    <div className="max-w-4xl mx-auto">
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
            <div className="flex-1 text-center md:text-left">
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
                <div><span className="font-semibold">{canViewProfileContent ? allProfilePostsNonStory.length : "-"}</span> Postingan</div>
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
                  className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary md:hover:file:bg-primary/20"
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
                <Button onClick={handleSavePrivacySettings} className="md:hover:bg-primary/90"><Save className="mr-2 h-4 w-4"/>Simpan Perubahan</Button>
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


      <div className="mt-8 w-full sm:max-w-2xl sm:mx-auto">
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
                <Tabs defaultValue={postFilterType} onValueChange={(value) => setPostFilterType(value as 'all' | 'photo' | 'reel')}>
                   <TabsList className="grid w-full grid-cols-3 h-10 items-center p-1 text-muted-foreground bg-muted/50 rounded-lg">
                    <TabsTrigger value="all" className="font-headline"><LayoutGrid className="h-3.5 w-3.5 mr-1.5"/>Semua</TabsTrigger>
                    <TabsTrigger value="photo" className="font-headline"><ImageIconLucide className="h-3.5 w-3.5 mr-1.5"/>Foto</TabsTrigger>
                    <TabsTrigger value="reel" className="font-headline"><Video className="h-3.5 w-3.5 mr-1.5"/>Reels</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
                {filteredDisplayPosts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredDisplayPosts.map(post => {
                      const isSavedByCurrentSessUser = (currentSessionUser?.savedPosts || []).includes(post.id);
                      return(
                      <PostCard
                        key={post.id}
                        post={post}
                        onLikePost={handleLikePost}
                        onAddComment={handleAddComment}
                        onUpdatePostCaption={handleUpdatePostCaptionOnProfile}
                        onDeletePost={handleDeletePostOnProfile}
                        onToggleSavePost={handleToggleSavePost}
                        isSavedByCurrentUser={isSavedByCurrentSessUser}
                      />
                    );
                  })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8 font-body">
                    Belum ada {postFilterType === 'all' ? 'postingan' : postFilterType}.
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

