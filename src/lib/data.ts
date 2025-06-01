
import type { User, Post, Comment } from './types';

export const initialUsers: User[] = [
  {
    id: 'user2',
    username: 'EthanJames',
    avatarUrl: 'https://placehold.co/100x100.png',
    bio: 'Penggemar teknologi & pecandu kopi. Membuat kode sepanjang hidup. 💻☕',
    followers: [],
    following: ['user3'],
  },
  {
    id: 'user3',
    username: 'SophiaWillow',
    avatarUrl: 'https://placehold.co/100x100.png',
    bio: 'Pecinta makanan, kutu buku, dan pencinta alam. Menemukan keindahan di setiap momen. 📚🌿',
    followers: ['user2'],
    following: [],
  },
];

export const initialPosts: Post[] = [
   {
    id: 'post2',
    userId: 'user2',
    type: 'video',
    mediaUrl: 'https://placehold.co/600x400.png',
    caption: 'Demo singkat proyek coding terbaruku. Sangat bersemangat untuk membagikan ini! #coding #tech #development',
    hashtags: ['coding', 'tech', 'development'],
    mentions: [],
    likes: ['user3'],
    comments: [
      { id: 'comment3', postId: 'post2', userId: 'user3', text: 'Keren sekali, Ethan!', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), replies: [] },
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    shareCount: 2,
  },
  {
    id: 'post3',
    userId: 'user3',
    type: 'reel',
    mediaUrl: 'https://placehold.co/400x600.png',
    caption: 'Percobaanku membuat kue lezat. Berhasil! 🍰 #baking #foodie #homemade',
    hashtags: ['baking', 'foodie', 'homemade'],
    mentions: [],
    likes: ['user2'],
    comments: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    shareCount: 8,
  },
];

// Updated to return string | null, and read from localStorage
export const getCurrentUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('currentUserId');
  }
  return null; 
};
