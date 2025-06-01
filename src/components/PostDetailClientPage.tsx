
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation'; 
import Image from 'next/image';
import type { Post, User, Comment as CommentType } from '@/lib/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { initialPosts, initialUsers, getCurrentUserId } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, PlayCircle, CornerUpLeft, Edit, Trash2, Link2, Eye, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import React from 'react';
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
  DialogHeader as DialogHead, 
  DialogTitle as DialogTitl,   
  DialogDescription as DialogDesc, 
  DialogFooter as DialogFoot,     
} from "@/components/ui/dialog";


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

  const paddingClasses = ['pl-0', 'pl-4', 'pl-8', 'pl-12', 'pl-16', 'pl-20'];
  const currentPadding = paddingClasses[level] ?? `pl-${level * 4}`;
  const replyFormPadding = paddingClasses[level + 1] ?? `pl-${(level + 1) * 4}`;

  return (
    <div className={`${currentPadding} py-2`}>
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 mt-1">
          <AvatarImage src={author?.avatarUrl} alt={author?.username} data-ai-hint="portrait person small" />
          <AvatarFallback>{author?.username.substring(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 bg-muted/30 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <Link href={`/profile/${author?.id}`} className="font-headline text-sm font-semibold hover:underline">{author?.username}</Link>
            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: localeID })}</span>
          </div>
          <p className="text-sm font-body mt-1 text-foreground/90">{comment.text}</p>
          {currentUserId && (
            <Button variant="ghost" size="xs" className="mt-1 text-xs text-muted-foreground hover:text-primary p-1 h-auto" onClick={() => setShowReplyForm(!showReplyForm)}>
              <CornerUpLeft className="h-3 w-3 mr-1"/> Balas
            </Button>
          )}
        </div>
      </div>
      {showReplyForm && currentUserId && (
        <div className={`${replyFormPadding} mt-2 flex gap-2 items-center`}>
          <Textarea
            placeholder={`Membalas ${author?.username}...`}
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

interface PostDetailClientPageProps {
  postId: string;
}

export function PostDetailClientPage({ postId }: PostDetailClientPageProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [allPosts, setAllPosts] = useLocalStorageState<Post[]>('posts', initialPosts);
  const [users, setUsers] = useLocalStorageState<User[]>('users', initialUsers);
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);

  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editedCaption, setEditedCaption] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);


  useEffect(() => {
    const CUID = getCurrentUserId();
    setCurrentUserIdState(CUID);
    if (postId) {
      const foundPost = allPosts.find(p => p.id === postId);
      if (foundPost) {
        // Only increment viewCount if it's the first time this specific post state is set, or if the count hasn't been incremented in this session yet for this post.
        // This very basic check helps avoid incrementing on every re-render after a state change to this post.
        // A more robust solution might involve a session-based flag or only incrementing when `post` was previously null.
        if (!post || post.id !== foundPost.id || (post && post.viewCount === foundPost.viewCount) ) {
            const postToUpdate = { ...foundPost };
            if (typeof postToUpdate.viewCount !== 'number' || isNaN(postToUpdate.viewCount)) {
              postToUpdate.viewCount = 0;
            }
            postToUpdate.viewCount += 1;
            
            setPost(postToUpdate);
            setAllPosts(prevAllPosts => prevAllPosts.map(p => p.id === postId ? postToUpdate : p));
            setEditedCaption(postToUpdate.caption);
        } else if (post && post.id === foundPost.id) { // If post is already set and matches foundPost, just update caption if it changed
            setEditedCaption(foundPost.caption);
        }


        const foundAuthor = users.find(u => u.id === (post || foundPost).userId);
        setAuthor(foundAuthor || null);
      } else {
         router.push('/'); 
      }
    }
  }, [postId, users, router, setAllPosts, allPosts]); // allPosts is needed to react to external changes

  // This effect ensures that if allPosts is updated (e.g. by another component interaction like liking from a feed),
  // the local `post` state reflects the latest version from `allPosts`.
  useEffect(() => {
    if (postId) {
        const currentVersionOfPostInAllPosts = allPosts.find(p => p.id === postId);
        if (currentVersionOfPostInAllPosts && JSON.stringify(currentVersionOfPostInAllPosts) !== JSON.stringify(post)) {
            setPost(currentVersionOfPostInAllPosts);
            setEditedCaption(currentVersionOfPostInAllPosts.caption);
        }
    }
  }, [allPosts, postId, post]);


  const currentUser = useMemo(() => {
    return users.find(u => u.id === currentUserId);
  }, [users, currentUserId]);

  const handleLikePost = () => {
    if (!post || !currentUserId) return;
    const updatedPosts = allPosts.map(p => {
      if (p.id === post.id) {
        const likes = p.likes.includes(currentUserId)
          ? p.likes.filter(uid => uid !== currentUserId)
          : [...p.likes, currentUserId];
        const updatedPostResult = { ...p, likes };
        // setPost(updatedPostResult); // Let the useEffect linked to allPosts handle this
        return updatedPostResult;
      }
      return p;
    });
    setAllPosts(updatedPosts); 
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

    const updatedPosts = allPosts.map(p => {
      if (p.id === post.id) {
        let updatedComments;
        if (parentId) {
          updatedComments = addCommentToThread(p.comments, parentId, newComment);
        } else {
          updatedComments = [...p.comments, newComment];
        }
        const updatedPostResult = { ...p, comments: updatedComments };
        // setPost(updatedPostResult); // Let useEffect handle this
        return updatedPostResult;
      }
      return p;
    });
    setAllPosts(updatedPosts);
    if (!parentId) setNewCommentText('');
    toast({ title: "Komentar ditambahkan!", description: "Komentar Anda telah diposting." });
  };

  const handleSaveEditedCaption = () => {
    if (!post || editedCaption.trim() === post.caption) {
      setIsEditingCaption(false);
      return;
    }
    const updatedPosts = allPosts.map(p =>
      p.id === post.id ? { ...p, caption: editedCaption.trim() } : p
    );
    setAllPosts(updatedPosts);
    // setPost(prev => prev ? { ...prev, caption: editedCaption.trim() } : null); // Let useEffect handle this
    setIsEditingCaption(false);
    toast({ title: "Keterangan Diperbarui", description: "Keterangan postingan telah diperbarui." });
  };

  const confirmDeletePostAction = () => {
    if (!post) return;
    const remainingPosts = allPosts.filter(p => p.id !== post.id);
    setAllPosts(remainingPosts);
    toast({ title: "Postingan Dihapus", description: "Postingan telah berhasil dihapus.", variant: "destructive" });
    setShowDeleteConfirm(false);
    router.push('/');
  };

  const handleCopyLink = () => {
    if (!post) return;
    const postUrl = window.location.href; 
    navigator.clipboard.writeText(postUrl)
      .then(() => {
        toast({ title: "Tautan Disalin!", description: "Tautan postingan disalin ke clipboard." });
      })
      .catch(err => {
        console.error("Gagal menyalin tautan: ", err);
        toast({ title: "Kesalahan", description: "Tidak dapat menyalin tautan.", variant: "destructive" });
      });
  };

  const handleShareToSocial = () => {
    toast({ title: "Segera Hadir!", description: "Fitur ini akan tersedia di pembaruan mendatang." });
  };

  const handleToggleSavePost = () => {
    if (!post || !currentUserId) return;
    let toastInfo: { title: string; description: string } | null = null;

    setUsers(prevUsers => {
      const newUsers = prevUsers.map(user => {
        if (user.id === currentUserId) {
          const currentSavedPosts = user.savedPosts || [];
          const isSaved = currentSavedPosts.includes(post.id);
          const newSavedPosts = isSaved
            ? currentSavedPosts.filter(id => id !== post.id)
            : [...currentSavedPosts, post.id];
           
          if (isSaved) {
            toastInfo = { title: "Postingan Dihapus dari Simpanan", description: "Postingan telah dihapus dari daftar simpanan Anda." };
          } else {
            toastInfo = { title: "Postingan Disimpan", description: "Postingan telah ditambahkan ke daftar simpanan Anda." };
          }
          return { ...user, savedPosts: newSavedPosts };
        }
        return user;
      });
      return newUsers;
    });
    
    if (toastInfo) {
        toast(toastInfo);
    }
  };


  if (!post || !author) {
    return (
      <div className="container mx-auto max-w-2xl py-8 text-center">
        <p className="font-headline text-xl">Memuat postingan...</p>
      </div>
    );
  }

  const isOwner = currentUserId === post.userId;
  const isLiked = currentUserId ? post.likes.includes(currentUserId) : false;
  const isSavedByCurrentUser = (currentUser?.savedPosts || []).includes(post.id);
  const sortedRootComments = [...post.comments.filter(c => !c.parentId)].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());


  return (
    <>
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
                {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale: localeID })}
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
                  <span>Edit Keterangan</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Hapus Postingan</span>
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
            <Image src={post.mediaUrl} alt={post.caption || 'Gambar postingan'} layout="fill" objectFit="cover" data-ai-hint="social media image"/>
          ) : ( 
            <div className="w-full h-full flex items-center justify-center">
              <video 
                src={post.mediaUrl} 
                className="w-full h-full object-cover" 
                autoPlay 
                loop 
                muted 
                playsInline
                data-ai-hint={post.type === 'reel' ? 'reel video' : 'video content'}
              />
              <PlayCircle className="absolute h-16 w-16 text-background/70 pointer-events-none" />
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-body text-foreground leading-relaxed">{post.caption}</p>
          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.hashtags.map(tag => (
                 <Link key={tag} href={`/search?q=${tag}`} className="text-xs text-primary font-medium hover:underline">#{tag}</Link>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col items-start p-4 gap-3">
           <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-x-1 sm:gap-x-2 md:gap-x-3">
              <Button variant="ghost" size="sm" onClick={handleLikePost} className="flex items-center gap-1.5 px-1.5 sm:px-2 text-muted-foreground hover:text-destructive">
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-destructive text-destructive' : ''}`} />
                <span>{post.likes.length}</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 px-1.5 sm:px-2 text-muted-foreground hover:text-primary">
                <MessageCircle className="h-5 w-5" />
                <span>{post.comments.length + post.comments.reduce((acc, curr) => acc + (curr.replies?.length || 0), 0) }</span>
              </Button>
               <div className="flex items-center gap-1.5 px-1.5 sm:px-2 text-muted-foreground text-sm">
                <Eye className="h-5 w-5" />
                <span>{post.viewCount || 0}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1.5 px-1.5 sm:px-2 text-muted-foreground hover:text-accent" disabled>
                    <Share2 className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleShareToSocial}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Bagikan ke Media Sosial</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <Link2 className="mr-2 h-4 w-4" />
                    <span>Salin Tautan</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {currentUserId && (
              <Button variant="ghost" size="icon" onClick={handleToggleSavePost} className="text-muted-foreground hover:text-primary">
                <Bookmark className={`h-5 w-5 ${isSavedByCurrentUser ? 'fill-primary text-primary' : ''}`} />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <Card className="mt-6 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Komentar</CardTitle>
        </CardHeader>
        <CardContent>
          {currentUserId && (
            <div className="flex gap-2 mb-6 items-start">
              <Avatar className="h-10 w-10 mt-1">
                <AvatarImage src={users.find(u=>u.id === currentUserId)?.avatarUrl} data-ai-hint="portrait person small"/>
                <AvatarFallback>{users.find(u=>u.id === currentUserId)?.username.substring(0,1)}</AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="Tambahkan komentar publik..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="text-sm min-h-[60px] flex-grow resize-none"
                rows={2}
              />
              <Button size="default" onClick={() => handleAddComment(newCommentText)} disabled={!newCommentText.trim()} className="self-end">
                <Send className="h-4 w-4 mr-2"/>Kirim
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
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada komentar. Jadilah yang pertama berkomentar!</p>
          )}
        </CardContent>
      </Card>
    </div>

    <Dialog open={isEditingCaption} onOpenChange={setIsEditingCaption}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHead>
          <DialogTitl className="font-headline">Edit Keterangan</DialogTitl>
          <DialogDesc>
            Buat perubahan pada keterangan postingan Anda di sini. Klik simpan jika sudah selesai.
          </DialogDesc>
        </DialogHead>
        <div className="grid gap-4 py-4">
          <Textarea
            id="edit-caption-page"
            value={editedCaption}
            onChange={(e) => setEditedCaption(e.target.value)}
            className="min-h-[100px]"
            rows={4}
          />
        </div>
        <DialogFoot>
          <Button variant="outline" onClick={() => setIsEditingCaption(false)}>Batal</Button>
          <Button onClick={handleSaveEditedCaption}>Simpan Perubahan</Button>
        </DialogFoot>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-headline">Apakah Anda benar-benar yakin?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus postingan Anda secara permanen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDeletePostAction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Ya, Hapus Postingan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {post && (
      <Dialog open={isMediaModalOpen} onOpenChange={setIsMediaModalOpen}>
        <DialogContent className="sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-7xl w-auto max-h-[95vh] p-2 bg-background flex items-center justify-center">
          <DialogHead>
            <DialogTitl className="sr-only">Tampilan Media Penuh</DialogTitl>
          </DialogHead>
          {post.type === 'photo' ? (
            <Image
              src={post.mediaUrl}
              alt={post.caption || 'Gambar postingan ukuran penuh'}
              width={1920} 
              height={1080}
              style={{objectFit:"contain"}}
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
              Browser Anda tidak mendukung tag video.
            </video>
          )}
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}

    