// No "use client" directive here

import { PostDetailClientPage } from '@/components/PostDetailClientPage';
import type { Metadata } from 'next';
// Assuming initialPosts, initialUsers are representative for metadata. Removed for now as not directly used in generateMetadata.
// import { initialPosts, initialUsers } from '@/lib/data';
import React from 'react'; // Changed from: import { use } from 'react';

// Removed generateStaticParams as it returns [], which is the default.
// export async function generateStaticParams() {
//   return [];
// }

export async function generateMetadata(
  { params }: { params: { postId: string } } // Destructuring here is fine for generateMetadata
): Promise<Metadata> {
  // In a real app, fetch post data by postId to generate dynamic metadata
  // For this example, we'll use a generic title.
  const postId = params.postId;
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
    title: `Detail Postingan: ${postId}`, // Example: make title slightly more dynamic
    description: 'Lihat detail postingan, komentar, dan interaksi lainnya.',
  };
}

interface PostPageProps {
  params: { postId: string };
}

export default function PostPage({ params }: PostPageProps) { // Accept params directly
  const actualParams = React.use(params); // Changed from: use(params)
  const postId = actualParams.postId; // Access postId from the unwrapped params

  return <PostDetailClientPage postId={postId} />;
}
