
// No "use client" directive here

import { PostDetailClientPage } from '@/components/PostDetailClientPage';
import type { Metadata } from 'next';
import type { Post, User } from '@/lib/types'; // Assuming initialPosts, initialUsers are representative for metadata
import { initialPosts, initialUsers } from '@/lib/data'; // For metadata purposes if needed

export async function generateStaticParams() {
  // In a real app, you might fetch all post IDs here. For now, it's dynamic.
  return [];
}

export async function generateMetadata(
  { params: { postId } }: { params: { postId: string } }
): Promise<Metadata> {
  // In a real app, fetch post data by postId to generate dynamic metadata
  // For this example, we'll use a generic title or try to find it in initialData if available.
  
  // Simulating data fetching for metadata:
  // const post = initialPosts.find(p => p.id === postId);
  // const author = post ? initialUsers.find(u => u.id === post.userId) : null;

  // if (post && author) {
  //   return {
  //     title: `Postingan oleh ${author.username}: "${post.caption.substring(0, 30)}..."`,
  //     description: post.caption || 'Lihat detail postingan, komentar, dan interaksi lainnya.',
  //   };
  // }
  
  return {
    title: `Detail Postingan`,
    description: 'Lihat detail postingan, komentar, dan interaksi lainnya.',
  };
}

interface PostPageProps {
  params: { postId: string };
}

export default function PostPage({ params: { postId } }: PostPageProps) {
  return <PostDetailClientPage postId={postId} />;
}
