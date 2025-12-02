import { NextResponse } from "next/server";
import { getMovieVideos, updateMovieVideos } from "@/lib/supabase";

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

interface Video {
  name: string;
  url: string;
  lang: string;
  quality: string;
  pub: number;
  play: number;
}

interface MovieData {
  videos: Video[];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Vérifier l'accès admin
  if (!checkAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const tmdbId = parseInt(id);

    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 });
    }

    // Récupérer les vidéos du film depuis Supabase
    const videos = await getMovieVideos(tmdbId);

    if (!videos) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    // Convertir les vidéos au format attendu par le frontend
    const movieData: MovieData = {
      videos: videos.map(video => ({
        name: video.name || '',
        url: video.url,
        lang: video.lang,
        quality: video.quality,
        pub: video.pub,
        play: video.play
      }))
    };

    // Récupérer les informations TMDB
    const tmdbData = await fetchTMDBData(tmdbId.toString());

    return NextResponse.json({
      id: id.toString(),
      pathname: `movies/${id}.json`,
      uploadedAt: new Date().toISOString(),
      size: JSON.stringify(movieData).length,
      url: `https://supabase-storage-url/movies/${id}.json`,
      movieData,
      tmdbData,
      extractedId: tmdbId.toString()
    });
  } catch (error: unknown) {
    console.error('Error fetching movie:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch movie: ' + errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Vérifier l'accès admin
  if (!checkAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const movieData: MovieData = await request.json();
    const tmdbId = parseInt(id);

    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 });
    }

    // Valider les données
    if (!movieData.videos || !Array.isArray(movieData.videos)) {
      return NextResponse.json({ error: 'Invalid video data' }, { status: 400 });
    }

    // Valider chaque vidéo
    for (const video of movieData.videos) {
      if (!video.name || !video.url || !video.lang || !video.quality) {
        return NextResponse.json({ error: 'All video fields are required' }, { status: 400 });
      }
      // Valider que pub et play sont des nombres 0 ou 1
      if (typeof video.pub !== 'number' || (video.pub !== 0 && video.pub !== 1)) {
        return NextResponse.json({ error: 'pub must be 0 or 1' }, { status: 400 });
      }
      if (typeof video.play !== 'number' || (video.play !== 0 && video.play !== 1)) {
        return NextResponse.json({ error: 'play must be 0 or 1' }, { status: 400 });
      }
    }

    // Mettre à jour les vidéos dans Supabase
    const success = await updateMovieVideos(tmdbId, movieData.videos);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update movie videos' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      pathname: `movies/${id}.json`,
      uploadedAt: new Date().toISOString(),
      size: JSON.stringify(movieData).length,
      url: `https://supabase-storage-url/movies/${id}.json`
    });
  } catch (error: unknown) {
    console.error('Error updating movie:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update movie: ' + errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Vérifier l'accès admin
  if (!checkAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const tmdbId = parseInt(id);

    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 });
    }

    // Supprimer toutes les vidéos du film depuis Supabase
    const success = await updateMovieVideos(tmdbId, []);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete movie videos' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting movie:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to delete movie: ' + errorMessage }, { status: 500 });
  }
}

// Fonctions utilitaires
function extractTMDBId(filename: string): string | null {
  const patterns = [
    /(\d+)\.json$/i,
    /tt(\d+)\.json$/i,
    /movie-(\d+)\.json$/i,
    /film-(\d+)\.json$/i,
  ];

  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

async function fetchTMDBData(tmdbId: string): Promise<any> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!apiKey) {
      console.error('TMDB API key not found');
      return null;
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=fr-FR`,
      { 
        cache: 'force-cache',
        signal: AbortSignal.timeout(10000) // 10 seconds timeout
      }
    );

    if (!response.ok) {
      console.error(`TMDB API error for ID ${tmdbId}:`, response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching TMDB data for ID ${tmdbId}:`, error);
    return null;
  }
}
