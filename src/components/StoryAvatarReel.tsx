
"use client";

import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface UserWithStoryCount extends User {
  storyCount: number;
}
interface StoryAvatarReelProps {
  usersWithStories: UserWithStoryCount[];
  onAvatarClick: (userId: string) => void;
}

export function StoryAvatarReel({ usersWithStories, onAvatarClick }: StoryAvatarReelProps) {
  if (!usersWithStories || usersWithStories.length === 0) {
    return null; 
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-foreground mb-3 px-1">Cerita</h2>
      <ScrollArea className="w-full whitespace-nowrap rounded-md pb-2">
        <div className="flex space-x-4 p-2">
          {usersWithStories.map((user) => (
            <div 
              key={user.id} 
              onClick={() => onAvatarClick(user.id)}
              className="flex flex-col items-center space-y-1 group w-20 cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onAvatarClick(user.id)}
              aria-label={`Lihat cerita ${user.username}`}
            >
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 md:group-hover:from-yellow-300 md:group-hover:via-red-400 md:group-hover:to-pink-400 transition-all">
                <Avatar className="h-16 w-16 border-2 border-background">
                  <AvatarImage src={user.avatarUrl} alt={user.username} data-ai-hint="story avatar person"/>
                  <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {user.storyCount > 1 && (
                  <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-background">
                    {user.storyCount}
                  </div>
                )}
              </div>
              <p className="text-xs text-foreground truncate w-full text-center md:group-hover:text-primary">{user.username}</p>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
