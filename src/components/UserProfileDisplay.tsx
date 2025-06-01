
"use client";

import { useState, useEffect, ChangeEvent, useMemo } from 'react';
import type { User, Post, Comment as CommentType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from './PostCard';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { initialUsers, initialPosts, getCurrentUserId } from '@/lib/data';
import { Settings, UserPlus, UserCheck, Edit3, LogOut, Trash2, Image as ImageIcon, Save, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


interface UserProfileDisplayProps {
  userId: string;
}

export function UserProfileDisplay({ userId }: UserProfileDisplayProps) {
  const [profileUser, setProfileUser] = useState<User | null>(null);
  
  const [allUsers, setAllUsers] = useLocalStorageState<User[]>('users', initialUsers);
  const [allPosts, setAllPosts] = useLocalStorageState<Post[]>('posts', initialPosts);
  
  const [currentSessionUserId, setCurrentSessionUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [editedAvatarFile, setEditedAvatarFile] = useState<File | null>(null);
  const [editedAvatarPreview, setEditedAvatarPreview] = useState<string | null>(null);


  useEffect(() => {
    const CUID = getCurrentUserId();
    setCurrentSessionUserId(CUID);
    const foundUser = allUsers.find(u => u.id === userId);
    setProfileUser(foundUser || null);
    if (foundUser) {
      setEditedUsername(foundUser.username);
      setEditedAvatarPreview(foundUser.avatarUrl); 
    }
  }, [userId, allUsers]);

  const userPosts = useMemo(() => allPosts
    .filter(p => p.userId === userId && p.type !== 'story') // Exclude stories from main post list
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [allPosts, userId]);
  
  const userStories = useMemo(() => allPosts
    .filter(p => p.userId === userId && p.type === 'story')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [allPosts, userId]);


  const currentSessionUser = useMemo(() => {
    return allUsers.find(u => u.id === currentSessionUserId);
  }, [allUsers, currentSessionUserId]);
  
  const savedPostsForCurrentUser = useMemo(() => {
    if (!currentSessionUser) return [];
    return allPosts.filter(post => (currentSessionUser.savedPosts || []).includes(post.id))
                   .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [allPosts, currentSessionUser]);


  const handleFollowToggle = () => {
    if (!currentSessionUserId || !profileUser || currentSessionUserId === profileUser.id) return;

    const isCurrentlyFollowing = allUsers.find(u => u.id === currentSessionUserId)?.following.includes(profileUser.id);

    setAllUsers(prevUsers => {
      return prevUsers.map(u => {
        if (u.id === currentSessionUserId) { 
          const isFollowing = u.following.includes(profileUser.id);
          return {
            ...u,
            following: isFollowing 
              ? u.following.filter(id => id !== profileUser.id) 
              : [...u.following, profileUser.id]
          };
        }
        if (u.id === profileUser.id) { 
          const isFollowedByCurrentUser = u.followers.includes(currentSessionUserId);
          return {
            ...u,
            followers: isFollowedByCurrentUser 
              ? u.followers.filter(id => id !== currentSessionUserId)
              : [...u.followers, currentSessionUserId]
          };
        }
        return u;
      });
    });
    
    if (isCurrentlyFollowing) {
        toast({
            title: "Berhenti Mengikuti",
            description: `Anda sekarang tidak lagi mengikuti ${profileUser.username}.`
        });
    } else {
        toast({
            title: "Mulai Mengikuti",
            description: `Anda sekarang mengikuti ${profileUser.username}.`
        });
    }
  };

  const handleLikePost = (postId: string) => {
    if (!currentSessionUserId) return;
    setAllPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const likes = post.likes.includes(currentSessionUserId)
            ? post.likes.filter(uid => uid !== currentSessionUserId)
            : [...post.likes, currentSessionUserId];
          return { ...post, likes };
        }
        return post;
      })
    );
  };

  const handleAddComment = (postId: string, text: string) => {
    if (!currentSessionUserId) return;
    const newComment: CommentType = {
      id: `comment-${Date.now()}`,
      postId,
      userId: currentSessionUserId,
      text,
      timestamp: new Date().toISOString(),
      parentId: null,
      replies: [],
    };
    setAllPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      )
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
            : [...currentSavedPosts, postId];
          
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
    setAllUsers(initialUsers.map(u => ({...u, followers:[], following:[], savedPosts:[]}))); 
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authChange'));
      localStorage.removeItem('currentUserId');
      localStorage.setItem('posts', '[]'); 
      localStorage.setItem('users', JSON.stringify(initialUsers.map(u => ({...u, followers:[], following:[], savedPosts:[]})))); 
    }
    toast({
      title: "Data Dihapus & Berhasil Keluar",
      description: "Semua data aplikasi telah dihapus. Anda telah berhasil keluar.",
      variant: "destructive",
    });
    router.push('/login');
  };

  const handleOpenEditModal = () => {
    if (profileUser) {
      setEditedUsername(profileUser.username);
      setEditedAvatarPreview(profileUser.avatarUrl);
      setEditedAvatarFile(null); 
      setIsEditModalOpen(true);
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
    if (!profileUser || !currentSessionUserId || !editedUsername.trim()) {
      toast({
        title: "Gagal Menyimpan",
        description: "Nama pengguna tidak boleh kosong.",
        variant: "destructive",
      });
      return;
    }

    // Check if username already exists (excluding the current user's username if it hasn't changed)
    const trimmedNewUsername = editedUsername.trim();
    if (trimmedNewUsername.toLowerCase() !== profileUser.username.toLowerCase()) {
        const usernameExists = allUsers.some(
        (user) => user.id !== currentSessionUserId && user.username.toLowerCase() === trimmedNewUsername.toLowerCase()
        );
        if (usernameExists) {
        toast({
            title: "Nama Pengguna Sudah Ada",
            description: "Nama pengguna ini sudah digunakan. Silakan pilih yang lain.",
            variant: "destructive",
        });
        return;
        }
    }


    setAllUsers(prevUsers => 
      prevUsers.map(user => {
        if (user.id === currentSessionUserId) {
          return {
            ...user,
            username: editedUsername.trim(),
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
    setIsEditModalOpen(false);
  };


  if (!profileUser) {
    return <div className="text-center py-10"><p className="text-xl text-muted-foreground font-headline">Pengguna tidak ditemukan.</p></div>;
  }

  const isCurrentUserProfile = currentSessionUserId === profileUser.id;
  const isFollowing = currentSessionUserId ? allUsers.find(u=> u.id === currentSessionUserId)?.following.includes(profileUser.id) : false;

  const allProfilePosts = [...userStories, ...userPosts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());


  return (
    <div className="max-w-4xl mx-auto">
      <AlertDialog>
        <Card className="mb-8 shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="p-6 bg-card flex flex-col md:flex-row items-center gap-6 relative">
            <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-primary shadow-md">
              <AvatarImage src={profileUser.avatarUrl} alt={profileUser.username} data-ai-hint="portrait person large" />
              <AvatarFallback className="text-4xl font-headline">{profileUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <CardTitle className="font-headline text-3xl md:text-4xl text-foreground">{profileUser.username}</CardTitle>
              {profileUser.bio && <p className="text-muted-foreground mt-2 font-body text-sm md:text-base">{profileUser.bio}</p>}
              <div className="flex justify-center md:justify-start gap-4 mt-4 text-sm">
                <div><span className="font-semibold">{allProfilePosts.length}</span> Postingan</div>
                <div><span className="font-semibold">{profileUser.followers.length}</span> Pengikut</div>
                <div><span className="font-semibold">{profileUser.following.length}</span> Mengikuti</div>
              </div>
            </div>
            {isCurrentUserProfile ? (
              <div className="flex w-full justify-center items-center gap-2 mt-4 md:w-auto md:absolute md:top-4 md:right-4 md:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEditModal}
                >
                  <Edit3 className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Edit Profil</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 w-9" 
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleLogoutAndSaveData}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Keluar & Simpan Data
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                       <DropdownMenuItem
                        className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                        onSelect={(e) => e.preventDefault()} 
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Keluar & Hapus Semua Data
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : currentSessionUserId && ( 
                <div className="flex w-full justify-center items-center mt-4 md:w-auto md:absolute md:top-6 md:right-6 md:mt-0">
                    <Button onClick={handleFollowToggle} variant={isFollowing ? "secondary" : "default"} size="sm">
                    {isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    {isFollowing ? 'Mengikuti' : 'Ikuti'}
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
            <AlertDialogAction onClick={handleLogoutAndDeleteAllData} className={buttonVariants({ variant: "destructive" })}>
              Ya, Hapus Semua &amp; Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl flex items-center gap-2">
              <Edit3 className="h-6 w-6 text-primary"/>Edit Profil
            </DialogTitle>
            <DialogDescription>
              Perbarui nama pengguna dan gambar profil Anda di sini. Klik simpan jika sudah selesai.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username" className="font-medium">Nama Pengguna</Label>
              <Input
                id="edit-username"
                value={editedUsername}
                onChange={(e) => setEditedUsername(e.target.value)}
                className="mt-1"
                placeholder="Masukkan nama pengguna baru"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-avatar" className="font-medium">Gambar Profil</Label>
              <Input
                id="edit-avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
            <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4"/>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Tabs defaultValue="posts" className="w-full">
        <TabsList className={`grid w-full mb-6 bg-muted/50 rounded-lg ${isCurrentUserProfile ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="posts" className="font-headline">Postingan</TabsTrigger>
          <TabsTrigger value="followers" className="font-headline">Pengikut</TabsTrigger>
          <TabsTrigger value="following" className="font-headline">Mengikuti</TabsTrigger>
          {isCurrentUserProfile && <TabsTrigger value="saved" className="font-headline">Disimpan</TabsTrigger>}
        </TabsList>
        <TabsContent value="posts">
          {allProfilePosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {allProfilePosts.map(post => {
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
            <p className="text-center text-muted-foreground py-8 font-body">Belum ada postingan.</p>
          )}
        </TabsContent>
        <TabsContent value="followers">
          <UserList userIds={profileUser.followers} allUsers={allUsers} listTitle="Pengikut" />
        </TabsContent>
        <TabsContent value="following">
          <UserList userIds={profileUser.following} allUsers={allUsers} listTitle="Mengikuti" />
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
            <Link href={`/profile/${user.id}`} key={id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-md transition-colors group">
              <Avatar className="h-10 w-10 border group-hover:border-primary">
                <AvatarImage src={user.avatarUrl} alt={user.username} data-ai-hint="portrait person"/>
                <AvatarFallback>{user.username.substring(0,1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-medium font-headline text-foreground group-hover:text-primary">{user.username}</span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

