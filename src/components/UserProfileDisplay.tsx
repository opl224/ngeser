
"use client";

import { useState, useEffect } from 'react';
import type { User, Post, Comment as CommentType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from './PostCard';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { initialUsers, initialPosts, getCurrentUserId } from '@/lib/data';
import { Settings, UserPlus, UserCheck, Edit3, LogOut, Trash2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"

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

  useEffect(() => {
    setCurrentSessionUserId(getCurrentUserId());
    const foundUser = allUsers.find(u => u.id === userId);
    setProfileUser(foundUser || null);
  }, [userId, allUsers]);

  const userPosts = allPosts
    .filter(p => p.userId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleFollowToggle = () => {
    if (!currentSessionUserId || !profileUser || currentSessionUserId === profileUser.id) return;

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
    const isCurrentlyFollowing = profileUser.followers.includes(currentSessionUserId);
    toast({
        title: isCurrentlyFollowing ? "Berhenti Mengikuti" : "Mulai Mengikuti",
        description: `Anda sekarang ${isCurrentlyFollowing ? "tidak lagi mengikuti" : "mengikuti"} ${profileUser.username}.`
    });
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
    setAllUsers([]); 
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authChange'));
      localStorage.removeItem('currentUserId');
      localStorage.setItem('posts', '[]'); 
      localStorage.setItem('users', '[]'); 
    }
    toast({
      title: "Data Dihapus & Berhasil Keluar",
      description: "Semua data aplikasi telah dihapus. Anda telah berhasil keluar.",
      variant: "destructive",
    });
    router.push('/login');
  };


  if (!profileUser) {
    return <div className="text-center py-10"><p className="text-xl text-muted-foreground font-headline">Pengguna tidak ditemukan.</p></div>;
  }

  const isCurrentUserProfile = currentSessionUserId === profileUser.id;
  const isFollowing = currentSessionUserId ? allUsers.find(u=> u.id === currentSessionUserId)?.following.includes(profileUser.id) : false;

  return (
    <div className="max-w-4xl mx-auto">
      <AlertDialog> {/* Moved AlertDialog to wrap the part that needs it */}
        <Card className="mb-8 shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="p-6 bg-card flex flex-col md:flex-row items-center gap-6 relative"> {/* Added relative for positioning context */}
            <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-primary shadow-md">
              <AvatarImage src={profileUser.avatarUrl} alt={profileUser.username} data-ai-hint="portrait person large" />
              <AvatarFallback className="text-4xl font-headline">{profileUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <CardTitle className="font-headline text-3xl md:text-4xl text-foreground">{profileUser.username}</CardTitle>
              {profileUser.bio && <p className="text-muted-foreground mt-2 font-body text-sm md:text-base">{profileUser.bio}</p>}
              <div className="flex justify-center md:justify-start gap-4 mt-4 text-sm">
                <div><span className="font-semibold">{userPosts.length}</span> Postingan</div>
                <div><span className="font-semibold">{profileUser.followers.length}</span> Pengikut</div>
                <div><span className="font-semibold">{profileUser.following.length}</span> Mengikuti</div>
              </div>
            </div>
             {/* Actions for current user: Edit Profile and Settings Dropdown */}
            {isCurrentUserProfile && (
              <div className="md:absolute md:top-6 md:right-6 flex gap-2 mt-4 md:mt-0 flex-wrap justify-center md:justify-end">
                <Button variant="outline" size="sm"><Edit3 className="mr-2 h-4 w-4" /> Edit Profil</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent">
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
                        onSelect={(e) => e.preventDefault()} // Prevent dropdown closing before dialog opens
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Keluar & Hapus Semua Data
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            {/* Follow/Unfollow button for other users */}
            {!isCurrentUserProfile && currentSessionUserId && (
              <div className="md:absolute md:top-6 md:right-6 mt-4 md:mt-0">
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


      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 rounded-lg">
          <TabsTrigger value="posts" className="font-headline">Postingan</TabsTrigger>
          <TabsTrigger value="followers" className="font-headline">Pengikut</TabsTrigger>
          <TabsTrigger value="following" className="font-headline">Mengikuti</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          {userPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {userPosts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onLikePost={handleLikePost} 
                  onAddComment={handleAddComment} 
                  onUpdatePostCaption={handleUpdatePostCaptionOnProfile}
                  onDeletePost={handleDeletePostOnProfile}
                />
              ))}
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


    