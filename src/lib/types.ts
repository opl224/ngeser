
export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  bio?: string;
  followers: string[]; // array of user IDs
  following: string[]; // array of user IDs
  savedPosts: string[]; // array of post IDs
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user?: User; 
  text: string;
  timestamp: string; 
  parentId?: string | null;
  replies?: Comment[]; 
}

export interface Post {
  id: string;
  userId: string;
  user?: User;
  type: 'photo' | 'video' | 'reel' | 'story';
  mediaUrl: string; 
  mediaMimeType?: string; // Untuk menyimpan tipe MIME asli dari media yang diunggah
  caption: string; // Diubah dari description ke caption
  hashtags: string[];
  mentions: string[]; 
  likes: string[]; 
  comments: Comment[];
  timestamp: string; 
  shareCount: number;
  viewCount: number;
}

// Untuk suggested hashtags AI
export type SuggestHashtagsInput = {
  description: string;
};

export type SuggestHashtagsOutput = {
  hashtags: string[];
};

// Notifikasi
export type NotificationType = 'like' | 'comment' | 'reply' | 'follow';

export interface Notification {
  id: string;
  recipientUserId: string; // User who receives the notification
  actorUserId: string;     // User who performed the action (e.g., who liked, who commented)
  type: NotificationType;
  postId?: string;          // For like, comment, reply on a post
  commentId?: string;       // For reply to a comment (the parent comment ID)
  postMediaUrl?: string;    // Optional: for quick preview in notification UI
  timestamp: string;
  isRead: boolean;
}
