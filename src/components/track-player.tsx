"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactPlayer from "react-player/lazy";

interface TrackPlayerProps {
  title: string;
  url: string;
  genre: string;
  uploaderName?: string;
}

export function TrackPlayer({ title, url, genre, uploaderName }: TrackPlayerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium">
            {genre}
          </span>
          {uploaderName && <span>by {uploaderName}</span>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <ReactPlayer
            url={url}
            width="100%"
            height="100%"
            controls
            config={{
              youtube: {
                playerVars: { showinfo: 1 }
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
