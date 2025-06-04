
"use client";

import Link from 'next/link';
import { MessageSquare, Bell, XIcon, UserCheck, UserX, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { cn, formatTimestamp } from '@/lib/utils';
import { useEffect, useState, useMemo, Dispatch, SetStateAction } from 'react';
import { getCurrentUserId, initialNotifications, initialUsers, initialConversations } from '@/lib/data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Notification, User as UserType, NotificationType, Conversation } from '@/lib/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { Badge as ShadBadge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";

// Duplicated from AppSidebar - consider abstracting if more duplication occurs
function createAndAddNotification(
  setNotificationsGlobal: Dispatch<SetStateAction<Notification[]>>,
  newNotificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>
) {
  if (newNotificationData.actorUserId === newNotificationData.recipientUserId) {
    return;
  }
  const notification: Notification = {
    ...newNotificationData,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    isRead: false,
  };
  setNotificationsGlobal(prev => [notification, ...prev]);
}


export function MobileHeaderIcons() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [notifications, setNotifications] = useLocalStorageState<Notification[]>('notifications', initialNotifications);
  const [allUsers, setAllUsers] = useLocalStorageState<UserType[]>('users', initialUsers);
  const [conversations, setConversations] = useLocalStorageState<Conversation[]>('conversations', initialConversations);

  useEffect(() => {
    setIsClient(true);
    const updateAuthStatus = () => {
      setCurrentUserIdState(getCurrentUserId());
    };
    updateAuthStatus();

    window.addEventListener('storage', updateAuthStatus);
    window.addEventListener('authChange', updateAuthStatus);

    return () => {
      window.removeEventListener('storage', updateAuthStatus);
      window.removeEventListener('authChange', updateAuthStatus);
    };
  }, []);

  const unreadNotifications = useMemo(() => {
    if (!currentUserId || !isClient) return [];
    return notifications.filter(n => n.recipientUserId === currentUserId && !n.isRead && n.type !== 'follow_request_handled');
  }, [notifications, currentUserId, isClient]);

  const unreadNotificationCount = unreadNotifications.length;

  const unreadMessagesCount = useMemo(() => {
    if (!currentUserId || !isClient || !conversations) return 0;
    let totalUnread = 0;
    conversations.forEach(convo => {
      if (convo.participantIds.includes(currentUserId) && convo.unreadCount && convo.unreadCount[currentUserId]) {
        totalUnread += convo.unreadCount[currentUserId];
      }
    });
    return totalUnread;
  }, [conversations, currentUserId, isClient]);

  const sortedNotificationsForDisplay = useMemo(() => {
    if (!currentUserId || !isClient) return [];
    return notifications
      .filter(n => n.recipientUserId === currentUserId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10); // Limit to 10 for dropdown performance
  }, [notifications, currentUserId, isClient]);

  const handleOpenNotifications = (open: boolean) => {
    if (open && unreadNotificationCount > 0 && currentUserId) {
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          (n.recipientUserId === currentUserId && !n.isRead && n.type !== 'follow_request_handled') ? { ...n, isRead: true } : n
        )
      );
    }
  };

  const handleClearAllNotifications = () => {
    if (!currentUserId) return;
    setNotifications(prevNotifications =>
      prevNotifications.filter(n => n.recipientUserId !== currentUserId)
    );
    toast({
      title: "Notifikasi Dihapus",
      description: "Semua notifikasi Kamu telah dihapus.",
    });
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.filter(n => n.id !== notificationId)
    );
  };

  const handleAcceptFollowRequest = (requesterId: string, notificationId: string) => {
    if (!currentUserId) {
      toast({ title: "Kesalahan Pengguna", description: "Pengguna saat ini tidak terdefinisi.", variant: "destructive" });
      setNotifications(prevNots => prevNots.map(n => n.id === notificationId ? { ...n, type: 'follow_request_handled' as NotificationType, processedState: 'declined', isRead: true, messageOverride: "Gagal: Pengguna tidak terdefinisi." } : n));
      return;
    }

    setNotifications(prevNots =>
      prevNots.map(n => {
        if (n.id === notificationId) {
          return {
            ...n,
            type: 'follow_request_handled' as NotificationType,
            processedState: 'accepted',
            isRead: true,
          };
        }
        return n;
      })
    );

    const CUIDUser = allUsers.find(u => u.id === currentUserId);
    const requesterUser = allUsers.find(u => u.id === requesterId);

    if (!CUIDUser || !requesterUser) {
      const missingUserMsg = `Gagal: ${!CUIDUser ? 'Data Anda' : 'Data pemohon'} tidak lengkap.`;
      toast({ title: "Kesalahan Data Pengguna", description: missingUserMsg, variant: "destructive" });
      setNotifications(prevNots => prevNots.map(n => n.id === notificationId ? { ...n, messageOverride: missingUserMsg } : n));
      return;
    }

    let usersUpdateError = false;
    try {
      setAllUsers(prevUsers => prevUsers.map(user => {
        if (user.id === currentUserId) {
          return {
            ...user,
            followers: [...new Set([...(user.followers || []), requesterId])],
            pendingFollowRequests: (user.pendingFollowRequests || []).filter(id => id !== requesterId),
          };
        }
        if (user.id === requesterId) {
          return {
            ...user,
            following: [...new Set([...(user.following || []), currentUserId])],
            sentFollowRequests: (user.sentFollowRequests || []).filter(id => id !== currentUserId),
          };
        }
        return user;
      }));
    } catch (error) {
      console.error("Error updating user lists on follow accept:", error);
      usersUpdateError = true;
    }

    if (!usersUpdateError) {
      createAndAddNotification(setNotifications, {
        recipientUserId: requesterId,
        actorUserId: currentUserId,
        type: 'follow_accepted'
      });
      toast({ title: "Permintaan Diterima", description: `Kamu sekarang mengizinkan ${requesterUser.username} untuk mengikutimu.` });
    } else {
      toast({
        title: "Kesalahan Sebagian",
        description: `Permintaan dari ${requesterUser.username} diterima, tetapi ada masalah saat memperbarui daftar pengikut/mengikuti.`,
        variant: "destructive",
        duration: 7000,
      });
      setNotifications(prevNots => prevNots.map(n => {
        if (n.id === notificationId) {
          return { ...n, messageOverride: `Diterima, tapi gagal memperbarui daftar pengikut/mengikuti.` };
        }
        return n;
      }));
    }
  };

  const handleDeclineFollowRequest = (requesterId: string, notificationId: string) => {
    if (!currentUserId) {
        toast({ title: "Kesalahan Pengguna", description: "Pengguna saat ini tidak terdefinisi.", variant: "destructive"});
        setNotifications(prevNots => prevNots.map(n => n.id === notificationId ? { ...n, type: 'follow_request_handled' as NotificationType, processedState: 'declined', isRead: true, messageOverride: "Gagal: Pengguna tidak terdefinisi." } : n));
        return;
    }

    const CUIDUser = allUsers.find(u => u.id === currentUserId);
    const requesterUser = allUsers.find(u => u.id === requesterId);

    if (!CUIDUser || !requesterUser) {
        const missingUserMsg = `Gagal: ${!CUIDUser ? 'Data Anda' : 'Data pemohon'} tidak lengkap.`;
        toast({ title: "Kesalahan Data Pengguna", description: missingUserMsg, variant: "destructive"});
        setNotifications(prevNots => prevNots.map(n => n.id === notificationId ? { ...n, type: 'follow_request_handled' as NotificationType, processedState: 'declined', isRead: true, messageOverride: missingUserMsg } : n));
        return;
    }

     setAllUsers(prevUsers => prevUsers.map(user => {
      if (user.id === currentUserId) {
        return { ...user, pendingFollowRequests: (user.pendingFollowRequests || []).filter(id => id !== requesterId) };
      }
      if (user.id === requesterId) {
        return { ...user, sentFollowRequests: (user.sentFollowRequests || []).filter(id => id !== currentUserId) };
      }
      return user;
    }));

    setNotifications(prevNots => prevNots.map(n => {
      if (n.id === notificationId) {
        return {
          ...n,
          type: 'follow_request_handled' as NotificationType,
          processedState: 'declined',
          isRead: true,
        };
      }
      return n;
    }));
    toast({ title: "Permintaan Ditolak", description: `Kamu menolak permintaan mengikuti dari ${requesterUser.username}.` });
  };

  if (!isClient || !currentUserId) {
    return null; // Don't render if not client-side or not logged in
  }

  return (
    <div className="flex items-center gap-1">
      <Link href="/dm" passHref>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-foreground hover:bg-accent hover:text-accent-foreground">
          <MessageSquare className="h-5 w-5" />
          {unreadMessagesCount > 0 && (
            <ShadBadge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center rounded-full">
              {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
            </ShadBadge>
          )}
        </Button>
      </Link>

      <DropdownMenu onOpenChange={handleOpenNotifications}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9 text-foreground hover:bg-accent hover:text-accent-foreground">
            <Bell className="h-5 w-5" />
            {unreadNotificationCount > 0 && (
              <ShadBadge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center rounded-full">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </ShadBadge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          align="end"
          sideOffset={10}
          className="w-80 max-h-[calc(100vh-100px)] overflow-y-auto z-[60]"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuLabel className="font-headline">
            <div className="flex items-center justify-between">
              <span>Notifikasi</span>
              {sortedNotificationsForDisplay.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); handleClearAllNotifications(); }}
                  aria-label="Hapus semua notifikasi"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {sortedNotificationsForDisplay.length > 0 ? (
            sortedNotificationsForDisplay.map(notification => {
              const actor = allUsers.find(u => u.id === notification.actorUserId);
              let message = notification.messageOverride || "";
              let linkHref = "#";
              let avatarSrc = actor?.avatarUrl;
              let avatarFallback = actor?.username?.substring(0,1).toUpperCase() || 'N';

              if (!message) {
                switch (notification.type) {
                  case 'like':
                    message = `${actor?.username || 'Seseorang'} menyukai postingan Kamu.`;
                    linkHref = notification.postId ? `/post/${notification.postId}` : '/';
                    if (!actor?.avatarUrl && notification.postMediaUrl) avatarSrc = notification.postMediaUrl;
                    break;
                  case 'comment':
                    message = `${actor?.username || 'Seseorang'} mengomentari postingan Kamu.`;
                    linkHref = notification.postId ? `/post/${notification.postId}` : '/';
                     if (!actor?.avatarUrl && notification.postMediaUrl) avatarSrc = notification.postMediaUrl;
                    break;
                  case 'reply':
                    message = `${actor?.username || 'Seseorang'} membalas komentar Kamu.`;
                    linkHref = notification.postId ? `/post/${notification.postId}` : '/';
                     if (!actor?.avatarUrl && notification.postMediaUrl) avatarSrc = notification.postMediaUrl;
                    break;
                  case 'follow':
                    message = `${actor?.username || 'Seseorang'} mulai mengikuti Kamu.`;
                    linkHref = actor ? `/profile/${actor.id}` : '/';
                    break;
                  case 'follow_request':
                    message = `${actor?.username || 'Seseorang'} ingin mengikuti Kamu.`;
                    linkHref = actor ? `/profile/${actor.id}` : '/';
                    break;
                  case 'follow_accepted':
                    message = `${actor?.username || 'Seseorang'} menerima permintaan mengikuti Kamu.`;
                    linkHref = actor ? `/profile/${actor.id}` : '/';
                    break;
                  case 'follow_request_handled':
                    if (notification.processedState === 'accepted') {
                        message = `Kamu menerima permintaan mengikuti dari ${actor?.username || 'Seseorang'}.`;
                    } else if (notification.processedState === 'declined') {
                        message = `Kamu menolak permintaan mengikuti dari ${actor?.username || 'Seseorang'}.`;
                    } else if (notification.messageOverride) {
                        message = notification.messageOverride;
                    } else {
                        message = `Permintaan mengikuti dari ${actor?.username || 'Seseorang'} telah diproses.`;
                    }
                    linkHref = actor ? `/profile/${actor.id}` : '/';
                    break;
                  default:
                    message = "Notifikasi baru.";
                }
              }

              return (
                <div key={notification.id} className={cn("group/notif-item relative", !notification.isRead && isClient && notification.type !== 'follow_request_handled' ? 'bg-primary/10' : '')}>
                  <DropdownMenuItem asChild className={cn("cursor-pointer w-full pr-8 focus:bg-accent/80", !notification.isRead && isClient && notification.type !== 'follow_request_handled' ? "hover:!bg-primary/20" : "hover:!bg-accent/80")}>
                    <Link href={linkHref} className="flex items-start gap-3 p-2 w-full">
                      <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                        <AvatarImage src={avatarSrc} alt={actor?.username || 'Notifikasi'} data-ai-hint="notification actor person"/>
                        <AvatarFallback>{avatarFallback}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground/90 leading-tight whitespace-normal break-words">
                          {message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isClient && formatTimestamp(notification.timestamp)}
                        </p>
                        {notification.type === 'follow_request' && actor && (
                          <div className="mt-1.5 flex gap-2">
                            <Button
                              size="xs"
                              variant="default"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAcceptFollowRequest(actor.id, notification.id); }}
                              className="h-6 px-2 text-xs"
                            >
                              <UserCheck className="h-3 w-3 mr-1" /> Terima
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeclineFollowRequest(actor.id, notification.id); }}
                              className="h-6 px-2 text-xs"
                            >
                              <UserX className="h-3 w-3 mr-1" /> Tolak
                            </Button>
                          </div>
                        )}
                      </div>
                    </Link>
                  </DropdownMenuItem>
                   <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 absolute top-1 right-1 text-muted-foreground hover:text-destructive opacity-0 group-hover/notif-item:opacity-100 focus:opacity-100 transition-opacity"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteNotification(notification.id); }}
                      aria-label="Hapus notifikasi ini"
                    >
                      <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          ) : (
            <DropdownMenuItem disabled className="text-center text-muted-foreground p-3">
              Tidak ada notifikasi.
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
