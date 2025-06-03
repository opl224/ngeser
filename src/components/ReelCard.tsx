
"use client";

import type { Post, User, Comment as CommentType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Heart, MessageCircle, Send, Share2, MoreVertical, Edit, Trash2, Link2, CornerUpLeft, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { cn, formatTimestamp } from '@/lib/utils';
import Image from 'next/image';


interface ReelCommentItemProps {
  comment: CommentType;
  allUsers: User[];
  currentUserId: string;
  onReply: (commentId: string, text: string) => void;
  level?: number;
}

function ReelCommentItem({ comment, allUsers, currentUserId, onReply, level = 0 }: ReelCommentItemProps) {
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
  
  const paddingClasses = ['pl-0', 'pl-3', 'pl-6', 'pl-9']; // Adjusted padding for sheet
  const currentPadding = paddingClasses[level] ?? `pl-${level * 3}`;
  const replyFormPadding = paddingClasses[level + 1] ?? `pl-${(level + 1) * 3}`;


  return (
     <div className={`py-2 ${currentPadding}`}>
      <div className="flex items-start gap-2.5">
        <Avatar className="h-8 w-8 mt-0.5">
          <AvatarImage src={author?.avatarUrl} alt={author?.username} data-ai-hint="commenter avatar" />
          <AvatarFallback>{author?.username.substring(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 bg-black/10 dark:bg-white/5 p-2.5 rounded-lg">
          <div className="flex items-baseline justify-between">
            <Link href={`/profile/${author?.id}`} className="font-headline text-xs font-semibold hover:underline text-foreground">
              {author?.username || "Pengguna"}
            </Link>
            <span className="text-xs text-muted-foreground ml-2">{formatTimestamp(comment.timestamp)}</span>
          </div>
          <p className="text-xs font-body mt-0.5 text-foreground/90">{comment.text}</p>
           {currentUserId && level === 0 && ( // Allow replying only to top-level comments in Reels
            <Button variant="link" size="xs" className="mt-0.5 text-xs text-muted-foreground hover:text-primary p-0 h-auto" onClick={() => setShowReplyForm(!showReplyForm)}>
              <CornerUpLeft className="h-2.5 w-2.5 mr-1"/> Balas
            </Button>
          )}
        </div>
      </div>
      {showReplyForm && currentUserId && level === 0 && (
        <div className={`mt-2 flex gap-2 items-center ${replyFormPadding}`}>
          <Input
            placeholder={`Membalas ${author?.username}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="text-xs h-8 flex-grow bg-background/70 border-border/50"
          />
          <Button size="icon" className="h-8 w-8" onClick={handleReplySubmit} disabled={!replyText.trim()}><Send className="h-3.5 w-3.5"/></Button>
        </div>
      )}
      {comment.replies && comment.replies.length > 0 && level === 0 && ( // Show replies only for top-level comments
        <div className="mt-1.5">
          {comment.replies.map(reply => (
            <ReelCommentItem key={reply.id} comment={reply} allUsers={allUsers} currentUserId={currentUserId} onReply={onReply} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}


interface ReelCardProps {
  post: Post;
  author: User;
  currentUser: User;
  isCurrentlyActive: boolean;
  onLikeReel: (postId: string) => void;
  onAddCommentToReel: (postId: string, text: string, replyToCommentId?: string) => void;
  onDeleteReel: (postId: string) => void;
  onEditReelCaption: (postId: string, newCaption: string) => void;
  allUsers: User[];
}

export function ReelCard({
  post,
  author,
  currentUser,
  isCurrentlyActive,
  onLikeReel,
  onAddCommentToReel,
  onDeleteReel,
  onEditReelCaption,
  allUsers,
}: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay policies
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  
  const [isEditCaptionDialogOpen, setIsEditCaptionDialogOpen] = useState(false);
  const [editedCaption, setEditedCaption] = useState(post.caption);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isOwner = currentUser.id === post.userId;
  const isLiked = post.likes.includes(currentUser.id);

  useEffect(() => {
    if (videoRef.current) {
      if (isCurrentlyActive) {
        setIsPlaying(true); // Request to play
        videoRef.current.play().catch(error => {
          // Autoplay was prevented, maybe due to browser policy (e.g., requires interaction or unmute first)
          // console.warn("Autoplay prevented for reel:", error);
          setIsPlaying(false); // Update state if play failed
          setIsMuted(true); // Ensure it's muted if autoplay fails this way
        });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        videoRef.current.currentTime = 0; // Reset video when not active
      }
      videoRef.current.muted = isMuted;
    }
  }, [isCurrentlyActive, isMuted]);
  
  // Separate effect for muting, so it doesn't conflict with play/pause from isCurrentlyActive
  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.muted = isMuted;
    }
  }, [isMuted]);


  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused || videoRef.current.ended) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error("Error playing reel", e));
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleCommentSheetOpenChange = (open: boolean) => {
    setShowCommentsSheet(open);
    if (!open) setNewCommentText(''); // Clear comment text when sheet closes
  };

  const handlePostComment = () => {
    if (newCommentText.trim()) {
      onAddCommentToReel(post.id, newCommentText.trim());
      setNewCommentText('');
      // Optionally keep sheet open or close based on UX preference
      // setShowCommentsSheet(false); 
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reel by ${author.username}`,
          text: post.caption,
          url: postUrl,
        });
        toast({ title: "Reel Dibagikan!" });
      } catch (error) {
        // console.error('Error sharing:', error);
        // Fallback to copy link if share fails or is cancelled
        navigator.clipboard.writeText(postUrl).then(() => {
           toast({ title: "Tautan Disalin!", description: "Tautan reel disalin ke papan klip."});
        }).catch(() => {
           toast({ title: "Gagal Menyalin", variant: "destructive" });
        });
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(postUrl).then(() => {
        toast({ title: "Tautan Disalin!", description: "Tautan reel disalin ke papan klip."});
      }).catch(() => {
        toast({ title: "Gagal Menyalin Tautan", variant: "destructive" });
      });
    }
  };

  const handleOpenEditCaptionDialog = () => {
    setEditedCaption(post.caption);
    setIsEditCaptionDialogOpen(true);
  };

  const handleSaveEditedCaption = () => {
    if (editedCaption.trim() !== post.caption) {
      onEditReelCaption(post.id, editedCaption.trim());
    }
    setIsEditCaptionDialogOpen(false);
  };
  
  const handleConfirmDelete = () => {
    onDeleteReel(post.id);
    setIsDeleteDialogOpen(false);
  };

  const sortedRootComments = [...post.comments.filter(c => c.parentId === null)].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const totalCommentsAndReplies = post.comments.length + post.comments.reduce((acc, curr) => acc + (curr.replies?.length || 0), 0);


  return (
    <>
      <div className="w-full h-full relative bg-black group/reel" onClick={togglePlayPause}>
        <video
          ref={videoRef}
          src={post.mediaUrl}
          loop
          playsInline
          className="w-full h-full object-contain"
          data-ai-hint="reel video content"
        />

        {!isPlaying && isCurrentlyActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <Play className="h-16 w-16 text-white/70" />
          </div>
        )}
        
        <button 
            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
            className="absolute top-4 right-4 z-20 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-opacity opacity-0 group-hover/reel:opacity-100 focus-visible:opacity-100"
            aria-label={isMuted ? "Suarakan video" : "Bisukan video"}
        >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>


        {/* Overlay Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 z-10 bg-gradient-to-t from-black/50 to-transparent pointer-events-none">
          <div className="flex items-center gap-2 mb-1.5">
            <Link href={`/profile/${author.id}`} className="pointer-events-auto">
              <Avatar className="h-9 w-9 border-2 border-white/80">
                <AvatarImage src={author.avatarUrl} alt={author.username} data-ai-hint="user avatar reel"/>
                <AvatarFallback>{author.username.substring(0,1).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <Link href={`/profile/${author.id}`} className="pointer-events-auto">
              <p className="font-semibold text-sm text-white shadow-sm">{author.username}</p>
            </Link>
          </div>
          {post.caption && <p className="text-xs text-white/90 shadow-sm line-clamp-2">{post.caption}</p>}
        </div>

        {/* Action Buttons */}
        <div className="absolute right-2 bottom-1/2 translate-y-1/2 md:bottom-6 md:translate-y-0 flex flex-col items-center gap-3 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onLikeReel(post.id); }}
            className="flex flex-col items-center text-white p-2 rounded-full hover:bg-white/10 active:scale-95 transition-transform"
            aria-label="Sukai reel"
          >
            <Heart className={cn("h-7 w-7", isLiked && "fill-red-500 text-red-500")} />
            <span className="text-xs font-medium mt-0.5">{post.likes.length}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowCommentsSheet(true); }}
            className="flex flex-col items-center text-white p-2 rounded-full hover:bg-white/10 active:scale-95 transition-transform"
            aria-label="Lihat komentar"
          >
            <MessageCircle className="h-7 w-7" />
            <span className="text-xs font-medium mt-0.5">{totalCommentsAndReplies}</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            className="flex flex-col items-center text-white p-2 rounded-full hover:bg-white/10 active:scale-95 transition-transform"
            aria-label="Bagikan reel"
          >
            <Share2 className="h-7 w-7" />
            {/* <span className="text-xs font-medium mt-0.5">Bagikan</span> */}
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col items-center text-white p-2 rounded-full hover:bg-white/10 active:scale-95 transition-transform"
                aria-label="Opsi lainnya"
              >
                <MoreVertical className="h-7 w-7" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="left" sideOffset={8} onClick={(e) => e.stopPropagation()}>
              {isOwner && (
                <>
                  <DropdownMenuItem onClick={handleOpenEditCaptionDialog}>
                    <Edit className="mr-2" /> Edit Keterangan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2" /> Hapus Reel
                  </DropdownMenuItem>
                </>
              )}
              {!isOwner && (
                <DropdownMenuItem onClick={() => toast({ title: "Segera Hadir", description: "Fitur pelaporan akan segera tersedia."})}>
                  Laporkan
                </DropdownMenuItem>
              )}
                 <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Bagikan Reel</span>
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => { const postUrl = `${window.location.origin}/post/${post.id}`; navigator.clipboard.writeText(postUrl).then(() => toast({title: "Tautan Disalin!"})).catch(e => toast({title:"Gagal menyalin", variant:"destructive"}))}}>
                    <Link2 className="mr-2 h-4 w-4" />
                    <span>Salin Tautan</span>
                  </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Comments Sheet */}
      <Sheet open={showCommentsSheet} onOpenChange={handleCommentSheetOpenChange}>
        <SheetContent side="bottom" className="h-[75dvh] flex flex-col bg-card text-card-foreground p-0">
          <SheetHeader className="p-4 border-b text-center">
            <SheetTitle className="font-headline text-lg">Komentar ({totalCommentsAndReplies})</SheetTitle>
             <SheetClose className="absolute right-3 top-3 !m-0" />
          </SheetHeader>
          <ScrollArea className="flex-1 p-4">
            {sortedRootComments.length > 0 ? (
              <div className="space-y-3">
                {sortedRootComments.map(comment => (
                  <ReelCommentItem 
                    key={comment.id} 
                    comment={comment} 
                    allUsers={allUsers} 
                    currentUserId={currentUser.id} 
                    onReply={(replyToCmtId, text) => onAddCommentToReel(post.id, text, replyToCmtId)} 
                    level={0}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada komentar. Jadilah yang pertama!</p>
            )}
          </ScrollArea>
          {currentUser && (
            <SheetFooter className="p-3 border-t bg-card">
              <div className="flex items-center gap-2 w-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={currentUser.avatarUrl} alt={currentUser.username} data-ai-hint="current user avatar"/>
                  <AvatarFallback>{currentUser.username.substring(0,1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Input
                  placeholder="Tambahkan komentar..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 h-10 bg-background/70 border-border/70"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment();}}}
                />
                <Button size="icon" className="h-10 w-10" onClick={handlePostComment} disabled={!newCommentText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Caption Dialog */}
       <Dialog open={isEditCaptionDialogOpen} onOpenChange={setIsEditCaptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline">Edit Keterangan Reel</DialogTitle>
            <DialogDescription>
              Buat perubahan pada keterangan reel Anda.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editedCaption}
            onChange={(e) => setEditedCaption(e.target.value)}
            placeholder="Tulis keterangan..."
            className="min-h-[100px] mt-4"
            rows={4}
          />
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={handleSaveEditedCaption}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline">Hapus Reel Ini?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Reel akan dihapus secara permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
             <DialogClose asChild>
                <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    