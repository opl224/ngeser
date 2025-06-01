import type { User, Post, Comment } from './types';

export const initialUsers: User[] = [
  {
    id: 'user1',
    username: 'OliviaGrace',
    avatarUrl: 'https://placehold.co/100x100.png',
    bio: 'Lover of art, travel, and everything in between. Exploring the world one photo at a time. 🎨✈️',
    followers: ['user2'],
    following: ['user2', 'user3'],
  },
  {
    id: 'user2',
    username: 'EthanJames',
    avatarUrl: 'https://placehold.co/100x100.png',
    bio: 'Tech enthusiast & coffee addict. Coding my way through life. 💻☕',
    followers: ['user1', 'user3'],
    following: ['user1'],
  },
  {
    id: 'user3',
    username: 'SophiaWillow',
    avatarUrl: 'https://placehold.co/100x100.png',
    bio: 'Foodie, bookworm, and nature lover. Finding beauty in everyday moments. 📚🌿',
    followers: ['user1'],
    following: ['user1'],
  },
];

export const initialPosts: Post[] = [
  {
    id: 'post1',
    userId: 'user1',
    type: 'photo',
    mediaUrl: 'https://placehold.co/600x400.png',
    caption: 'Beautiful sunset views from my recent trip! Unforgettable moments. #travel #sunset #nature',
    hashtags: ['travel', 'sunset', 'nature'],
    mentions: [],
    likes: ['user2', 'user3'],
    comments: [
      { id: 'comment1', postId: 'post1', userId: 'user2', text: 'Wow, stunning shot!', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), replies: [] },
      { id: 'comment2', postId: 'post1', userId: 'user3', text: 'Absolutely breathtaking!', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), replies: [] },
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    shareCount: 5,
  },
  {
    id: 'post2',
    userId: 'user2',
    type: 'video',
    mediaUrl: 'https://placehold.co/600x400.png',
    caption: 'Quick demo of my latest coding project. So excited to share this! #coding #tech #development @OliviaGrace',
    hashtags: ['coding', 'tech', 'development'],
    mentions: ['OliviaGrace'],
    likes: ['user1'],
    comments: [
      { id: 'comment3', postId: 'post2', userId: 'user1', text: 'Looks amazing, Ethan!', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), replies: [] },
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    shareCount: 2,
  },
  {
    id: 'post3',
    userId: 'user3',
    type: 'reel',
    mediaUrl: 'https://placehold.co/400x600.png',
    caption: 'My attempt at baking a delicious cake. It was a success! 🍰 #baking #foodie #homemade',
    hashtags: ['baking', 'foodie', 'homemade'],
    mentions: [],
    likes: ['user1', 'user2'],
    comments: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    shareCount: 8,
  },
];

// Current "logged in" user - for demo purposes
export const getCurrentUserId = (): string => 'user1';
