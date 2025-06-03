
"use client";

import Link from 'next/link';
import { Home, PlusSquare, User, Film, LogIn, Search as SearchIconLucide, Bell, Trash2, X as XIcon, MessageSquare, UserCheck, UserX, ShieldQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePathname, useRouter } from 'next/navigation';
import { cn, formatTimestamp } from '@/lib/utils';
import { useEffect, useState, FormEvent, useMemo, Dispatch, SetStateAction } from 'react';
import { getCurrentUserId, initialNotifications, initialUsers } from '@/lib/data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Notification, User as UserType, NotificationType } from '@/lib/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";


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


export function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [notifications, setNotifications] = useLocalStorageState<Notification[]>('notifications', initialNotifications);
  const [allUsers, setAllUsers] = useLocalStorageState<UserType[]>('users', initialUsers);

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

  const unreadCount = unreadNotifications.length;

  const sortedNotificationsForDisplay = useMemo(() => {
    if (!currentUserId || !isClient) return [];
    return notifications
      .filter(n => n.recipientUserId === currentUserId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [notifications, currentUserId, isClient]);

  const handleOpenNotifications = (open: boolean) => {
    if (open && unreadCount > 0 && currentUserId) {
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
    const CUIDUser = allUsers.find(u => u.id === currentUserId);
    const requesterUser = allUsers.find(u => u.id === requesterId);

    if (!currentUserId) {
        toast({ title: "Kesalahan Pengguna", description: "Pengguna saat ini tidak terdefinisi.", variant: "destructive"});
        return;
    }
    if (!CUIDUser || !requesterUser) {
        toast({ title: "Kesalahan Data Pengguna", description: "Tidak dapat menemukan data pengguna terkait untuk memproses permintaan.", variant: "destructive"});
        setNotifications(prevNots => prevNots.map(n => {
          if (n.id === notificationId) {
            return {
              ...n,
              type: 'follow_request_handled' as NotificationType,
              processedState: 'accepted', 
              isRead: true, 
              messageOverride: `Gagal memproses penerimaan untuk ${requesterUser?.username || 'pengguna'} karena data tidak lengkap.`
            };
          }
          return n;
        }));
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
    
    setNotifications(prevNots => prevNots.map(n => {
      if (n.id === notificationId) {
        return {
          ...n,
          type: 'follow_request_handled' as NotificationType,
          processedState: 'accepted',
          isRead: true, 
          messageOverride: usersUpdateError ? `Permintaan dari ${requesterUser.username} diterima, tetapi ada masalah saat memperbarui daftar pengikut/mengikuti.` : undefined
        };
      }
      return n;
    }));
    
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
            description: `Permintaan dari ${requesterUser.username} diterima, tetapi ada masalah saat memperbarui daftar pengikut/mengikuti. Notifikasi UI diperbarui.`,
            variant: "destructive",
            duration: 7000,
        });
    }
  };

  const handleDeclineFollowRequest = (requesterId: string, notificationId: string) => {
    const CUIDUser = allUsers.find(u => u.id === currentUserId);
    const requesterUser = allUsers.find(u => u.id === requesterId);

    if (!currentUserId) {
        toast({ title: "Kesalahan", description: "Tidak dapat memproses permintaan, pengguna tidak dikenal.", variant: "destructive"});
        return;
    }
    if (!CUIDUser || !requesterUser) {
        toast({ title: "Kesalahan Data Pengguna", description: "Tidak dapat menemukan data pengguna terkait untuk memproses penolakan.", variant: "destructive"});
         setNotifications(prevNots => prevNots.map(n => {
          if (n.id === notificationId) {
            return {
              ...n,
              type: 'follow_request_handled' as NotificationType,
              processedState: 'declined', 
              isRead: true,
              messageOverride: `Gagal memproses penolakan untuk ${requesterUser?.username || 'pengguna'} sepenuhnya, tetapi permintaan ditandai ditolak.`
            };
          }
          return n;
        }));
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
          messageOverride: undefined 
        };
      }
      return n;
    }));
    toast({ title: "Permintaan Ditolak" });
  };


  const baseNavItems = [
    { href: '/', label: 'Beranda', icon: Home },
  ];

  const authNavItems = [
    { href: '/upload', label: 'Unggah', icon: PlusSquare },
    { href: '/profile', label: 'Profil', icon: User },
  ];

  const loginNavItem = { href: '/login', label: 'Masuk', icon: LogIn };

  const allNavItems = currentUserId
    ? [...baseNavItems, ...authNavItems]
    : [...baseNavItems, loginNavItem];

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  if (!isClient) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Film className="h-7 w-7 text-primary" />
            <span className="font-headline text-2xl font-semibold text-foreground">Elegance</span>
          </Link>
        </div>
      </header>
    );
  }

  if (pathname === '/login') {
     return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-center">
          <Link href="/" className="flex items-center gap-2">
            <Film className="h-7 w-7 text-primary" />
            <span className="font-headline text-2xl font-semibold text-foreground">Elegance</span>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-x-4">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Film className="h-7 w-7 text-primary" />
          <span className="font-headline text-2xl font-semibold text-foreground">Elegance</span>
        </Link>

        <div className="flex-1 hidden sm:flex justify-center px-2 md:px-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center relative w-full max-w-sm md:max-w-md">
            <SearchIconLucide className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Cari pengguna..."
              className="pl-10 pr-3 py-2 text-sm h-9 w-full rounded-md bg-muted/50 hover:bg-muted focus:bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-ai-hint="search users input"
            />
          </form>
        </div>

        <div className="flex items-center gap-x-1 sm:gap-x-2">
            <nav className="items-center gap-1 sm:gap-0 flex-shrink-0 hidden sm:flex">
            {allNavItems.map((item) => (
                <Button
                key={item.label}
                variant="ghost"
                asChild
                className={cn(
                    "text-sm font-medium px-2 sm:px-3",
                    pathname === item.href ? "text-primary hover:text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                )}
                >
                <Link href={item.href} className="flex items-center gap-2">
                    <item.icon className="h-5 w-5" />
                    <span className="inline">{item.label}</span>
                </Link>
                </Button>
            ))}
            </nav>

            {currentUserId && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className={cn(
                    "text-muted-foreground hover:text-foreground",
                    pathname === '/dm' && "text-primary bg-primary/10"
                  )}
                  aria-label="Pesan Langsung"
                >
                  <Link href="/dm">
                    <MessageSquare className="h-5 w-5" />
                  </Link>
                </Button>

                <DropdownMenu onOpenChange={handleOpenNotifications}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Notifikasi"
                      className="relative text-muted-foreground hover:text-foreground"
                    >
                      <Bell className="h-5 w-5" />
                      {isClient && unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-1 -right-1 h-4 w-4 min-w-min p-0.5 text-xs flex items-center justify-center rounded-full pointer-events-none"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 md:w-96 max-h-[70vh] overflow-y-auto">
                    <DropdownMenuLabel className="font-headline">
                      <div className="flex items-center justify-between">
                        <span>Notifikasi</span>
                        {sortedNotificationsForDisplay.length > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation(); 
                              handleClearAllNotifications();
                            }}
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
                            <DropdownMenuItem asChild className={cn("cursor-pointer w-full pr-8", !notification.isRead && isClient && notification.type !== 'follow_request_handled' ? 'hover:!bg-primary/20' : 'hover:!bg-accent/80')}>
                              <Link href={linkHref} className="flex items-start gap-3 p-2 w-full">
                                <Avatar className="h-8 w-8 mt-0.5 flex-shrink-0">
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
                                        variant="outline"
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
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteNotification(notification.id);
                                }}
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
    </header>
  );
}

interface Notification {
  id: string;
  recipientUserId: string;
  actorUserId: string;
  type: NotificationType;
  postId?: string;
  commentId?: string;
  postMediaUrl?: string;
  timestamp: string;
  isRead: boolean;
  processedState?: 'accepted' | 'declined';
  messageOverride?: string; 
}

    
