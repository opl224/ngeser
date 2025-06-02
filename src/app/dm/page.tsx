
"use client";

import { useEffect, useState, useMemo, FormEvent, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getCurrentUserId, initialUsers, initialConversations } from '@/lib/data';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import type { User, Conversation, Message as MessageType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, MessageSquare, Send, ArrowLeft, Users, Info } from 'lucide-react';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function DirectMessagesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const [allUsers, setAllUsers] = useLocalStorageState<User[]>('users', initialUsers);
  const [conversations, setConversations] = useLocalStorageState<Conversation[]>('conversations', initialConversations);

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessageText, setNewMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Effect to handle userId from query params to select or create conversation
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
      // Clean the URL parameter after processing
      router.replace(pathname, undefined);
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
      messages: convo.messages.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) // Ensure messages are sorted
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
    <div className="flex flex-col md:flex-row h-[calc(100vh_-_7.5rem)] md:h-[calc(100vh_-_4rem)] overflow-hidden">
      {/* Sidebar - Conversation List */}
      <div className={cn(
        "w-full md:w-1/3 md:max-w-sm border-r border-border bg-card/30 flex flex-col",
        isMobileViewAndViewingMessages ? "hidden md:flex" : "flex"
      )}>
        <CardHeader className="p-4 border-b border-border">
          <CardTitle className="font-headline text-xl flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Pesan Langsung
          </CardTitle>
        </CardHeader>
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
                    <p className="text-xs text-muted-foreground truncate">{convo.lastMessageText}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground">
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
            <ScrollArea className="flex-1 p-4 space-y-3">
              {selectedConversation.messages.map(msg => {
                const isCurrentUserSender = msg.senderId === currentUserId;
                const sender = isCurrentUserSender ? currentUser : selectedConversation.otherParticipant;
                return (
                  <div key={msg.id} className={cn("flex items-end gap-2 max-w-[85%] sm:max-w-[75%]", isCurrentUserSender ? "ml-auto flex-row-reverse" : "mr-auto")}>
                    {!isCurrentUserSender && (
                       <Avatar className="h-7 w-7 self-start flex-shrink-0 hidden sm:flex">
                         <AvatarImage src={sender?.avatarUrl} alt={sender?.username} data-ai-hint="message sender avatar"/>
                         <AvatarFallback>{sender?.username.substring(0,1).toUpperCase()}</AvatarFallback>
                       </Avatar>
                    )}
                    <div className={cn(
                        "p-2.5 rounded-xl text-sm leading-relaxed",
                        isCurrentUserSender ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none"
                      )}>
                      <p>{msg.text}</p>
                      <p className={cn("text-xs mt-1", isCurrentUserSender ? "text-primary-foreground/70 text-right" : "text-muted-foreground/80 text-left")}>{formatTimestamp(msg.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card/50 flex items-center gap-2 sticky bottom-0">
              <Input
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
    </div>
  );
}
