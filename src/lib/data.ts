
import type { User, Post, Comment, Notification } from './types';

export const initialUsers: User[] = [];

export const initialPosts: Post[] = [];

export const initialNotifications: Notification[] = [];

// Updated to return string | null, and read from localStorage
export const getCurrentUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('currentUserId');
  }
  return null; 
};
