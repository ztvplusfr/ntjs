import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { put, del } from "@vercel/blob";

// IP autorisées pour l'accès admin
const ADMIN_IPS = ['165.169.45.189'];

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
    
    // Récupérer le fichier JSON spécifique
    const { blobs } = await list({ prefix: `movies/${id}.json` });
    
    if (blobs.length === 0) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    const movieBlob = blobs[0];
    
    // Récupérer le contenu du fichier
    const response = await fetch(movieBlob.url);
    const movieData: MovieData = await response.json();

    // Extraire l'ID TMDB du nom de fichier
    const tmdbId = extractTMDBId(movieBlob.pathname);
    
    // Récupérer les informations TMDB
    let tmdbData = null;
    if (tmdbId) {
      tmdbData = await fetchTMDBData(tmdbId);
    }

    return NextResponse.json({
      id,
      pathname: movieBlob.pathname,
      uploadedAt: movieBlob.uploadedAt,
      size: movieBlob.size,
      url: movieBlob.url,
      movieData,
      tmdbData,
      extractedId: tmdbId
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

    // Créer le nouveau blob
    const blob = await put(`movies/${id}.json`, JSON.stringify(movieData, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
    });

    return NextResponse.json({
      success: true,
      pathname: blob.pathname,
      uploadedAt: new Date().toISOString(),
      size: JSON.stringify(movieData, null, 2).length,
      url: blob.url
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
    
    // Trouver et supprimer le blob
    const { blobs } = await list({ prefix: `movies/${id}.json` });
    
    if (blobs.length === 0) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    await del(blobs[0].url);

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
