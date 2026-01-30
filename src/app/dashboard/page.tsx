import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, ListMusic, Crown, Bot } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      tracks: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      playlists: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  const trackCount = await prisma.track.count({
    where: { uploadedBy: session.user.id },
  });

  const playlistCount = await prisma.playlist.count({
    where: { ownerId: session.user.id },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {user?.name || "Music Lover"}!</h1>
        <p className="text-muted-foreground">
          Manage your tracks, playlists, and community here
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trackCount}</div>
            <p className="text-xs text-muted-foreground">
              {user?.isPremium ? "Unlimited" : `${Math.max(0, 10 - trackCount)} remaining in free tier`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Playlists</CardTitle>
            <ListMusic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playlistCount}</div>
            <p className="text-xs text-muted-foreground">
              Curated collections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membership</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.isPremium ? "Premium" : "Free"}
            </div>
            {!user?.isPremium && (
              <Link href="/pricing">
                <Button variant="link" className="h-auto p-0 text-xs">
                  Upgrade to Premium
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Discord Bot Integration */}
      <Card className="mb-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <CardTitle>Discord Bot Integration</CardTitle>
          </div>
          <CardDescription>
            Invite our music bot to your Discord server and share tracks directly with your community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>
            Invite Bot to Discord
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Premium users get priority bot hosting and advanced features
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Recent Tracks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tracks</CardTitle>
            <CardDescription>Your latest uploads</CardDescription>
          </CardHeader>
          <CardContent>
            {user?.tracks && user.tracks.length > 0 ? (
              <div className="space-y-4">
                {user.tracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{track.title}</p>
                      <p className="text-sm text-muted-foreground">{track.genre}</p>
                    </div>
                  </div>
                ))}
                <Link href="/upload">
                  <Button variant="outline" className="w-full">
                    Upload New Track
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <Music className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No tracks yet. Upload your first track!
                </p>
                <Link href="/upload">
                  <Button className="mt-4">Upload Track</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Playlists */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Playlists</CardTitle>
            <CardDescription>Your curated collections</CardDescription>
          </CardHeader>
          <CardContent>
            {user?.playlists && user.playlists.length > 0 ? (
              <div className="space-y-4">
                {user.playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{playlist.name}</p>
                      {playlist.description && (
                        <p className="text-sm text-muted-foreground">
                          {playlist.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  Create New Playlist
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <ListMusic className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No playlists yet. Create your first playlist!
                </p>
                <Button className="mt-4">Create Playlist</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
