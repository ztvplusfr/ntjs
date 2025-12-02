import { NextResponse } from "next/server";
import { getBannedContent, banContent, unbanContent, isContentBanned } from "@/lib/supabase";

// IP autorisées pour l'accès admin
const ADMIN_IPS = ['165.169.45.189', '192.168.1.3'];

// Fonction pour vérifier l'IP du client
function getClientIP(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwarded ? forwarded.split(',')[0].trim() : realIp;
}

// Middleware de vérification d'IP
function checkAdminAccess(request: Request): boolean {
  const clientIp = getClientIP(request);
  console.log(`API access attempt from IP: ${clientIp}`);

  if (!clientIp || !ADMIN_IPS.includes(clientIp)) {
    console.log(`Unauthorized API access from IP: ${clientIp}`);
    return false;
  }

  console.log(`Authorized API access from IP: ${clientIp}`);
  return true;
}

export async function GET(request: Request) {
  // Vérifier l'accès admin
  if (!checkAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const bannedContent = await getBannedContent();

    if (!bannedContent) {
      return NextResponse.json({ error: 'Failed to fetch banned content' }, { status: 500 });
    }

    return NextResponse.json({ banned: bannedContent });
  } catch (error: unknown) {
    console.error('Error fetching banned content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch banned content: ' + errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Vérifier l'accès admin
  if (!checkAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tmdb_id, content_type, reason, created_by } = body;

    if (!tmdb_id || !content_type) {
      return NextResponse.json({ error: 'tmdb_id and content_type are required' }, { status: 400 });
    }

    if (!['movie', 'tv'].includes(content_type)) {
      return NextResponse.json({ error: 'content_type must be either "movie" or "tv"' }, { status: 400 });
    }

    // Vérifier si le contenu est déjà banni
    const alreadyBanned = await isContentBanned(tmdb_id, content_type as 'movie' | 'tv');
    if (alreadyBanned) {
      return NextResponse.json({ error: 'Content is already banned' }, { status: 400 });
    }

    const success = await banContent(tmdb_id, content_type as 'movie' | 'tv', reason, created_by);

    if (!success) {
      return NextResponse.json({ error: 'Failed to ban content' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Content banned successfully' });
  } catch (error: unknown) {
    console.error('Error banning content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to ban content: ' + errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  // Vérifier l'accès admin
  if (!checkAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    const success = await unbanContent(parseInt(tmdbId), contentType as 'movie' | 'tv');

    if (!success) {
      return NextResponse.json({ error: 'Failed to unban content' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Content unbanned successfully' });
  } catch (error: unknown) {
    console.error('Error unbanning content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to unban content: ' + errorMessage }, { status: 500 });
  }
}
