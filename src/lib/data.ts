
import type { User, Post, Comment, Notification, Conversation } from './types';

export const initialUsers: User[] = [
  {
    id: 'user-001',
    username: 'NatureExplorer',
    fullName: 'Nature Explorer',
    email: 'nature@example.com',
    password: 'password123',
    avatarUrl: 'https://placehold.co/100x100.png?text=NE',
    bio: 'Wandering where the WiFi is weak. 🌲🏔️',
    followers: ['user-002', 'user-currentUser'],
    following: ['user-002', 'user-003'],
    savedPosts: ['post-002'],
    accountType: 'public',
    isVerified: true,
    pendingFollowRequests: [],
    sentFollowRequests: [],
  },
  {
    id: 'user-002',
    username: 'CityArtLover',
    fullName: 'City ArtLover',
    email: 'art@example.com',
    password: 'password123',
    avatarUrl: 'https://placehold.co/100x100.png?text=CA',
    bio: 'Street art, gallery hops, and cityscapes. 🎨🏙️',
    followers: ['user-001'],
    following: ['user-001', 'user-currentUser'],
    savedPosts: [],
    accountType: 'public',
    isVerified: false,
    pendingFollowRequests: [],
    sentFollowRequests: [],
  },
  {
    id: 'user-003',
    username: 'FoodieAdventures',
    fullName: 'Foodie Adventures',
    email: 'foodie@example.com',
    password: 'password123',
    avatarUrl: 'https://placehold.co/100x100.png?text=FA',
    bio: 'Eating my way around the world, one dish at a time. 🍜🌮🍣',
    followers: ['user-currentUser'],
    following: ['user-001'],
    savedPosts: ['post-001'],
    accountType: 'private',
    isVerified: false,
    pendingFollowRequests: [],
    sentFollowRequests: ['user-002'],
  },
  {
    id: 'user-currentUser',
    username: 'CurrentUser',
    fullName: 'Current User',
    email: 'current@example.com',
    password: 'password123',
    avatarUrl: 'https://placehold.co/100x100.png?text=CU',
    bio: 'Just me, exploring this app!',
    followers: ['user-001'],
    following: ['user-001', 'user-002'],
    savedPosts: ['post-003'],
    accountType: 'public',
    isVerified: true,
    pendingFollowRequests: [],
    sentFollowRequests: [],
  },
   {
    id: 'user-urbanDancer',
    username: 'UrbanDancer',
    fullName: 'Urban Dancer',
    email: 'dancer@example.com',
    password: 'password123',
    avatarUrl: 'https://placehold.co/100x100.png?text=UD',
    bio: 'Dancing through life, one beat at a time. 💃🕺',
    followers: [],
    following: [],
    savedPosts: [],
    accountType: 'public',
    isVerified: false,
    pendingFollowRequests: [],
    sentFollowRequests: [],
  },
];

export const initialPosts: Post[] = [
  {
    id: 'post-001',
    userId: 'user-001',
    type: 'photo',
    mediaUrl: 'https://placehold.co/600x400.png',
    mediaMimeType: 'image/png',
    caption: 'Beautiful mountain views! #nature #travel',
    hashtags: ['nature', 'travel'],
    mentions: [],
    likes: ['user-002', 'user-currentUser'],
    comments: [
      { id: 'comment-001', postId: 'post-001', userId: 'user-002', text: 'Stunning shot!', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), replies:[] },
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    shareCount: 5,
    viewCount: 150,
  },
  {
    id: 'post-002',
    userId: 'user-002',
    type: 'photo',
    mediaUrl: 'https://placehold.co/600x600.png',
    mediaMimeType: 'image/png',
    caption: 'Amazing street art in downtown. #urbanart #graffiti',
    hashtags: ['urbanart', 'graffiti'],
    mentions: ['user-001'],
    likes: ['user-001'],
    comments: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    shareCount: 2,
    viewCount: 90,
  },
  {
    id: 'post-003',
    userId: 'user-currentUser',
    type: 'photo',
    mediaUrl: 'https://placehold.co/400x300.png',
    mediaMimeType: 'image/png',
    caption: 'My first post here! Excited to explore.',
    hashtags: ['newbeginnings'],
    mentions: [],
    likes: ['user-001'],
    comments: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    shareCount: 0,
    viewCount: 25,
  },
  {
    id: 'post-reel-001',
    userId: 'user-urbanDancer',
    type: 'reel',
    mediaUrl: 'https://placehold.co/400x600.mp4', 
    mediaMimeType: 'video/mp4',
    caption: 'Grooving to the city beats! 🎶 #dance #reel #citylife',
    hashtags: ['dance', 'reel', 'citylife'],
    mentions: [],
    likes: ['user-currentUser', 'user-001'],
    comments: [
      { id: 'comment-reel-001', postId: 'post-reel-001', userId: 'user-001', text: 'Awesome moves!', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), replies: [] },
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), 
    shareCount: 10,
    viewCount: 250,
  },
  {
    id: 'story-001-user001',
    userId: 'user-001',
    type: 'story',
    mediaUrl: 'https://placehold.co/1080x1920.png?text=Story1',
    mediaMimeType: 'image/png',
    caption: 'Morning hike vibes! ☀️',
    hashtags: [],
    mentions: [],
    likes: [],
    comments: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), 
    shareCount: 0,
    viewCount: 0, 
  },
  {
    id: 'story-002-user001',
    userId: 'user-001',
    type: 'story',
    mediaUrl: 'https://placehold.co/1080x1920.png?text=Story2',
    mediaMimeType: 'image/png',
    caption: 'Coffee break ☕',
    hashtags: [],
    mentions: [],
    likes: [],
    comments: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), 
    shareCount: 0,
    viewCount: 0,
  },
  {
    id: 'story-001-currentUser',
    userId: 'user-currentUser',
    type: 'story',
    mediaUrl: 'https://placehold.co/1080x1920.png?text=MyStory',
    mediaMimeType: 'image/png',
    caption: 'Testing out stories!',
    hashtags: [],
    mentions: [],
    likes: [],
    comments: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), 
    shareCount: 0,
    viewCount: 0,
  }
];

export const initialNotifications: Notification[] = [
   {
    id: 'notif-welcome-currentUser',
    recipientUserId: 'user-currentUser',
    actorUserId: 'system', 
    type: 'follow_accepted', 
    messageOverride: 'Selamat datang di Ngeser! Jelajahi dan bagikan momen Anda.',
    timestamp: new Date().toISOString(),
    isRead: false,
  },
  {
    id: 'notif-sample-like',
    recipientUserId: 'user-currentUser',
    actorUserId: 'user-001',
    type: 'like',
    postId: 'post-003', 
    postMediaUrl: 'https://placehold.co/400x300.png',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), 
    isRead: true,
  },
  {
    id: 'notif-sample-follow',
    recipientUserId: 'user-currentUser',
    actorUserId: 'user-002',
    type: 'follow',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), 
    isRead: false,
  }
];

export const initialConversations: Conversation[] = [
  {
    id: 'conv-001',
    participantIds: ['user-currentUser', 'user-001'],
    messages: [
      { id: 'msg-c1-001', conversationId: 'conv-001', senderId: 'user-001', text: 'Hey, CurrentUser! Welcome to the app.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), isRead: true },
      { id: 'msg-c1-002', conversationId: 'conv-001', senderId: 'user-currentUser', text: 'Thanks, NatureExplorer! Glad to be here.', timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(), isRead: true },
      { id: 'msg-c1-003', conversationId: 'conv-001', senderId: 'user-001', text: 'Did you see my latest post about the mountains?', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), isRead: false },
    ],
    lastMessage: { id: 'msg-c1-003', conversationId: 'conv-001', senderId: 'user-001', text: 'Did you see my latest post about the mountains?', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), isRead: false },
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unreadCount: {
      'user-currentUser': 1, 
      'user-001': 0
    }
  },
  {
    id: 'conv-002',
    participantIds: ['user-currentUser', 'user-002'],
    messages: [
      { id: 'msg-c2-001', conversationId: 'conv-002', senderId: 'user-002', text: 'Loved your first post!', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), isRead: true },
    ],
    lastMessage: { id: 'msg-c2-001', conversationId: 'conv-002', senderId: 'user-002', text: 'Loved your first post!', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), isRead: true },
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    unreadCount: {
      'user-currentUser': 0,
      'user-002': 0
    }
  }
];


export const getCurrentUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    const storedId = localStorage.getItem('currentUserId');
    return storedId;
  }
  return null;
};
