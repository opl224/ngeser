
"use client";

import { useEffect, useState, useMemo, FormEvent, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getCurrentUserId, initialUsers, initialConversations } from '@/lib/data';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import type { User, Conversation, Message as MessageType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, MessageSquare, Send, ArrowLeft, Users, Info, MoreHorizontal, Edit, Trash2, CornerUpLeft } from 'lucide-react';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
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
import { useToast } from "@/hooks/use-toast";


export default function DirectMessagesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const [allUsers, setAllUsers] = useLocalStorageState<User[]>('users', initialUsers);
  const [conversations, setConversations] = useLocalStorageState<Conversation[]>('conversations', initialConversations);

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessageText, setNewMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const newMessageInputRef = useRef<HTMLInputElement>(null);

  // State for message actions
  const [editingMessage, setEditingMessage] = useState<MessageType | null>(null);
  const [editedText, setEditedText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<MessageType | null>(null);


  useEffect(() => {
    const id = getCurrentUserId();
    if (!id) {
      setAuthStatus('unauthenticated');
      router.push('/login');
    } else {
      setCurrentUserIdState(id);
      setAuthStatus('authenticated');
    }
  }, [router]);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !currentUserId) return;

    const queryUserId = searchParams.get('userId');
    if (queryUserId && queryUserId !== currentUserId) {
      const existingConversation = conversations.find(c =>
        c.participantIds.includes(currentUserId) && c.participantIds.includes(queryUserId)
      );

      if (existingConversation) {
        setSelectedConversationId(existingConversation.id);
      } else {
        const newConversationId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newConversation: Conversation = {
          id: newConversationId,
          participantIds: [currentUserId, queryUserId],
          messages: [],
          timestamp: new Date().toISOString(),
        };
        setConversations(prev => [...prev, newConversation]);
        setSelectedConversationId(newConversationId);
      }
      // router.replace(pathname, { scroll: false }); // Caused issues with query persistence
      const current = new URL(window.location.href);
      current.searchParams.delete('userId');
      window.history.replaceState({}, '', current.toString());

    }
  }, [authStatus, currentUserId, searchParams, conversations, setConversations, router, pathname]);


  const currentUser = useMemo(() => allUsers.find(u => u.id === currentUserId), [allUsers, currentUserId]);

  const displayedConversations = useMemo(() => {
    if (!currentUserId) return [];
    return conversations
      .filter(c => c.participantIds.includes(currentUserId))
      .map(c => {
        const otherParticipantId = c.participantIds.find(pid => pid !== currentUserId);
        const otherParticipant = allUsers.find(u => u.id === otherParticipantId);
        return {
          ...c,
          otherParticipant,
          lastMessageText: c.lastMessage?.text || (c.messages.length > 0 ? c.messages[c.messages.length -1].text : "Belum ada pesan"),
          lastMessageTimestamp: c.lastMessage?.timestamp || c.timestamp,
        };
      })
      .sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
  }, [conversations, currentUserId, allUsers]);

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    const convo = conversations.find(c => c.id === selectedConversationId);
    if (!convo || !currentUserId) return null;
    
    const otherParticipantId = convo.participantIds.find(id => id !== currentUserId);
    const otherParticipant = allUsers.find(u => u.id === otherParticipantId);
    
    return {
      ...convo,
      otherParticipant,
      messages: convo.messages.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    };
  }, [selectedConversationId, conversations, currentUserId, allUsers]);

  const handleSendMessage = (e?: FormEvent) => {
    e?.preventDefault();
    if (!newMessageText.trim() || !selectedConversationId || !currentUserId) return;

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2,9)}`;
    const newMessage: MessageType = {
      id: messageId,
      conversationId: selectedConversationId,
      senderId: currentUserId,
      text: newMessageText.trim(),
      timestamp: new Date().toISOString(),
    };

    setConversations(prevConvos =>
      prevConvos.map(convo => {
        if (convo.id === selectedConversationId) {
          return {
            ...convo,
            messages: [...convo.messages, newMessage],
            lastMessage: newMessage,
            timestamp: newMessage.timestamp,
          };
        }
        return convo;
      })
    );
    setNewMessageText('');
  };
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversation?.messages.length]);

  const handleStartEdit = (message: MessageType) => {
    setEditingMessage(message);
    setEditedText(message.text);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditedText('');
  };

  const handleSaveEdit = () => {
    if (!editingMessage || !editedText.trim()) return;
    setConversations(prevConvos =>
      prevConvos.map(convo => {
        if (convo.id === editingMessage.conversationId) {
          const updatedMessages = convo.messages.map(msg =>
            msg.id === editingMessage.id ? { ...msg, text: editedText.trim() } : msg
          );
          const updatedLastMessage = convo.lastMessage?.id === editingMessage.id 
            ? { ...convo.lastMessage, text: editedText.trim() } 
            : convo.lastMessage;
          return { ...convo, messages: updatedMessages, lastMessage: updatedLastMessage };
        }
        return convo;
      })
    );
    toast({ title: "Pesan Diperbarui", description: "Pesan Anda telah berhasil diedit." });
    handleCancelEdit();
  };

  const handleStartDelete = (message: MessageType) => {
    setMessageToDelete(message);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!messageToDelete) return;
    setConversations(prevConvos =>
      prevConvos.map(convo => {
        if (convo.id === messageToDelete.conversationId) {
          const updatedMessages = convo.messages.filter(msg => msg.id !== messageToDelete.id);
          // Update lastMessage if the deleted message was the last one
          let newLastMessage = convo.lastMessage;
          if (convo.lastMessage?.id === messageToDelete.id) {
            newLastMessage = updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1] : undefined;
          }
          return { ...convo, messages: updatedMessages, lastMessage: newLastMessage };
        }
        return convo;
      })
    );
    toast({ title: "Pesan Dihapus", description: "Pesan telah dihapus.", variant: "destructive" });
    setShowDeleteConfirm(false);
    setMessageToDelete(null);
  };

  const handleReplyMessage = (message: MessageType) => {
    if (newMessageInputRef.current) {
      setNewMessageText(prev => `Membalas "${message.text.substring(0, 20)}${message.text.length > 20 ? '...' : ''}": \n` + prev);
      newMessageInputRef.current.focus();
    }
  };


  if (authStatus === 'loading' || (authStatus === 'authenticated' && !currentUser)) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-headline text-muted-foreground">Memuat Pesan...</p>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
     return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-headline text-muted-foreground">Mengalihkan ke halaman masuk...</p>
      </div>
    );
  }

  const isMobileViewAndViewingMessages = selectedConversationId && typeof window !== 'undefined' && window.innerWidth < 768;


  return (
    <div className="flex flex-col md:flex-row h-svh overflow-hidden">
      {/* Sidebar - Conversation List */}
       <div className={cn(
        "w-full md:w-1/3 md:max-w-sm border-r border-border bg-card/30 flex flex-col",
        isMobileViewAndViewingMessages ? "hidden md:flex" : "flex"
      )}>
        <div className="p-3 border-b border-border flex items-center gap-2 sticky top-0 bg-card/30 z-10">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Kembali">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-headline text-md font-semibold text-foreground">Pesan</span>
        </div>

        <ScrollArea className="flex-1">
          {displayedConversations.length > 0 ? (
            displayedConversations.map(convo => (
              <div
                key={convo.id}
                className={cn(
                  "p-3 hover:bg-muted/50 cursor-pointer border-b border-border/50",
                  selectedConversationId === convo.id && "bg-primary/10 hover:bg-primary/20"
                )}
                onClick={() => setSelectedConversationId(convo.id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={convo.otherParticipant?.avatarUrl} alt={convo.otherParticipant?.username} data-ai-hint="dm list avatar"/>
                    <AvatarFallback>{convo.otherParticipant?.username.substring(0,1).toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-headline text-sm font-semibold truncate">{convo.otherParticipant?.username || "Pengguna tidak dikenal"}</p>
                      <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">{formatTimestamp(convo.lastMessageTimestamp)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{convo.lastMessageText}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
             <div className="p-6 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
              {/* Header for empty conversation list already included from previous request */}
              <Users className="h-12 w-12 mx-auto mb-3" />
              <p className="text-sm">Belum ada percakapan.</p>
              <p className="text-xs mt-1">Mulai percakapan dari profil pengguna.</p>
            </div>
          )}
        </ScrollArea>
      </div>


      {/* Main Content - Message View */}
      <div className={cn(
        "flex-1 flex flex-col bg-background",
        !isMobileViewAndViewingMessages && selectedConversationId === null ? "hidden md:flex items-center justify-center" : "flex"
      )}>
        {selectedConversation ? (
          <>
            <CardHeader className="p-3 border-b border-border bg-card/30 flex flex-row items-center gap-3 sticky top-0 z-10">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversationId(null)}>
                  <ArrowLeft className="h-5 w-5"/>
              </Button>
              <Avatar className="h-9 w-9">
                <AvatarImage src={selectedConversation.otherParticipant?.avatarUrl} alt={selectedConversation.otherParticipant?.username} data-ai-hint="dm chat avatar"/>
                <AvatarFallback>{selectedConversation.otherParticipant?.username.substring(0,1).toUpperCase() || '?'}</AvatarFallback>
              </Avatar>
              <Link href={`/profile/${selectedConversation.otherParticipant?.id}`} className="font-headline text-md font-semibold hover:underline">
                {selectedConversation.otherParticipant?.username || "Pengguna tidak dikenal"}
              </Link>
            </CardHeader>
            <ScrollArea className="flex-1 p-4">
              {selectedConversation.messages.map(msg => {
                const isCurrentUserSender = msg.senderId === currentUserId;
                const sender = isCurrentUserSender ? currentUser : selectedConversation.otherParticipant;
                return (
                  <div key={msg.id} className={cn("group flex items-end gap-2 max-w-[85%] sm:max-w-[75%] mb-3", isCurrentUserSender ? "ml-auto flex-row-reverse" : "mr-auto")}>
                    {!isCurrentUserSender && (
                       <Avatar className="h-7 w-7 self-start flex-shrink-0 hidden sm:flex">
                         <AvatarImage src={sender?.avatarUrl} alt={sender?.username} data-ai-hint="message sender avatar"/>
                         <AvatarFallback>{sender?.username.substring(0,1).toUpperCase()}</AvatarFallback>
                       </Avatar>
                    )}
                    <div className={cn(
                        "p-2.5 rounded-xl text-sm leading-relaxed shadow-sm",
                        isCurrentUserSender ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none"
                      )}>
                      {editingMessage?.id === msg.id ? (
                        <div className="space-y-2 w-64">
                           <Textarea
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="min-h-[60px] text-sm bg-background/20 text-current placeholder:text-current/70"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <Button size="xs" variant="ghost" onClick={handleCancelEdit}>Batal</Button>
                            <Button size="xs" onClick={handleSaveEdit} disabled={!editedText.trim() || editedText.trim() === editingMessage.text}>Simpan</Button>
                          </div>
                        </div>
                      ) : (
                        <p>{msg.text}</p>
                      )}
                      <p className={cn("text-xs mt-1", isCurrentUserSender ? "text-primary-foreground/70 text-right" : "text-muted-foreground/80 text-left")}>{formatTimestamp(msg.timestamp)}</p>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-6 w-6 p-0.5 rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity",
                              // Removed absolute positioning classes
                              "data-[state=open]:opacity-100 bg-card/50 hover:bg-card"
                            )}
                          >
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isCurrentUserSender ? "end" : "start"} sideOffset={5}>
                          <DropdownMenuItem onClick={() => handleReplyMessage(msg)}>
                            <CornerUpLeft className="mr-2 h-4 w-4" />
                            Balas Pesan
                          </DropdownMenuItem>
                          {isCurrentUserSender && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStartEdit(msg)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Pesan
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStartDelete(msg)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus Pesan
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card/50 flex items-center gap-2 sticky bottom-0 z-10">
              <Input
                ref={newMessageInputRef}
                type="text"
                placeholder="Ketik pesan..."
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                className="flex-1 h-10"
                autoComplete="off"
              />
              <Button type="submit" size="icon" className="h-10 w-10" disabled={!newMessageText.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <MessageSquare className="h-20 w-20 mb-4 opacity-50" />
            <h2 className="text-xl font-headline text-foreground">Selamat Datang di Pesan Langsung</h2>
            <p className="mt-1">Pilih percakapan untuk dilihat atau mulai yang baru dari profil pengguna.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pesan Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Pesan akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

