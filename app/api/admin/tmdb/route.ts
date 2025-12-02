import { NextResponse } from "next/server";

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
    const url = new URL(request.url);
    const query = url.searchParams.get('query');
    const type = url.searchParams.get('type'); // 'movie' or 'tv'
    const page = url.searchParams.get('page') || '1';

    if (!query || !type) {
      return NextResponse.json({ error: 'query and type parameters are required' }, { status: 400 });
    }

    if (!['movie', 'tv'].includes(type)) {
      return NextResponse.json({ error: 'type must be either "movie" or "tv"' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here';
    const tmdbUrl = `https://api.themoviedb.org/3/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}&language=fr-FR`;

    const response = await fetch(tmdbUrl);

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json({
      results: data.results || [],
      total_results: data.total_results || 0,
      total_pages: data.total_pages || 0,
      page: data.page || 1
    });

  } catch (error: unknown) {
    console.error('Error searching TMDB:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to search TMDB: ' + errorMessage }, { status: 500 });
  }
}

// Récupérer les détails d'un film/série par TMDB ID
export async function POST(request: Request) {
  // Vérifier l'accès admin
  if (!checkAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tmdb_id, type } = body;

    if (!tmdb_id || !type) {
      return NextResponse.json({ error: 'tmdb_id and type are required' }, { status: 400 });
    }

    if (!['movie', 'tv'].includes(type)) {
      return NextResponse.json({ error: 'type must be either "movie" or "tv"' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here';
    const tmdbUrl = `https://api.themoviedb.org/3/${type}/${tmdb_id}?api_key=${apiKey}&language=fr-FR&append_to_response=credits,videos,recommendations,images,content_ratings`;

    const response = await fetch(tmdbUrl);

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json(data);

  } catch (error: unknown) {
    console.error('Error fetching TMDB details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch TMDB details: ' + errorMessage }, { status: 500 });
  }
}
