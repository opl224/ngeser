
"use client";

import { useState, useEffect, ChangeEvent, useMemo, Dispatch, SetStateAction } from 'react';
import type { User, Post, Comment as CommentType, Notification } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from './PostCard';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { initialUsers, initialPosts, initialNotifications, getCurrentUserId } from '@/lib/data';
import { Settings, UserPlus, UserCheck, Edit3, LogOut, Trash2, ImageIcon, Save, Bookmark, MessageSquare, ShieldCheck, ShieldOff, Lock, ShieldQuestion, Moon, Sun, Laptop, LayoutGrid, Image as ImageIconLucide, Video } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle as EditDialogTitle, // Renamed to avoid conflict with CardTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import type React_dot_FC from 'react'; // Changed React to React_dot_FC to avoid conflict
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
  const [currentSessionUserId, setCurrentSessionUserId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isPrivacySettingsModalOpen, setIsPrivacySettingsModalOpen] = useState(false);

  const [editedUsername, setEditedUsername] = useState('');
  const [editedFullName, setEditedFullName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedAvatarFile, setEditedAvatarFile] = useState<File | null>(null);
  const [editedAvatarPreview, setEditedAvatarPreview] = useState<string | null>(null);
  const [editedAccountType, setEditedAccountType] = useState<'public' | 'private'>('public');
  const [postFilterType, setPostFilterType] = useState<'all' | 'photo' | 'reel'>('all');


  useEffect(() => {
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

  const userPosts = useMemo(() => allPosts
    .filter(p => p.userId === userId && p.type !== 'story')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [allPosts, userId]);

  // This remains the base for display, already filtering out stories.
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
    if (!currentSessionUser) return [];
    return allPosts.filter(post => (currentSessionUser.savedPosts || []).includes(post.id))
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

    if (isAlreadyFollowing) { // UNFOLLOW action
      setAllUsers(prevUsers => prevUsers.map(u => {
        if (u.id === currentSessionUserId) return { ...u, following: (u.following || []).filter(id => id !== targetProfileUser.id) };
        if (u.id === targetProfileUser.id) return { ...u, followers: (u.followers || []).filter(id => id !== currentSessionUserId) };
        return u;
      }));
      toast({ title: "Berhenti Mengikuti", description: `Anda tidak lagi mengikuti ${targetProfileUser.username}.` });
    } else if (hasSentRequest) { // CANCEL REQUEST action
      setAllUsers(prevUsers => prevUsers.map(u => {
        if (u.id === currentSessionUserId) return { ...u, sentFollowRequests: (u.sentFollowRequests || []).filter(id => id !== targetProfileUser.id) };
        if (u.id === targetProfileUser.id) return { ...u, pendingFollowRequests: (u.pendingFollowRequests || []).filter(reqId => reqId !== currentSessionUserId) };
        return u;
      }));
      toast({ title: "Permintaan Dibatalkan", description: `Permintaan mengikuti ${targetProfileUser.username} dibatalkan.` });
    } else { 
      // New follow action: could be "Ikuti" or "Ikuti Balik"
      if (isProfileUserFollowingCSU && !isCurrentUserFollowingProfile) {
        // This is "Ikuti Balik" scenario - ProfileUser already follows CurrentSessionUser
        // Perform a DIRECT FOLLOW
        setAllUsers(prevUsers => prevUsers.map(u => {
          if (u.id === currentSessionUserId) { // CurrentSessionUser starts following targetProfileUser
            return { ...u, following: [...new Set([...(u.following || []), targetProfileUser.id])] };
          }
          if (u.id === targetProfileUser.id) { // targetProfileUser gets CurrentSessionUser as a follower
            return { ...u, followers: [...new Set([...(u.followers || []), currentSessionUserId])] };
          }
          return u;
        }));
        toast({ title: "Mulai Mengikuti", description: `Anda sekarang mengikuti ${targetProfileUser.username}.` });
        createAndAddNotification(setNotifications, { 
          recipientUserId: targetProfileUser.id, 
          actorUserId: currentSessionUserId, 
          type: 'follow' 
        });
      } else {
        // This is a standard "Ikuti" for a user not followed back yet, or first time follow.
        // Send a FOLLOW REQUEST
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

  const handleLogoutAndSaveData = () => {
     if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('users', JSON.stringify(allUsers));
        localStorage.setItem('posts', JSON.stringify(allPosts));
        localStorage.setItem('notifications', JSON.stringify(notifications));
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authChange'));
      localStorage.removeItem('currentUserId');
      localStorage.setItem('posts', '[]');
      localStorage.setItem('users', '[]'); 
      localStorage.setItem('notifications', '[]');
    }
    toast({
      title: "Data Dihapus & Berhasil Keluar",
      description: "Semua data aplikasi telah dihapus. Anda telah berhasil keluar.",
      variant: "destructive",
    });
    router.push('/login');
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

  const handleOpenPrivacySettingsModal = () => {
    if (profileUser) {
        setEditedAccountType(profileUser.accountType || 'public');
        setIsPrivacySettingsModalOpen(true);
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
            // username tidak diubah di sini karena read-only
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

  const handleSavePrivacySettings = () => {
    if (!profileUser || !currentSessionUserId) return;
     setAllUsers(prevUsers =>
      prevUsers.map(user => {
        if (user.id === currentSessionUserId) {
          return {
            ...user,
            accountType: editedAccountType,
          };
        }
        return user;
      })
    );
    toast({
      title: "Pengaturan Privasi Diperbarui",
      description: "Pengaturan privasi akun Anda telah disimpan.",
    });
    setIsPrivacySettingsModalOpen(false);
  };
  
  const handleSendMessage = () => {
    if (!currentSessionUserId || !profileUser || currentSessionUserId === profileUser.id) return;
    router.push(`/dm?userId=${profileUser.id}`);
  };


  if (!profileUser) {
    return <div className="text-center py-10"><p className="text-xl text-muted-foreground font-headline">Pengguna tidak ditemukan.</p></div>;
  }

  const isCurrentUserProfile = currentSessionUserId === profileUser.id;
  const isRequestedByCSUtoPU = (currentSessionUser?.sentFollowRequests || []).includes(profileUser.id);


  let followButtonText = "Ikuti";
  let FollowButtonIconComponent: React_dot_FC.ElementType = UserPlus;

  if (isCurrentUserFollowingProfile) {
    followButtonText = "Mengikuti";
    FollowButtonIconComponent = UserCheck;
  } else if (isRequestedByCSUtoPU) { 
    followButtonText = "Diminta";
    FollowButtonIconComponent = UserPlus;
  } else if (isProfileUserFollowingCSU && !isCurrentUserFollowingProfile) {
    followButtonText = "Ikuti Balik";
    FollowButtonIconComponent = UserPlus;
  } else {
    followButtonText = "Ikuti";
    FollowButtonIconComponent = UserPlus;
  }

  const isFollowButtonDisabled = isRequestedByCSUtoPU && !isCurrentUserFollowingProfile;


  const SettingsMenuItemsContent = () => (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {theme === 'light' && <Sun className="mr-2 h-4 w-4" />}
          {theme === 'dark' && <Moon className="mr-2 h-4 w-4" />}
          {theme === 'system' && <Laptop className="mr-2 h-4 w-4" />}
          Tema
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                <Sun className="mr-2 h-4 w-4" />
                Cerah
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon className="mr-2 h-4 w-4" />
                Gelap
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Laptop className="mr-2 h-4 w-4" />
                Sistem
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleOpenPrivacySettingsModal} className="cursor-pointer">
        <ShieldQuestion className="mr-2 h-4 w-4" />
        Pengaturan Privasi
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogoutAndSaveData} className="cursor-pointer">
        <LogOut className="mr-2 h-4 w-4" />
        Keluar & Simpan Data
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer md:hover:bg-destructive/10"
          onSelect={(e) => e.preventDefault()}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Keluar & Hapus Semua Data
        </DropdownMenuItem>
      </AlertDialogTrigger>
    </>
  );


  return (
    <div className="max-w-4xl mx-auto">
      <AlertDialog>
        <Card className="mb-8 shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="relative p-6 bg-card flex flex-col md:flex-row items-center gap-6">
            {isCurrentUserProfile && (
              <div className="absolute top-4 right-4 md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <SettingsMenuItemsContent />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            <div className="relative">
              <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-primary shadow-md">
                <AvatarImage src={profileUser.avatarUrl} alt={profileUser.username} data-ai-hint="portrait person large" />
                <AvatarFallback className="text-4xl font-headline">{profileUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              {isCurrentUserProfile && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleOpenEditProfileModal}
                  className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full p-2 bg-background border-2 border-primary/70 shadow-md md:hidden md:md:hover:bg-accent"
                  aria-label="Edit Profil"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col items-center md:items-start">
                {profileUser.fullName && <CardTitle className="font-headline text-3xl md:text-4xl text-foreground">{profileUser.fullName}</CardTitle>}
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
            </div>
            {isCurrentUserProfile ? (
                <div className="hidden md:flex md:items-center md:gap-2 md:absolute md:top-6 md:right-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenEditProfileModal}
                    className="md:hover:bg-accent md:hover:text-accent-foreground"
                  >
                    <Edit3 className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Edit Profil</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="px-2 w-9 md:hover:bg-accent md:hover:text-accent-foreground">
                        <Settings className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <SettingsMenuItemsContent />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
            ) : currentSessionUserId && (
                <div className="flex w-full justify-center items-center gap-2 mt-4 md:w-auto md:absolute md:top-6 md:right-6 md:mt-0">
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
                    <Button onClick={handleSendMessage} variant="outline" size="sm" className="px-3 md:hover:bg-accent md:hover:text-accent-foreground">
                        <MessageSquare className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Pesan</span>
                    </Button>
                </div>
            )}
          </CardHeader>
        </Card>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus semua data postingan dan pengguna secara permanen dari aplikasi ini di browser Anda.
              Data tidak dapat dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutAndDeleteAllData} className={cn(buttonVariants({ variant: "destructive" }), "md:hover:bg-destructive/90")}>
              Ya, Hapus Semua &amp; Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      
      <Dialog open={isEditProfileModalOpen} onOpenChange={setIsEditProfileModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <EditDialogTitle className="font-headline text-2xl flex items-center gap-2">
              <Edit3 className="h-6 w-6 text-primary"/>Edit Profil
            </EditDialogTitle>
            <DialogDescription>
               Perbarui informasi profil Anda. Email dan Nama Pengguna tidak dapat diubah.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] -mx-6 px-6">
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
          <DialogFooter className="mt-2 pt-4 border-t">
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
              Kelola siapa yang dapat melihat konten Anda.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-3">
              <Label htmlFor="account-type-switch" className="font-medium">Privasi Akun</Label>
              <div className="flex items-center space-x-3 p-3 border rounded-md bg-muted/30">
                <Switch
                  id="account-type-switch"
                  checked={editedAccountType === 'private'}
                  onCheckedChange={(checked) => setEditedAccountType(checked ? 'private' : 'public')}
                />
                <Label htmlFor="account-type-switch" className="text-sm flex items-center gap-1.5 cursor-pointer">
                  {editedAccountType === 'private' ? <Lock className="h-4 w-4"/> : <ShieldOff className="h-4 w-4"/>}
                  {editedAccountType === 'private' ? 'Akun Privat' : 'Akun Publik'}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground px-1">
                Jika akun privat, hanya pengikut yang Anda setujui yang dapat melihat postingan Anda. Permintaan mengikuti akan diperlukan untuk pengguna baru yang ingin mengikuti Anda.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrivacySettingsModalOpen(false)} className="md:hover:bg-accent md:hover:text-accent-foreground">Batal</Button>
            <Button onClick={handleSavePrivacySettings} className="md:hover:bg-primary/90"><Save className="mr-2 h-4 w-4"/>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-8 w-full max-w-2xl mx-auto">
        {canViewProfileContent ? (
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className={`grid w-full mb-6 bg-muted/50 rounded-lg ${isCurrentUserProfile ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="posts" className="font-headline"><LayoutGrid className="h-4 w-4 mr-2"/>Postingan</TabsTrigger>
              <TabsTrigger value="followers" className="font-headline">Pengikut</TabsTrigger>
              <TabsTrigger value="following" className="font-headline">Mengikuti</TabsTrigger>
              {isCurrentUserProfile && <TabsTrigger value="saved" className="font-headline"><Bookmark className="h-4 w-4 mr-2"/>Disimpan</TabsTrigger>}
            </TabsList>
            <TabsContent value="posts">
              <div className="mb-4">
                <Tabs defaultValue="all" onValueChange={(value) => setPostFilterType(value as 'all' | 'photo' | 'reel')}>
                  <TabsList className="grid w-full grid-cols-3 h-10 items-center p-1 text-muted-foreground bg-muted/50 rounded-lg">
                    <TabsTrigger value="all" className="font-headline"><LayoutGrid className="h-3.5 w-3.5 mr-1.5"/>Semua</TabsTrigger>
                    <TabsTrigger value="photo" className="font-headline"><ImageIconLucide className="h-3.5 w-3.5 mr-1.5"/>Foto</TabsTrigger>
                    <TabsTrigger value="reel" className="font-headline"><Video className="h-3.5 w-3.5 mr-1.5"/>Reels</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
                {filteredDisplayPosts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
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
                    Belum ada {postFilterType === 'photo' ? 'foto' : postFilterType === 'reel' ? 'reel' : 'postingan'}.
                  </p>
                )}
            </TabsContent>
            <TabsContent value="followers">
              <UserList userIds={profileUser.followers || []} allUsers={allUsers} listTitle="Pengikut" />
            </TabsContent>
            <TabsContent value="following">
              <UserList userIds={profileUser.following || []} allUsers={allUsers} listTitle="Mengikuti" />
            </TabsContent>
            {isCurrentUserProfile && (
              <TabsContent value="saved">
                {savedPostsForCurrentUser.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {savedPostsForCurrentUser.map(post => {
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
                  <p className="text-center text-muted-foreground py-8 font-body">Belum ada postingan yang disimpan.</p>
                )}
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
              <span className="font-medium font-headline text-foreground md:group-hover:text-primary">{user.username}</span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

