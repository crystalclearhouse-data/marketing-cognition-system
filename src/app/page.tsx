import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Users, Zap, Bot } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="mb-6 text-5xl font-bold tracking-tight">
          Build Your Bass/Disco Music Community
          <br />
          <span className="text-primary">with Discord Bot Integration</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
          Share your favorite bass house and disco tracks, create curated playlists,
          and connect with your community through our integrated Discord bot.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/auth/signin">
            <Button size="lg">Get Started Free</Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline">
              View Pricing
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Everything You Need to Build Your Music Community
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Music className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Share Tracks</CardTitle>
                <CardDescription>
                  Upload and share your favorite bass house, disco, and electronic music tracks
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Create Playlists</CardTitle>
                <CardDescription>
                  Curate and organize tracks into themed playlists for your community
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Bot className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Discord Bot</CardTitle>
                <CardDescription>
                  Integrate directly with Discord for seamless music sharing in your server
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Premium Features</CardTitle>
                <CardDescription>
                  Unlock unlimited uploads, ad-free experience, and priority bot hosting
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h2 className="mb-6 text-3xl font-bold">
          Ready to Start Building Your Community?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          Join thousands of music lovers sharing and discovering amazing bass house and disco tracks.
        </p>
        <Link href="/auth/signin">
          <Button size="lg">Sign Up Now - It's Free!</Button>
        </Link>
      </section>
    </div>
  );
}
