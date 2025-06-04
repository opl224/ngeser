
"use client";

import { Suspense, useEffect, useState, useMemo, FormEvent, useRef } from 'react'; 
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getCurrentUserId, initialUsers, initialConversations } from '@/lib/data';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import type { User, Conversation, Message as MessageType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, MessageSquare, Send, ArrowLeft, Users, Info, MoreHorizontal, Edit, Trash2, CornerUpLeft, MoreVertical, X, Save } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';


interface ParsedOldReply {
  repliedToUsername: string;
  quotedTextPreview: string;
  actualReplyText: string;
}

function parseOldReply(text: string): ParsedOldReply | null {
  const oldReplyRegex = /^> Membalas kepada (.*?): "(.*?)"\n\n([\s\S]*)$/;
  const match = text.match(oldReplyRegex);
  if (match) {
    return {
      repliedToUsername: match[1],
      quotedTextPreview: match[2],
      actualReplyText: match[3],
    };
  }
  return null;
}

function DmPageContent() {
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

  const [editingMessage, setEditingMessage] = useState<MessageType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<MessageType | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<MessageType | null>(null);


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
          unreadCount: { // Initialize unreadCount
            [currentUserId]: 0,
            [queryUserId]: 0,
          }
        };
        setConversations(prev => [...prev, newConversation]);
        setSelectedConversationId(newConversationId);
      }
      
      if (typeof window !== 'undefined') {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('userId');
        window.history.replaceState({}, '', currentUrl.toString());
      }

    }
  }, [authStatus, currentUserId, searchParams, conversations, setConversations, router, pathname]);

  // Effect to reset unread count when a conversation is selected
  useEffect(() => {
    if (selectedConversationId && currentUserId && conversations.length > 0) {
      const conversationToUpdate = conversations.find(c => c.id === selectedConversationId);
      if (conversationToUpdate && 
          conversationToUpdate.unreadCount && 
          conversationToUpdate.unreadCount[currentUserId] > 0
      ) {
        setConversations(prevConvos =>
          prevConvos.map(convo => {
            if (convo.id === selectedConversationId) {
              const newUnreadCount = { ...(convo.unreadCount || {}) };
              newUnreadCount[currentUserId] = 0;
              return { ...convo, unreadCount: newUnreadCount };
            }
            return convo;
          })
        );
      }
    }
  }, [selectedConversationId, currentUserId, conversations, setConversations]);


  const currentUser = useMemo(() => allUsers.find(u => u.id === currentUserId), [allUsers, currentUserId]);

  const displayedConversations = useMemo(() => {
    if (!currentUserId) return [];
    return conversations
      .filter(c => c.participantIds.includes(currentUserId))
      .map(c => {
        const otherParticipantId = c.participantIds.find(pid => pid !== currentUserId);
        const otherParticipant = allUsers.find(u => u.id === otherParticipantId);
        const lastMessage = c.messages[c.messages.length - 1];
        return {
          ...c,
          otherParticipant,
          lastMessageTimestamp: lastMessage?.timestamp || c.timestamp,
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


  const handleConfirmGlobalEdit = () => {
    if (!editingMessage || !newMessageText.trim()) return;

    setConversations(prevConvos =>
      prevConvos.map(convo => {
        if (convo.id === editingMessage.conversationId) {
          const updatedMessages = convo.messages.map(msg => {
            if (msg.id === editingMessage.id) {
              let updatedText = newMessageText.trim();
              if (!editingMessage.replyToInfo && parseOldReply(editingMessage.text)) {
                const oldParsed = parseOldReply(editingMessage.text)!;
                updatedText = `> Membalas kepada ${oldParsed.repliedToUsername}: "${oldParsed.quotedTextPreview}"\n\n${newMessageText.trim()}`;
              }
              return { ...msg, text: updatedText, editedTimestamp: new Date().toISOString() };
            }
            return msg;
          });
          
          let updatedLastMessage = convo.lastMessage;
          if (convo.lastMessage?.id === editingMessage.id) {
            let lastMsgText = newMessageText.trim();
            if (!editingMessage.replyToInfo && parseOldReply(editingMessage.text)) {
                const oldParsed = parseOldReply(editingMessage.text)!;
                lastMsgText = `> Membalas kepada ${oldParsed.repliedToUsername}: "${oldParsed.quotedTextPreview}"\n\n${newMessageText.trim()}`;
            }
            updatedLastMessage = { ...updatedLastMessage, text: lastMsgText, timestamp: new Date().toISOString() };
          }
          return { ...convo, messages: updatedMessages, lastMessage: updatedLastMessage, timestamp: updatedLastMessage?.timestamp || convo.timestamp };
        }
        return convo;
      })
    );
    toast({ title: "Pesan Diperbarui", description: "Pesan Anda telah berhasil diedit." });
    setEditingMessage(null);
    setNewMessageText('');
  };

  const handleSendMessage = (e?: FormEvent) => {
    e?.preventDefault();
    if (!newMessageText.trim() || !currentUserId) return;

    if (editingMessage) {
      handleConfirmGlobalEdit();
      return;
    }

    if (!selectedConversationId) {
        toast({ title: "Tidak Ada Percakapan", description: "Pilih percakapan untuk mengirim pesan.", variant: "destructive" });
        return;
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2,9)}`;
    let newMessage: MessageType;

    if (replyingToMessage) {
        const repliedMsgTextForPreview = replyingToMessage.replyToInfo ? replyingToMessage.text : (parseOldReply(replyingToMessage.text)?.actualReplyText || replyingToMessage.text);
        const preview = repliedMsgTextForPreview.length > 60 ? `${repliedMsgTextForPreview.substring(0, 60)}...` : repliedMsgTextForPreview;

        newMessage = {
            id: messageId,
            conversationId: selectedConversationId,
            senderId: currentUserId,
            text: newMessageText.trim(),
            timestamp: new Date().toISOString(),
            replyToInfo: {
                originalSenderUsername: allUsers.find(u => u.id === replyingToMessage.senderId)?.username || 'Seseorang',
                originalMessagePreview: preview,
                originalMessageId: replyingToMessage.id,
            }
        };
    } else {
        newMessage = {
            id: messageId,
            conversationId: selectedConversationId,
            senderId: currentUserId,
            text: newMessageText.trim(),
            timestamp: new Date().toISOString(),
        };
    }

    setConversations(prevConvos =>
      prevConvos.map(convo => {
        if (convo.id === selectedConversationId) {
          const otherParticipantId = convo.participantIds.find(id => id !== currentUserId);
          let updatedUnreadCount = { ...(convo.unreadCount || {}) };
          if (otherParticipantId) {
            updatedUnreadCount[otherParticipantId] = (updatedUnreadCount[otherParticipantId] || 0) + 1;
          }
          return {
            ...convo,
            messages: [...convo.messages, newMessage],
            lastMessage: newMessage,
            timestamp: newMessage.timestamp, 
            unreadCount: updatedUnreadCount,
          };
        }
        return convo;
      })
    );
    setNewMessageText('');
    setReplyingToMessage(null);
  };
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversation?.messages.length]);

  const handleStartGlobalEdit = (message: MessageType) => {
    setEditingMessage(message);
    if (message.replyToInfo) {
      setNewMessageText(message.text);
    } else {
      const oldParsed = parseOldReply(message.text);
      setNewMessageText(oldParsed ? oldParsed.actualReplyText : message.text);
    }
    setReplyingToMessage(null); 
    if (newMessageInputRef.current) {
      newMessageInputRef.current.focus();
    }
  };

  const cancelGlobalEdit = () => {
    setEditingMessage(null);
    setNewMessageText('');
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
          let newLastMessage = convo.lastMessage;
          if (convo.lastMessage?.id === messageToDelete.id) {
            newLastMessage = updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1] : undefined;
          }
          return { ...convo, messages: updatedMessages, lastMessage: newLastMessage, timestamp: newLastMessage?.timestamp || convo.timestamp };
        }
        return convo;
      })
    );
    toast({ title: "Pesan Dihapus", description: "Pesan telah dihapus.", variant: "destructive" });
    setShowDeleteConfirm(false);
    setMessageToDelete(null);
    if (editingMessage?.id === messageToDelete?.id) { 
        cancelGlobalEdit();
    }
  };

  const handleReplyMessage = (message: MessageType) => {
    setReplyingToMessage(message);
    setEditingMessage(null); 
    setNewMessageText(''); 
    if (newMessageInputRef.current) {
      newMessageInputRef.current.focus();
    }
  };

  const cancelReply = () => {
    setReplyingToMessage(null);
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
       <div className={cn(
        "w-full md:w-1/3 md:max-w-sm border-r border-border bg-card/30 flex flex-col",
        isMobileViewAndViewingMessages ? "hidden md:flex" : "flex"
      )}>
        <div className="p-3 border-b border-border flex items-center gap-2 sticky top-0 bg-card/30 z-10">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Kembali" className="md:hidden">
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
                  "p-3 md:hover:bg-muted/50 cursor-pointer border-b border-border/50",
                  selectedConversationId === convo.id && "bg-primary/10 md:hover:bg-primary/20"
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
                    {/* Display unread count badge if any */}
                    {convo.unreadCount && currentUserId && convo.unreadCount[currentUserId] > 0 && (
                         <div className="flex justify-end mt-0.5">
                            <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                                {convo.unreadCount[currentUserId]}
                            </Badge>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
              <Users className="h-12 w-12 mx-auto mb-3" />
              <p className="text-sm">Belum ada percakapan.</p>
              <p className="text-xs mt-1">Mulai percakapan dari profil pengguna.</p>
            </div>
          )}
        </ScrollArea>
      </div>


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
              <Link href={`/profile/${selectedConversation.otherParticipant?.id}`} className="font-headline text-md font-semibold md:hover:underline">
                {selectedConversation.otherParticipant?.username || "Pengguna tidak dikenal"}
              </Link>
            </CardHeader>
            <ScrollArea className="flex-1 p-4">
              {selectedConversation.messages.map(msg => {
                const isCurrentUserSender = msg.senderId === currentUserId;
                const sender = isCurrentUserSender ? currentUser : selectedConversation.otherParticipant;
                const oldParsedReply = !msg.replyToInfo ? parseOldReply(msg.text) : null;
                
                let messageDisplayContent;
                if (msg.replyToInfo) {
                    messageDisplayContent = (
                        <>
                          <div className="bg-muted/30 p-2 rounded-md mb-1.5 border-l-4 border-primary/60 text-xs shadow">
                            <p className="font-semibold text-foreground/80">
                              {msg.replyToInfo.originalSenderUsername}
                            </p>
                            <p className="italic truncate text-muted-foreground/90">
                              "{msg.replyToInfo.originalMessagePreview}"
                            </p>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </>
                    );
                } else if (oldParsedReply) {
                    messageDisplayContent = (
                        <>
                          <div className="bg-muted/30 p-2 rounded-md mb-1.5 border-l-4 border-primary/60 text-xs shadow">
                            <p className="font-semibold text-foreground/80">
                              {oldParsedReply.repliedToUsername}
                            </p>
                            <p className="italic truncate text-muted-foreground/90">
                              "{oldParsedReply.quotedTextPreview}"
                            </p>
                          </div>
                          <p className="whitespace-pre-wrap">{oldParsedReply.actualReplyText}</p>
                        </>
                    );
                } else {
                    messageDisplayContent = <p className="whitespace-pre-wrap">{msg.text}</p>;
                }

                return (
                  <div key={msg.id} className={cn("group flex items-center gap-2 max-w-[85%] sm:max-w-[75%] mb-3", isCurrentUserSender ? "ml-auto flex-row-reverse" : "mr-auto")}>
                    <div className={cn(
                        "p-2.5 rounded-xl text-sm leading-relaxed shadow-sm",
                        isCurrentUserSender ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none"
                      )}>
                        {messageDisplayContent}
                        <p className={cn("text-xs mt-1", isCurrentUserSender ? "text-primary-foreground/70 text-right" : "text-muted-foreground/80 text-left")}>
                          {formatTimestamp(msg.timestamp)}
                          {msg.editedTimestamp && <span className="italic text-xs"> (diedit)</span>}
                        </p>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-6 w-6 p-0.5 rounded-full opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity",
                              "data-[state=open]:opacity-100 bg-card/50 md:hover:bg-card"
                            )}
                          >
                            <MoreVertical className="h-4 w-4 text-muted-foreground " />
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
                              <DropdownMenuItem onClick={() => handleStartGlobalEdit(msg)}>
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
            <div className="p-3 border-t border-border bg-card/50 sticky bottom-0 z-10">
              {replyingToMessage && !editingMessage && ( 
                <div className="bg-muted/30 p-2.5 rounded-lg mb-2 border-l-4 border-primary shadow-sm text-sm flex justify-between items-start">
                  <div className="overflow-hidden">
                    <p className="font-semibold text-foreground">Membalas kepada {allUsers.find(u => u.id === replyingToMessage.senderId)?.username || 'Seseorang'}</p>
                    <p className="italic truncate text-muted-foreground text-xs">
                      "{replyingToMessage.replyToInfo ? replyingToMessage.text : (parseOldReply(replyingToMessage.text)?.actualReplyText || replyingToMessage.text).substring(0,60) + ((replyingToMessage.replyToInfo ? replyingToMessage.text : (parseOldReply(replyingToMessage.text)?.actualReplyText || replyingToMessage.text)).length > 60 ? '...' : '')}"
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={cancelReply} className="h-6 w-6 p-1 ml-2 flex-shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Input
                  ref={newMessageInputRef}
                  type="text"
                  placeholder={editingMessage ? "Edit pesan..." : (replyingToMessage ? `Membalas ${allUsers.find(u => u.id === replyingToMessage.senderId)?.username || 'Seseorang'}...` : "Ketik pesan...")}
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 h-10"
                  autoComplete="off"
                />
                <Button type="submit" size="icon" className="h-10 w-10" disabled={!newMessageText.trim()}>
                  {editingMessage ? <Save className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <MessageSquare className="h-20 w-20 mb-4 opacity-50" />
            <h2 className="text-xl font-headline text-foreground">Selamat Datang di Pesan Langsung</h2>
            <p className="mt-1">Pilih percakapan untuk dilihat atau mulai yang baru dari profil pengguna.</p>
          </div>
        )}
      </div>

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
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground md:hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function DirectMessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col justify-center items-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-headline text-muted-foreground">Memuat Halaman Pesan...</p>
      </div>
    }>
      <DmPageContent />
    </Suspense>
  );
}

    
