
"use client";

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Post, User } from '@/lib/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { initialPosts, initialUsers, getCurrentUserId } from '@/lib/data';
import { UploadCloud, Image as ImageIcon, Film, GalleryVerticalEnd, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function UploadForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useLocalStorageState<Post[]>('posts', initialPosts);
  const [users, setUsers] = useLocalStorageState<User[]>('users', initialUsers); // eslint-disable-line @typescript-eslint/no-unused-vars

  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [mentions, setMentions] = useState('');
  const [mediaType, setMediaType] = useState<'photo' | 'reel' | 'story'>('photo');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const currentUserId = typeof window !== 'undefined' ? getCurrentUserId() : null;


  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (mediaType === 'reel' && file.type.startsWith('video/')) {
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        videoElement.onloadedmetadata = () => {
          window.URL.revokeObjectURL(videoElement.src); // Clean up
          if (videoElement.duration > 60) {
            toast({
              title: "Durasi Reel Terlalu Panjang",
              description: "Durasi video untuk Reel tidak boleh lebih dari 1 menit.",
              variant: "destructive",
            });
            setMediaFile(null);
            setMediaPreview(null);
            if (e.target) {
              e.target.value = ''; // Reset input file
            }
          } else {
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
          }
        };
        videoElement.onerror = () => {
            toast({
                title: "Gagal Memuat Video",
                description: "Tidak dapat memuat metadata video. Silakan coba file lain.",
                variant: "destructive",
            });
            setMediaFile(null);
            setMediaPreview(null);
            if (e.target) {
              e.target.value = '';
            }
        };
        videoElement.src = URL.createObjectURL(file);
      } else {
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
      }
    } else {
      setMediaFile(null);
      setMediaPreview(null);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUserId) {
        toast({ title: "Kesalahan", description: "Pengguna tidak dikenal. Tidak dapat membuat postingan.", variant: "destructive"});
        return;
    }
    if (!mediaFile) {
        toast({ title: "Kesalahan", description: "Silakan pilih file media untuk diunggah.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);

    const mediaUrl = mediaPreview || `https://placehold.co/${mediaType === 'reel' || mediaType === 'story' ? '400x600' : '600x400'}.png`;

    const newPost: Post = {
      id: `post-${Date.now()}`,
      userId: currentUserId,
      type: mediaType,
      mediaUrl,
      mediaMimeType: mediaFile.type,
      caption,
      hashtags: hashtags.split(',').map(h => h.trim()).filter(Boolean),
      mentions: mentions.split(',').map(m => m.trim().replace('@', '')).filter(Boolean),
      likes: [],
      comments: [],
      timestamp: new Date().toISOString(),
      shareCount: 0,
      viewCount: 0,
    };

    setPosts(prevPosts => [newPost, ...prevPosts]);
    
    toast({ title: "Berhasil!", description: "Postingan Anda telah diunggah.", className: "bg-primary text-primary-foreground" });
    setIsSubmitting(false);
    router.push('/'); 
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <UploadCloud className="h-7 w-7 text-primary" /> Buat Postingan Baru
        </CardTitle>
        <CardDescription>Bagikan momen Anda dengan dunia. Unggah foto, reel atau cerita.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="mediaType" className="font-medium block mb-2">Jenis Media</Label>
            <RadioGroup
              id="mediaType"
              defaultValue="photo"
              onValueChange={(value: 'photo' | 'reel' | 'story') => {
                setMediaType(value);
                setMediaFile(null);
                setMediaPreview(null);
                const fileInput = document.getElementById('mediaFile') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
              }}
              className="flex flex-wrap gap-x-4 gap-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="photo" id="r-photo" />
                <Label htmlFor="r-photo" className="flex items-center gap-1.5"><ImageIcon className="h-4 w-4"/> Foto</Label>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="reel" id="r-reel" />
                  <Label htmlFor="r-reel" className="flex items-center gap-1.5"><Film className="h-4 w-4"/> Reel</Label>
                </div>
                {mediaType === 'reel' && (
                  <p className="text-xs text-muted-foreground mt-1 ml-6">maks 1 menit.</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="story" id="r-story" />
                <Label htmlFor="r-story" className="flex items-center gap-1.5"><GalleryVerticalEnd className="h-4 w-4"/> Cerita</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="mediaFile" className="font-medium">Berkas Media</Label>
            <Input
              id="mediaFile"
              type="file"
              accept={mediaType === 'reel' ? "video/*" : (mediaType === 'story' ? "image/*,video/*" : "image/*")}
              onChange={handleFileChange}
              className="mt-1 file:mr-4 file:py-0 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              required
            />
            {mediaPreview && (
              <div className={cn(
                "mt-4 border rounded-lg overflow-hidden max-h-96 flex justify-center items-center bg-muted/20",
                mediaType === 'story' ? 'aspect-[9/16]' : (mediaType === 'reel' ? 'aspect-[9/16]' : 'aspect-video')
              )}>
                {mediaFile?.type.startsWith('image/') ? (
                  <Image src={mediaPreview} alt="Pratinjau Media" width={mediaType === 'reel' || mediaType === 'story' ? 300 : 500} height={mediaType === 'reel' || mediaType === 'story' ? 500 : 300} style={{objectFit: "contain"}} className="max-h-96 w-auto"/>
                ) : mediaFile?.type.startsWith('video/') ? (
                  <video src={mediaPreview} controls className="max-h-96 w-full" />
                ) : null }
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="caption" className="font-medium">Keterangan</Label>
            <Textarea
              id="caption"
              placeholder="Tulis keterangan..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="mt-1 min-h-[100px]"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="hashtags" className="font-medium">Tagar</Label>
            <Input
              id="hashtags"
              placeholder="cth: liburan, kuliner, senja (dipisah koma)"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="mentions" className="font-medium">Sebutan</Label>
            <Input
              id="mentions"
              placeholder="cth: @pengguna1, @pengguna2 (dipisah koma)"
              value={mentions}
              onChange={(e) => setMentions(e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting || !mediaFile}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Unggah Postingan
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
