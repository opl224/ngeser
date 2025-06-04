
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Home, BadgePlus, User, LogIn, Search as SearchIconLucide, Bell, Trash2, X as XIcon, MessageSquare, UserCheck, UserX, ShieldQuestion, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Input replaced by SidebarInput
import { usePathname, useRouter } from 'next/navigation';
import { cn, formatTimestamp } from '@/lib/utils';
import { useEffect, useState, FormEvent, useMemo, Dispatch, SetStateAction } from 'react';
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
import { Badge as ShadBadge } from '@/components/ui/badge'; // Renamed to avoid conflict
import { useToast } from "@/hooks/use-toast";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  // SidebarFooter, // Not used for now
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInput,
  SidebarSeparator, // If needed
  SidebarMenuBadge,
  useSidebar, // To get collapse state for tooltips
} from '@/components/ui/sidebar';

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

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [notifications, setNotifications] = useLocalStorageState<Notification[]>('notifications', initialNotifications);
  const [allUsers, setAllUsers] = useLocalStorageState<UserType[]>('users', initialUsers);
  const [conversations, setConversations] = useLocalStorageState<Conversation[]>('conversations', initialConversations);

  const { state: sidebarState } = useSidebar(); // Get sidebar collapse state for tooltips

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
      .slice(0, 10);
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

  const baseNavItems = [ { href: '/', label: 'Beranda', icon: Home }, ];
  const authNavItems = [
    { href: '/upload', label: 'Unggah', icon: BadgePlus },
    { href: '/reels', label: 'Reels', icon: Film },
    { href: '/profile', label: 'Profil', icon: User },
  ];
  const loginNavItem = { href: '/login', label: 'Masuk', icon: LogIn };
  const allNavItems = currentUserId ? [...baseNavItems, ...authNavItems] : [...baseNavItems, loginNavItem];

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  if (!isClient && (pathname === '/login' || pathname === '/register')) {
    // Don't render the sidebar shell on login/register pages during SSR/initial client render to prevent flash
    return null;
  }
  if (isClient && (pathname === '/login' || pathname === '/register')) {
    return null; // Fully hide sidebar on login/register
  }
  

  return (
    <Sidebar side="left" collapsible="icon" variant="sidebar" className="border-r">
      <SidebarHeader className="p-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/hand.png" alt="Ngeser logo" width={32} height={32} data-ai-hint="logo hand" />
          <span className="font-headline text-2xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Ngeser
          </span>
        </Link>
        <form onSubmit={handleSearchSubmit} className="flex items-center relative w-full mt-2 group-data-[collapsible=icon]:hidden">
          <SearchIconLucide className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <SidebarInput
            type="search"
            placeholder="Cari pengguna..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-ai-hint="search users input sidebar"
          />
        </form>
      </SidebarHeader>

      <SidebarContent className="p-0">
        <SidebarMenu className="px-3 py-2">
          {allNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={{content: item.label, side: "right", hidden: sidebarState === "expanded" || !isClient}}
                >
                  <Link href={item.href} className="flex items-center justify-start">
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="ml-3 group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}

          {currentUserId && (
            <>
              <SidebarMenuItem className="relative">
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/dm')}
                  tooltip={{content: "Pesan Langsung", side: "right", hidden: sidebarState === "expanded" || !isClient}}
                >
                  <Link href="/dm" className="flex items-center justify-start">
                    <MessageSquare className="h-5 w-5 shrink-0" />
                    <span className="ml-3 group-data-[collapsible=icon]:hidden">Pesan</span>
                    {isClient && unreadMessagesCount > 0 && (
                      <SidebarMenuBadge className="group-data-[collapsible=icon]:hidden">{unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}</SidebarMenuBadge>
                    )}
                  </Link>
                </SidebarMenuButton>
                 {isClient && unreadMessagesCount > 0 && sidebarState === "collapsed" && (
                    <div className="absolute top-1 right-1">
                        <ShadBadge variant="destructive" className="h-3 w-3 p-0 flex items-center justify-center rounded-full pointer-events-none text-[8px] leading-none"></ShadBadge>
                    </div>
                 )}
              </SidebarMenuItem>

              <SidebarMenuItem className="relative">
                <DropdownMenu onOpenChange={handleOpenNotifications}>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                       className="w-full justify-start"
                       tooltip={{content: "Notifikasi", side: "right", hidden: sidebarState === "expanded" || !isClient}}
                    >
                      <Bell className="h-5 w-5 shrink-0" />
                      <span className="ml-3 group-data-[collapsible=icon]:hidden">Notifikasi</span>
                       {isClient && unreadNotificationCount > 0 && (
                         <SidebarMenuBadge className="group-data-[collapsible=icon]:hidden">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</SidebarMenuBadge>
                      )}
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  {isClient && unreadNotificationCount > 0 && sidebarState === "collapsed" && (
                    <div className="absolute top-1 right-1">
                        <ShadBadge variant="destructive" className="h-3 w-3 p-0 flex items-center justify-center rounded-full pointer-events-none text-[8px] leading-none"></ShadBadge>
                    </div>
                  )}
                  <DropdownMenuContent 
                    side="right" 
                    align="start" 
                    sideOffset={sidebarState === "collapsed" ? 10 : 5}
                    className={cn(
                        "w-80 md:w-96 max-h-[calc(100vh-100px)] overflow-y-auto z-[60]", 
                        sidebarState === "collapsed" ? "ml-1" : ""
                    )}
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
                            <DropdownMenuItem asChild className={cn("cursor-pointer w-full pr-8 focus:bg-accent/80", !notification.isRead && isClient && notification.type !== 'follow_request_handled' ? 'hover:!bg-primary/20' : 'hover:!bg-accent/80')}>
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
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
