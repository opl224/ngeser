
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
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  
  const [users, setUsers] = useLocalStorageState<User[]>('users', initialUsers);
  const [posts, setPosts] = useLocalStorageState<Post[]>('posts', initialPosts);
  
  const [currentSessionUserId, setCurrentSessionUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setCurrentSessionUserId(getCurrentUserId());
    const foundUser = users.find(u => u.id === userId);
    setProfileUser(foundUser || null);
    if (foundUser) {
      const foundPosts = posts
        .filter(p => p.userId === userId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setUserPosts(foundPosts);
    }
  }, [userId, users, posts]);

  const handleFollowToggle = () => {
    if (!currentSessionUserId || !profileUser || currentSessionUserId === profileUser.id) return;

    setUsers(prevUsers => {
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
        title: isCurrentlyFollowing ? "Unfollowed" : "Followed",
        description: `You are now ${isCurrentlyFollowing ? "no longer following" : "following"} ${profileUser.username}.`
    });
  };

  const handleLikePost = (postId: string) => {
    if (!currentSessionUserId) return;
    setPosts(prevPosts =>
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
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      )
    );
  };

  const handleLogoutAndSaveData = () => {
    if (typeof window !== 'undefined') {
      // Dispatch an event to notify AppNavbar to update its state
      window.dispatchEvent(new CustomEvent('authChange'));
      localStorage.removeItem('currentUserId');
    }
    toast({
      title: "Logged Out",
      description: "Your data is saved. You have been logged out.",
    });
    router.push('/login');
  };

  const handleLogoutAndDeleteAllData = () => {
    setPosts([]); 
    setUsers([]); 
    if (typeof window !== 'undefined') {
      // Dispatch an event to notify AppNavbar to update its state
      window.dispatchEvent(new CustomEvent('authChange'));
      localStorage.removeItem('currentUserId');
      localStorage.setItem('posts', '[]'); // Explicitly set to empty array
      localStorage.setItem('users', '[]'); // Explicitly set to empty array
    }
    toast({
      title: "Data Deleted & Logged Out",
      description: "All app data has been deleted. You have been logged out.",
      variant: "destructive",
    });
    router.push('/login');
  };


  if (!profileUser) {
    return <div className="text-center py-10"><p className="text-xl text-muted-foreground font-headline">User not found.</p></div>;
  }

  const isCurrentUserProfile = currentSessionUserId === profileUser.id;
  const isFollowing = currentSessionUserId ? users.find(u=> u.id === currentSessionUserId)?.following.includes(profileUser.id) : false;

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-8 shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="p-6 bg-card flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-primary shadow-md">
            <AvatarImage src={profileUser.avatarUrl} alt={profileUser.username} data-ai-hint="portrait person large" />
            <AvatarFallback className="text-4xl font-headline">{profileUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left">
            <CardTitle className="font-headline text-3xl md:text-4xl text-foreground">{profileUser.username}</CardTitle>
            {profileUser.bio && <p className="text-muted-foreground mt-2 font-body text-sm md:text-base">{profileUser.bio}</p>}
            <div className="flex justify-center md:justify-start gap-4 mt-4 text-sm">
              <div><span className="font-semibold">{userPosts.length}</span> Posts</div>
              <div><span className="font-semibold">{profileUser.followers.length}</span> Followers</div>
              <div><span className="font-semibold">{profileUser.following.length}</span> Following</div>
            </div>
            <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-2">
              {isCurrentUserProfile ? (
                <>
                  <Button variant="outline" size="sm"><Edit3 className="mr-2 h-4 w-4" /> Edit Profile</Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent"><Settings className="h-5 w-5" /></Button>
                  <Button variant="outline" size="sm" onClick={handleLogoutAndSaveData}>
                    <LogOut className="mr-2 h-4 w-4" /> Keluar &amp; Simpan Data
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" /> Keluar &amp; Hapus Semua Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
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
                </>
              ) : (
                <Button onClick={handleFollowToggle} variant={isFollowing ? "secondary" : "default"} size="sm" disabled={!currentSessionUserId}>
                  {isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 rounded-lg">
          <TabsTrigger value="posts" className="font-headline">Posts</TabsTrigger>
          <TabsTrigger value="followers" className="font-headline">Followers</TabsTrigger>
          <TabsTrigger value="following" className="font-headline">Following</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          {userPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {userPosts.map(post => (
                <PostCard key={post.id} post={post} onLikePost={handleLikePost} onAddComment={handleAddComment} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8 font-body">No posts yet.</p>
          )}
        </TabsContent>
        <TabsContent value="followers">
          <UserList userIds={profileUser.followers} allUsers={users} listTitle="Followers" />
        </TabsContent>
        <TabsContent value="following">
          <UserList userIds={profileUser.following} allUsers={users} listTitle="Following" />
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
    return <p className="text-center text-muted-foreground py-8 font-body">No users in this list yet.</p>;
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
