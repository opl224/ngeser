// No "use client" directive here

import { PostDetailClientPage } from '@/components/PostDetailClientPage';
import type { Metadata } from 'next';
import React from 'react';

export async function generateMetadata(
  { params }: { params: { postId: string } }
): Promise<Metadata> {
  const postId = params.postId;
  return {
    title: `Detail Postingan: ${postId}`,
    description: 'Lihat detail postingan, komentar, dan interaksi lainnya.',
  };
}

interface PostPageProps {
  params: { postId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function PostPage({ params, searchParams }: PostPageProps) {
  const actualParams = React.use(params);
  // Unwap searchParams even if not directly used in this component's logic
  // to prevent errors if Next.js internals try to access its keys.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _resolvedSearchParams = React.use(searchParams); 

  const postId = actualParams.postId;
  return <PostDetailClientPage postId={postId} />;
}
