
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Home, BadgePlus, User, LogIn, Search as SearchIconLucide, Bell, Trash2, X as XIcon, MessageSquare, UserCheck, UserX, ShieldQuestion, Film, Settings as SettingsIcon, Cog, Moon, Sun, Laptop, LogOut, Save, Edit3, Lock, ShieldOff, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { cn, formatTimestamp } from '@/lib/utils';
import { useEffect, useState, FormEvent, useMemo, Dispatch, SetStateAction } from 'react';
import { getCurrentUserId, initialNotifications, initialUsers, initialConversations, initialPosts } from '@/lib/data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
  DialogDescription as PrivacyDialogDescription,
  DialogFooter as PrivacyDialogFooter,
  DialogHeader as PrivacyDialogHeader,
  DialogTitle as PrivacyDialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Notification, User as UserType, NotificationType, Conversation, Post } from '@/lib/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { Badge as ShadBadge } from '@/components/ui/badge'; // Renamed to avoid conflict if Badge is also imported from lucide
import { useToast } from "@/hooks/use-toast";
import { useTheme } from 'next-themes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInput,
  SidebarSeparator,
  SidebarMenuBadge,
  useSidebar,
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
  const { theme, setTheme } = useTheme();
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [notifications, setNotifications] = useLocalStorageState<Notification[]>('notifications', initialNotifications);
  const [allUsers, setAllUsers] = useLocalStorageState<UserType[]>('users', initialUsers);
  const [allPosts, setAllPosts] = useLocalStorageState<Post[]>('posts', initialPosts);
  const [conversations, setConversations] = useLocalStorageState<Conversation[]>('conversations', initialConversations);
  const [showDeleteDataConfirm, setShowDeleteDataConfirm] = useState(false);
  
  const [isPrivacySettingsModalOpen, setIsPrivacySettingsModalOpen] = useState(false);
  const [editedAccountType, setEditedAccountType] = useState<'public' | 'private'>('public');
  const [editedIsVerified, setEditedIsVerified] = useState(false);


  const { state: sidebarState } = useSidebar();

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
  
  const currentSessionUser = useMemo(() => {
    if (!currentUserId || !isClient) return null;
    return allUsers.find(u => u.id === currentUserId);
  }, [allUsers, currentUserId, isClient]);

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


  const handleLogoutAndSaveData = () => {
     if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('users', JSON.stringify(allUsers));
        localStorage.setItem('posts', JSON.stringify(allPosts));
        localStorage.setItem('notifications', JSON.stringify(notifications));
        localStorage.setItem('conversations', JSON.stringify(conversations));
      } catch (error) {
        console.error("Error saving data to localStorage on logout:", error);
        toast({
          title: "Kesalahan Penyimpanan",
          description: "Gagal menyimpan data Anda sebelum keluar.",
          variant: "destructive",
        });
      }

      window.dispatchEvent(new CustomEvent('authChange'));
      localStorage.removeItem('currentUserId');
    }
    toast({
      title: "Berhasil Keluar",
      description: "Data Anda tersimpan. Anda telah berhasil keluar.",
    });
    router.push('/login');
  };

  const handleLogoutAndDeleteAllData = () => {
    setAllPosts([]);
    setAllUsers([]);
    setNotifications([]);
    setConversations([]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authChange'));
      localStorage.removeItem('currentUserId');
      localStorage.setItem('posts', '[]');
      localStorage.setItem('users', '[]');
      localStorage.setItem('notifications', '[]');
      localStorage.setItem('conversations', '[]');
    }
    toast({
      title: "Data Dihapus & Berhasil Keluar",
      description: "Semua data aplikasi telah dihapus. Anda telah berhasil keluar.",
      variant: "destructive",
    });
    setShowDeleteDataConfirm(false);
    router.push('/login');
  };

  const handleOpenPrivacySettingsModal = () => {
    if (currentSessionUser) {
        setEditedAccountType(currentSessionUser.accountType || 'public');
        setEditedIsVerified(currentSessionUser.isVerified || false);
        setIsPrivacySettingsModalOpen(true);
    } else {
        toast({ title: "Error", description: "Data pengguna saat ini tidak ditemukan.", variant: "destructive"});
    }
  };

  const handleSavePrivacySettings = () => {
    if (!currentSessionUser || !currentUserId) {
        toast({ title: "Error", description: "Tidak dapat menyimpan, data pengguna tidak lengkap.", variant: "destructive" });
        return;
    }
     setAllUsers(prevUsers =>
      prevUsers.map(user => {
        if (user.id === currentUserId) {
          return {
            ...user,
            accountType: editedAccountType,
            isVerified: editedIsVerified,
          };
        }
        return user;
      })
    );
    toast({
      title: "Pengaturan Privasi Diperbarui",
      description: "Pengaturan privasi dan verifikasi akun Anda telah disimpan.",
    });
    setIsPrivacySettingsModalOpen(false);
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
    return null;
  }
  if (isClient && (pathname === '/login' || pathname === '/register')) {
    return null;
  }


  return (
    <>
    <Sidebar side="left" collapsible="icon" variant="sidebar" className="border-r">
      <SidebarHeader className="p-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/hand.png" alt="Ngeser logo" width={32} height={32} data-ai-hint="logo hand" />
            <span className="font-headline text-2xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              Ngeser
            </span>
          </Link>

          <div className="items-center gap-1.5 group-data-[collapsible=icon]:hidden flex">
            {currentUserId && isClient && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/dm" passHref>
                      <Button variant="ghost" size="icon" className="relative h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                        <MessageSquare className="h-5 w-5" />
                        {unreadMessagesCount > 0 && (
                          <ShadBadge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center rounded-full">
                            {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                          </ShadBadge>
                        )}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>Pesan Langsung</p></TooltipContent>
                </Tooltip>

                <DropdownMenu onOpenChange={handleOpenNotifications}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                          <Bell className="h-5 w-5" />
                          {unreadNotificationCount > 0 && (
                            <ShadBadge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center rounded-full">
                              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                            </ShadBadge>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Notifikasi</p></TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent
                    side="bottom"
                    align="end"
                    sideOffset={10}
                    className="w-80 md:w-96 max-h-[calc(100vh-150px)] overflow-y-auto z-[60]"
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
              </>
            )}
          </div>
        </div>

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

      <SidebarContent className="p-0 flex flex-col justify-between">
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
        <SidebarFooter className="p-3 mt-auto border-t border-sidebar-border">
            {currentUserId && isClient && (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            className="w-full justify-start"
                            tooltip={{content: "Pengaturan", side: "right", hidden: sidebarState === "expanded" || !isClient}}
                        >
                            <SettingsIcon className="h-5 w-5 shrink-0" />
                            <span className="ml-3 group-data-[collapsible=icon]:hidden">Pengaturan</span>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                        side="right" 
                        align="start" 
                        sideOffset={sidebarState === "collapsed" ? 10 : 5}
                        className={cn("z-[60]", sidebarState === "collapsed" ? "ml-1" : "")}
                        onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                        <DropdownMenuLabel className="font-headline">Pengaturan Aplikasi</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                {theme === 'light' && <Sun className="mr-2 h-4 w-4" />}
                                {theme === 'dark' && <Moon className="mr-2 h-4 w-4" />}
                                {theme === 'system' && <Laptop className="mr-2 h-4 w-4" />}
                                Tema
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                                <DropdownMenuRadioItem value="light">
                                    <Sun className="mr-2 h-4 w-4" />
                                    Cerah
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="dark">
                                    <Moon className="mr-2 h-4 w-4" />
                                    Gelap
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="system">
                                    <Laptop className="mr-2 h-4 w-4" />
                                    Sistem
                                </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem onClick={handleOpenPrivacySettingsModal} className="cursor-pointer">
                            <ShieldQuestion className="mr-2 h-4 w-4" />
                            Pengaturan Privasi
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogoutAndSaveData} className="cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            Keluar & Simpan Data
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => setShowDeleteDataConfirm(true)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer md:hover:bg-destructive/10"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Keluar & Hapus Semua Data
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>

    <AlertDialog open={showDeleteDataConfirm} onOpenChange={setShowDeleteDataConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus semua data postingan, pengguna, notifikasi, dan percakapan secara permanen dari aplikasi ini di browser Anda.
              Data tidak dapat dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDataConfirm(false)}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutAndDeleteAllData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ya, Hapus Semua & Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isPrivacySettingsModalOpen} onOpenChange={setIsPrivacySettingsModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <PrivacyDialogHeader>
            <PrivacyDialogTitle className="font-headline text-2xl flex items-center gap-2">
                <ShieldQuestion className="h-6 w-6 text-primary" />Pengaturan Privasi Akun
            </PrivacyDialogTitle>
            <PrivacyDialogDescription>
              Kelola siapa yang dapat melihat konten Anda dan status verifikasi akun.
            </PrivacyDialogDescription>
          </PrivacyDialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-3">
              <Label htmlFor="account-type-switch-sidebar" className="font-medium">Privasi Akun</Label>
              <div className="flex items-center space-x-3 p-3 border rounded-md bg-muted/30">
                <Switch
                  id="account-type-switch-sidebar"
                  checked={editedAccountType === 'private'}
                  onCheckedChange={(checked) => setEditedAccountType(checked ? 'private' : 'public')}
                />
                <Label htmlFor="account-type-switch-sidebar" className="text-sm flex items-center gap-1.5 cursor-pointer">
                  {editedAccountType === 'private' ? <Lock className="h-4 w-4"/> : <ShieldOff className="h-4 w-4"/>}
                  {editedAccountType === 'private' ? 'Akun Privat' : 'Akun Publik'}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground px-1">
                Jika akun privat, hanya pengikut yang Anda setujui yang dapat melihat postingan Anda. Permintaan mengikuti akan diperlukan untuk pengguna baru yang ingin mengikuti Anda.
              </p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="account-verified-switch-sidebar" className="font-medium">Verifikasi Akun (Centang Biru)</Label>
              <div className="flex items-center space-x-3 p-3 border rounded-md bg-muted/30">
                <Switch
                  id="account-verified-switch-sidebar"
                  checked={editedIsVerified}
                  onCheckedChange={setEditedIsVerified}
                />
                <Label htmlFor="account-verified-switch-sidebar" className="text-sm flex items-center gap-1.5 cursor-pointer">
                  {editedIsVerified ? <BadgeCheck className="h-4 w-4 text-primary"/> : <BadgeCheck className="h-4 w-4 text-muted"/>}
                  {editedIsVerified ? 'Akun Terverifikasi' : 'Akun Belum Terverifikasi'}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground px-1">
                Aktifkan untuk menampilkan lencana verifikasi (centang biru) di profil Anda.
              </p>
            </div>
          </div>
          <PrivacyDialogFooter>
            <Button variant="outline" onClick={() => setIsPrivacySettingsModalOpen(false)} className="md:hover:bg-accent md:hover:text-accent-foreground">Batal</Button>
            <Button onClick={handleSavePrivacySettings} className="md:hover:bg-primary/90"><Save className="mr-2 h-4 w-4"/>Simpan Perubahan</Button>
          </PrivacyDialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
