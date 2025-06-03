
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2 } from 'lucide-react';
import { suggestHashtags } from '@/ai/flows/suggest-hashtags';
import type { SuggestHashtagsInput } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SuggestedHashtagsClientProps {
  onHashtagsSuggested: (hashtags: string[]) => void;
  initialDescription?: string;
}

export function SuggestedHashtagsClient({ onHashtagsSuggested, initialDescription = "" }: SuggestedHashtagsClientProps) {
  const [description, setDescription] = useState(initialDescription);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuggestHashtags = async () => {
    if (!description.trim()) {
      setError("Silakan masukkan deskripsi terlebih dahulu.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const input: SuggestHashtagsInput = { description };
      const result = await suggestHashtags(input);
      setSuggested(result.hashtags);
      onHashtagsSuggested(result.hashtags);
    } catch (err) {
      console.error("Error suggesting hashtags:", err);
      setError("Gagal menyarankan tagar. Silakan coba lagi.");
      setSuggested([]);
    }
    setIsLoading(false);
  };

  return (
    <Card className="mt-6 bg-card/50 shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          Bantuan Tagar AI
        </CardTitle>
        <CardDescription>
          Dapatkan saran tagar berbasis AI berdasarkan keterangan Anda.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="ai-description" className="font-medium">Keterangan untuk Pembuatan Tagar</Label>
          <Textarea
            id="ai-description"
            placeholder="Masukkan keterangan postingan Anda di sini..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 min-h-[80px]"
            rows={3}
          />
        </div>
        <Button onClick={handleSuggestHashtags} disabled={isLoading || !description.trim()} className="w-full sm:w-auto">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Sarankan Tagar
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {suggested.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-sm font-medium text-foreground">Tagar yang Disarankan:</h4>
            <div className="flex flex-wrap gap-2">
              {suggested.map((tag, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer md:hover:bg-accent" onClick={() => onHashtagsSuggested([tag])}>
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
