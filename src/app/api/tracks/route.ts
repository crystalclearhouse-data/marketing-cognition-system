import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    // Check if user has reached track limit (free tier: 10 tracks)
    if (!user?.isPremium) {
      const trackCount = await prisma.track.count({
        where: { uploadedBy: session.user.id },
      });

      if (trackCount >= 10) {
        return NextResponse.json(
          { error: "Track limit reached. Upgrade to Premium for unlimited uploads." },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { title, url, genre } = body;

    if (!title || !url || !genre) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const track = await prisma.track.create({
      data: {
        title,
        url,
        genre,
        uploadedBy: session.user.id,
      },
    });

    return NextResponse.json(track);
  } catch (error) {
    console.error("Error creating track:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get("genre");

    const tracks = await prisma.track.findMany({
      where: genre ? { genre } : undefined,
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json(tracks);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
