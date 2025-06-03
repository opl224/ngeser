
export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  bio?: string;
  followers: string[]; // array of user IDs
  following: string[]; // array of user IDs
  savedPosts: string[]; // array of post IDs
  accountType: 'public' | 'private';
  isVerified?: boolean;
  pendingFollowRequests: string[]; // User IDs who requested to follow this user
  sentFollowRequests: string[]; // User IDs this user has requested to follow
}

export interface Comment {
  id:string;
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
  mediaMimeType?: string; 
  caption: string; 
  hashtags: string[];
  mentions: string[];
  likes: string[];
  comments: Comment[];
  timestamp: string;
  shareCount: number;
  viewCount: number;
}

export type SuggestHashtagsInput = {
  description: string;
};

export type SuggestHashtagsOutput = {
  hashtags: string[];
};

export type NotificationType = 'like' | 'comment' | 'reply' | 'follow' | 'follow_request' | 'follow_accepted';

export interface Notification {
  id: string;
  recipientUserId: string; 
  actorUserId: string;     
  type: NotificationType;
  postId?: string;          
  commentId?: string;       
  postMediaUrl?: string;    
  timestamp: string;
  isRead: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User; 
  text: string;
  timestamp: string;
  isRead?: boolean; 
  editedTimestamp?: string; // Untuk menandai pesan yang diedit
}

export interface Conversation {
  id: string;
  participantIds: string[]; 
  participants?: User[]; 
  messages: Message[]; 
  lastMessage?: Message; 
  timestamp: string; 
  unreadCount?: Record<string, number>; 
}
