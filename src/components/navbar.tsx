"use client";

import Link from "next/link";
import { Music2, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Music2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">DiscoAgent SaaS</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Home
            </Link>
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Dashboard
                </Link>
                <Link
                  href="/upload"
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Upload Track
                </Link>
              </>
            ) : null}
            <Link
              href="/pricing"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Pricing
            </Link>
            {session ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Link href="/auth/signin">
                <Button variant="default" size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
