
"use client";

import Link from 'next/link';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface StoryAvatarReelProps {
  usersWithStories: User[];
}

export function StoryAvatarReel({ usersWithStories }: StoryAvatarReelProps) {
  if (!usersWithStories || usersWithStories.length === 0) {
    return null; 
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-foreground mb-3 px-1">Cerita</h2>
      <ScrollArea className="w-full whitespace-nowrap rounded-md pb-2">
        <div className="flex space-x-4 p-2">
          {usersWithStories.map((user) => (
            <Link href={`/profile/${user.id}`} key={user.id} className="flex flex-col items-center space-y-1 group w-20">
              <div className="p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 group-hover:from-yellow-300 group-hover:via-red-400 group-hover:to-pink-400 transition-all">
                <Avatar className="h-16 w-16 border-2 border-background">
                  <AvatarImage src={user.avatarUrl} alt={user.username} data-ai-hint="story avatar person"/>
                  <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <p className="text-xs text-foreground truncate w-full text-center group-hover:text-primary">{user.username}</p>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
