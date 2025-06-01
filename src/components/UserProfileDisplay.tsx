"use client";

import { useState, useEffect } from 'react';
import type { User, Post } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from './PostCard';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { initialUsers, initialPosts, getCurrentUserId } from '@/lib/data';
import { Settings, UserPlus, UserCheck, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";

interface UserProfileDisplayProps {
  userId: string;
}

export function UserProfileDisplay({ userId }: UserProfileDisplayProps) {
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  
  const [users, setUsers] = useLocalStorageState<User[]>('users', initialUsers);
  const [posts, setPosts] = useLocalStorageState<Post[]>('posts', initialPosts);
  
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentUserIdState(getCurrentUserId());
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
    if (!currentUserId || !profileUser || currentUserId === profileUser.id) return;

    setUsers(prevUsers => {
      return prevUsers.map(u => {
        if (u.id === currentUserId) { // Current user's following list
          const isFollowing = u.following.includes(profileUser.id);
          return {
            ...u,
            following: isFollowing 
              ? u.following.filter(id => id !== profileUser.id) 
              : [...u.following, profileUser.id]
          };
        }
        if (u.id === profileUser.id) { // Profile user's followers list
          const isFollowedByCurrentUser = u.followers.includes(currentUserId);
          return {
            ...u,
            followers: isFollowedByCurrentUser 
              ? u.followers.filter(id => id !== currentUserId)
              : [...u.followers, currentUserId]
          };
        }
        return u;
      });
    });
    const isCurrentlyFollowing = profileUser.followers.includes(currentUserId);
    toast({
        title: isCurrentlyFollowing ? "Unfollowed" : "Followed",
        description: `You are now ${isCurrentlyFollowing ? "no longer following" : "following"} ${profileUser.username}.`
    });
  };

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
    const newComment = {
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

  if (!profileUser) {
    return <div className="text-center py-10"><p className="text-xl text-muted-foreground font-headline">User not found.</p></div>;
  }

  const isCurrentUserProfile = currentUserId === profileUser.id;
  const isFollowing = currentUserId ? users.find(u=> u.id === currentUserId)?.following.includes(profileUser.id) : false;

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
            <div className="mt-5 flex justify-center md:justify-start gap-2">
              {isCurrentUserProfile ? (
                <>
                  <Button variant="outline" size="sm"><Edit3 className="mr-2 h-4 w-4" /> Edit Profile</Button>
                  <Button variant="ghost" size="icon"><Settings className="h-5 w-5 text-muted-foreground" /></Button>
                </>
              ) : (
                <Button onClick={handleFollowToggle} variant={isFollowing ? "secondary" : "default"} size="sm">
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
