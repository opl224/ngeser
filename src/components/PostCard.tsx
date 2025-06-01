
"use client";

import Image from 'next/image';
import type { Post, User, Comment as CommentType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Heart, MessageCircle, Share2, MoreHorizontal, PlayCircle, Edit, Trash2, Link2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';
import { Textarea } from './ui/textarea';
import { initialUsers, getCurrentUserId } from '@/lib/data';
import useLocalStorageState from '@/hooks/useLocalStorageState';
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface PostCardProps {
  post: Post;
  onLikePost: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onUpdatePostCaption: (postId: string, newCaption: string) => void;
  onDeletePost: (postId: string) => void;
}

export function PostCard({ post, onLikePost, onAddComment, onUpdatePostCaption, onDeletePost }: PostCardProps) {
  const [author, setAuthor] = useState<User | undefined>(undefined);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [users] = useLocalStorageState<User[]>('users', initialUsers);
  const { toast } = useToast();

  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editedCaption, setEditedCaption] = useState(post.caption);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);


  useEffect(() => {
    setCurrentUserIdState(getCurrentUserId());
    const postAuthor = users.find(u => u.id === post.userId);
    setAuthor(postAuthor);
    setEditedCaption(post.caption);
  }, [post.userId, post.caption, users]);

  const handleCommentSubmit = () => {
    if (newComment.trim()) {
      onAddComment(post.id, newComment.trim());
      setNewComment('');
    }
  };

  const handleSaveCaption = () => {
    if (editedCaption.trim() !== post.caption) {
      onUpdatePostCaption(post.id, editedCaption.trim());
      toast({ title: "Caption Updated", description: "Your post caption has been successfully updated." });
    }
    setIsEditingCaption(false);
  };

  const confirmDeletePost = () => {
    onDeletePost(post.id);
    toast({ title: "Post Deleted", description: "The post has been successfully deleted.", variant: "destructive" });
    setShowDeleteConfirm(false);
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(postUrl)
      .then(() => {
        toast({ title: "Link Copied!", description: "Post link copied to clipboard." });
      })
      .catch(err => {
        console.error("Failed to copy link: ", err);
        toast({ title: "Error", description: "Could not copy link.", variant: "destructive" });
      });
  };

  const handleShareToSocial = () => {
    toast({ title: "Coming Soon!", description: "This feature will be available in a future update." });
  };

  const isLiked = currentUserId ? post.likes.includes(currentUserId) : false;
  const isOwner = currentUserId === post.userId;

  if (!author) {
    return (
      <Card className="w-full max-w-2xl mx-auto my-4 shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="p-4">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-muted h-12 w-12"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </CardHeader>
        <div className="animate-pulse bg-muted aspect-video w-full"></div>
        <CardContent className="p-4 space-y-2">
           <div className="h-4 bg-muted rounded w-full"></div>
           <div className="h-4 bg-muted rounded w-5/6"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto my-6 shadow-lg rounded-xl overflow-hidden bg-card">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <Link href={`/profile/${author.id}`} className="flex items-center gap-3 group">
            <Avatar className="h-11 w-11 border-2 border-primary/50 group-hover:border-primary transition-colors">
              <AvatarImage src={author.avatarUrl} alt={author.username} data-ai-hint="portrait person" />
              <AvatarFallback>{author.username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-headline group-hover:text-primary transition-colors">{author.username}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
              </p>
            </div>
          </Link>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setEditedCaption(post.caption); setIsEditingCaption(true); }}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit Caption</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Post</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>

        <div 
          className="relative aspect-square sm:aspect-video bg-muted/30 cursor-pointer"
          onClick={() => setIsMediaModalOpen(true)}
        >
          {post.type === 'photo' ? (
           <Image src={post.mediaUrl} alt={post.caption || 'Post image'} layout="fill" objectFit="cover" data-ai-hint="social media image" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
             <Image src={post.mediaUrl} alt={post.caption || 'Post media'} layout="fill" objectFit="cover" data-ai-hint="social media video" />
            <PlayCircle className="absolute h-16 w-16 text-background/70" />
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-body text-foreground leading-relaxed">{post.caption}</p>
          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.hashtags.map(tag => (
                <Link key={tag} href={`/search?q=${tag}`} className="text-xs text-primary hover:underline font-medium">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col items-start p-4 gap-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => onLikePost(post.id)} className="flex items-center gap-1.5 px-2 text-muted-foreground hover:text-destructive">
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-destructive text-destructive' : ''}`} />
                <span className="text-sm">{post.likes.length}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 px-2 text-muted-foreground hover:text-primary">
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm">{post.comments.length}</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1.5 px-2 text-muted-foreground hover:text-accent" disabled>
                    <Share2 className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleShareToSocial}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Share to Social Media</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <Link2 className="mr-2 h-4 w-4" />
                    <span>Copy Link</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {showComments && (
            <div className="w-full mt-3 space-y-3">
              <Separator />
              {post.comments.slice(0,2).map(comment => {
                 const commentAuthor = users.find(u => u.id === comment.userId);
                 return(
                  <div key={comment.id} className="flex items-start gap-2.5 text-sm">
                    <Avatar className="h-7 w-7 mt-0.5">
                      <AvatarImage src={commentAuthor?.avatarUrl} alt={commentAuthor?.username} data-ai-hint="portrait person small"/>
                      <AvatarFallback>{commentAuthor?.username.substring(0,1)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-semibold font-headline text-foreground/90">{commentAuthor?.username}</span>
                      <p className="text-foreground/80 font-body">{comment.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</p>
                    </div>
                  </div>
                 );
              })}
              {post.comments.length > 2 && (
                  <Link href={`/post/${post.id}`} className="text-xs text-primary hover:underline font-medium">
                      View all {post.comments.length} comments
                  </Link>
              )}
              <div className="flex gap-2 mt-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="text-sm min-h-[40px] flex-grow resize-none"
                  rows={1}
                />
                <Button size="sm" onClick={handleCommentSubmit} disabled={!newComment.trim()}>Post</Button>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>

      <Dialog open={isEditingCaption} onOpenChange={setIsEditingCaption}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-headline">Edit Caption</DialogTitle>
            <DialogDescription>
              Make changes to your post caption here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              id="edit-caption"
              value={editedCaption}
              onChange={(e) => setEditedCaption(e.target.value)}
              className="min-h-[100px]"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingCaption(false)}>Cancel</Button>
            <Button onClick={handleSaveCaption}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post
              and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {post && (
        <Dialog open={isMediaModalOpen} onOpenChange={setIsMediaModalOpen}>
          <DialogContent className="sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-7xl w-auto max-h-[95vh] p-2 bg-background flex items-center justify-center">
            <DialogHeader className="sr-only">
              <DialogTitle>Full Media View</DialogTitle>
            </DialogHeader>
            {post.type === 'photo' ? (
              <Image
                src={post.mediaUrl}
                alt={post.caption || 'Post image'}
                width={1920} 
                height={1080}
                objectFit="contain"
                className="rounded-md max-w-full max-h-[calc(95vh-2rem)]" 
                data-ai-hint="social media image full"
              />
            ) : (
              <video
                src={post.mediaUrl}
                controls
                autoPlay
                className="rounded-md max-w-full max-h-[calc(95vh-2rem)]"
                data-ai-hint="social media video full"
              >
                Your browser does not support the video tag.
              </video>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
