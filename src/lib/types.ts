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
  type: 'photo' | 'video' | 'reel';
  mediaUrl: string; 
  caption: string; // Changed from description to caption
  hashtags: string[];
  mentions: string[]; 
  likes: string[]; 
  comments: Comment[];
  timestamp: string; 
  shareCount: number;
  viewCount: number;
}

// For suggested hashtags AI
export type SuggestHashtagsInput = {
  description: string;
};

export type SuggestHashtagsOutput = {
  hashtags: string[];
};
