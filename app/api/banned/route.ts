import { NextResponse } from "next/server";
import { isContentBanned } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tmdbId = url.searchParams.get('tmdb_id');
    const contentType = url.searchParams.get('content_type');

    if (!tmdbId || !contentType) {
      return NextResponse.json({ error: 'tmdb_id and content_type query parameters are required' }, { status: 400 });
    }

    if (!['movie', 'tv'].includes(contentType)) {
      return NextResponse.json({ error: 'content_type must be either "movie" or "tv"' }, { status: 400 });
    }

    const isBanned = await isContentBanned(parseInt(tmdbId), contentType as 'movie' | 'tv');

    return NextResponse.json({ banned: isBanned });
  } catch (error: unknown) {
    console.error('Error checking banned content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to check banned content: ' + errorMessage }, { status: 500 });
  }
}
