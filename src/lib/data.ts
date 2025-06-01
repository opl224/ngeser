
import type { User, Post, Comment } from './types';

export const initialUsers: User[] = [];

export const initialPosts: Post[] = [];

// Updated to return string | null, and read from localStorage
export const getCurrentUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('currentUserId');
  }
  return null; 
};

