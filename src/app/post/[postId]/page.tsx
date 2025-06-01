
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import type { Post, User, Comment as CommentType } from '@/lib/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { initialPosts, initialUsers, getCurrentUserId } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, PlayCircle, CornerUpLeft } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import React from 'react'; // Import React

interface CommentItemProps {
  comment: CommentType;
  allUsers: User[];
  currentUserId: string | null;
  onReply: (commentId: string, text: string) => void;
  level?: number;
}

function CommentItem({ comment, allUsers, currentUserId, onReply, level = 0 }: CommentItemProps) {
  const author = allUsers.find(u => u.id === comment.userId);
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReplySubmit = () => {
    if (replyText.trim() && currentUserId) {
      onReply(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
    }
  };

  return (
    <div className={`ml-${level * 4} py-2`}>
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 mt-1">
          <AvatarImage src={author?.avatarUrl} alt={author?.username} data-ai-hint="portrait person small" />
          <AvatarFallback>{author?.username.substring(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 bg-muted/30 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <Link href={`/profile/${author?.id}`} className="font-headline text-sm font-semibold hover:underline">{author?.username}</Link>
            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</span>
          </div>
          <p className="text-sm font-body mt-1 text-foreground/90">{comment.text}</p>
          <Button variant="ghost" size="xs" className="mt-1 text-xs text-muted-foreground hover:text-primary p-1 h-auto" onClick={() => setShowReplyForm(!showReplyForm)}>
            <CornerUpLeft className="h-3 w-3 mr-1"/> Reply
          </Button>
        </div>
      </div>
      {showReplyForm && currentUserId && (
        <div className={`ml-${(level + 1) * 4 + 4} mt-2 flex gap-2 items-center`}>
          <Textarea
            placeholder={`Replying to ${author?.username}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="text-sm min-h-[40px] flex-grow resize-none"
            rows={1}
          />
          <Button size="sm" onClick={handleReplySubmit} disabled={!replyText.trim()}><Send className="h-4 w-4"/></Button>
        </div>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} allUsers={allUsers} currentUserId={currentUserId} onReply={onReply} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}


export default function PostPage() {
  const params = useParams();
  const postId = params?.postId as string;
  const { toast } = useToast();

  const [posts, setPosts] = useLocalStorageState<Post[]>('posts', initialPosts);
  const [users] = useLocalStorageState<User[]>('users', initialUsers);
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  
  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    setCurrentUserIdState(getCurrentUserId());
    if (postId) {
      const foundPost = posts.find(p => p.id === postId);
      if (foundPost) {
        setPost(foundPost);
        const foundAuthor = users.find(u => u.id === foundPost.userId);
        setAuthor(foundAuthor || null);
      }
    }
  }, [postId, posts, users]);

  const handleLikePost = () => {
    if (!post || !currentUserId) return;
    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id === post.id) {
          const likes = p.likes.includes(currentUserId)
            ? p.likes.filter(uid => uid !== currentUserId)
            : [...p.likes, currentUserId];
          const updatedPost = { ...p, likes };
          setPost(updatedPost); // Update local state for immediate UI feedback
          return updatedPost;
        }
        return p;
      })
    );
  };

  const addCommentToThread = (comments: CommentType[], parentId: string, newReply: CommentType): CommentType[] => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return { ...comment, replies: [...(comment.replies || []), newReply] };
      }
      if (comment.replies && comment.replies.length > 0) {
        return { ...comment, replies: addCommentToThread(comment.replies, parentId, newReply) };
      }
      return comment;
    });
  };

  const handleAddComment = (text: string, parentId?: string) => {
    if (!post || !currentUserId || !text.trim()) return;

    const newComment: CommentType = {
      id: `comment-${Date.now()}`,
      postId: post.id,
      userId: currentUserId,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      parentId: parentId || null,
      replies: [],
    };
    
    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id === post.id) {
          let updatedComments;
          if (parentId) {
            updatedComments = addCommentToThread(p.comments, parentId, newComment);
          } else {
            updatedComments = [...p.comments, newComment];
          }
          const updatedPost = { ...p, comments: updatedComments };
          setPost(updatedPost); // Update local state for immediate UI feedback
          return updatedPost;
        }
        return p;
      })
    );
    if (!parentId) setNewCommentText(''); // Clear main comment box only
    toast({ title: "Comment added!", description: "Your comment has been posted." });
  };


  if (!post || !author) {
    return (
      <div className="container mx-auto max-w-2xl py-8 text-center">
        <p className="font-headline text-xl">Loading post...</p>
      </div>
    );
  }

  const isLiked = currentUserId ? post.likes.includes(currentUserId) : false;
  
  // Sort comments by timestamp, newest first for root comments
  const sortedRootComments = [...post.comments.filter(c => !c.parentId)].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());


  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card className="w-full shadow-lg rounded-xl overflow-hidden bg-card">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <Link href={`/profile/${author.id}`} className="flex items-center gap-3 group">
            <Avatar className="h-11 w-11 border-2 border-primary/50 group-hover:border-primary transition-colors">
              <AvatarImage src={author.avatarUrl} alt={author.username} data-ai-hint="portrait person"/>
              <AvatarFallback>{author.username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-headline group-hover:text-primary transition-colors">{author.username}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
              </p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </CardHeader>

        <div className="relative aspect-square sm:aspect-video bg-muted/30">
          {post.type === 'photo' ? (
            <Image src={post.mediaUrl} alt={post.caption || 'Post image'} layout="fill" objectFit="cover" data-ai-hint="social media image"/>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
               <Image src={post.mediaUrl} alt={post.caption || 'Post media'} layout="fill" objectFit="cover" data-ai-hint="social media video"/>
              <PlayCircle className="absolute h-16 w-16 text-background/70" />
            </div>
          )}
        </div>
        
        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-body text-foreground leading-relaxed">{post.caption}</p>
          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.hashtags.map(tag => (
                <span key={tag} className="text-xs text-primary font-medium">#{tag}</span>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col items-start p-4 gap-3">
          <div className="flex items-center justify-start w-full gap-4">
            <Button variant="ghost" size="sm" onClick={handleLikePost} className="flex items-center gap-1.5 px-2 text-muted-foreground hover:text-destructive">
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-destructive text-destructive' : ''}`} />
              <span>{post.likes.length}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-1.5 px-2 text-muted-foreground hover:text-primary">
              <MessageCircle className="h-5 w-5" />
              <span>{post.comments.length + post.comments.reduce((acc, curr) => acc + (curr.replies?.length || 0), 0) }</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-1.5 px-2 text-muted-foreground hover:text-accent">
              <Share2 className="h-5 w-5" />
              <span>{post.shareCount}</span>
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card className="mt-6 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Comments</CardTitle>
        </CardHeader>
        <CardContent>
          {currentUserId && (
            <div className="flex gap-2 mb-6 items-start">
              <Avatar className="h-10 w-10 mt-1">
                <AvatarImage src={users.find(u=>u.id === currentUserId)?.avatarUrl} data-ai-hint="portrait person small"/>
                <AvatarFallback>{users.find(u=>u.id === currentUserId)?.username.substring(0,1)}</AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="Add a public comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="text-sm min-h-[60px] flex-grow resize-none"
                rows={2}
              />
              <Button size="default" onClick={() => handleAddComment(newCommentText)} disabled={!newCommentText.trim()} className="self-end">
                <Send className="h-4 w-4 mr-2"/>Post
              </Button>
            </div>
          )}
          <Separator className="my-4"/>
          {sortedRootComments.length > 0 ? (
            <div className="space-y-4">
              {sortedRootComments.map(comment => (
                <CommentItem key={comment.id} comment={comment} allUsers={users} currentUserId={currentUserId} onReply={(parentId, text) => handleAddComment(text, parentId)} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
