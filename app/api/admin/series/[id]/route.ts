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

interface Episode {
  videos: Video[];
}

interface Season {
  episodes: Record<string, Episode>;
}

interface SeriesData {
  season: Record<string, Season>;
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
    const { blobs } = await list({ prefix: `series/${id}.json` });
    
    if (blobs.length === 0) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    const seriesBlob = blobs[0];
    
    // Récupérer le contenu du fichier
    const response = await fetch(seriesBlob.url);
    const seriesData: SeriesData = await response.json();

    // Extraire l'ID TMDB du nom de fichier
    const tmdbId = extractTMDBId(seriesBlob.pathname);
    
    // Récupérer les informations TMDB
    let tmdbData = null;
    if (tmdbId) {
      tmdbData = await fetchTMDBData(tmdbId);
    }

    return NextResponse.json({
      id,
      pathname: seriesBlob.pathname,
      uploadedAt: seriesBlob.uploadedAt,
      size: seriesBlob.size,
      url: seriesBlob.url,
      seriesData,
      tmdbData,
      extractedId: tmdbId
    });
  } catch (error: unknown) {
    console.error('Error fetching series:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch series: ' + errorMessage }, { status: 500 });
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
    console.log('PUT request for series ID:', id);
    
    const seriesData: SeriesData = await request.json();
    console.log('Received series data:', JSON.stringify(seriesData, null, 2));

    // Valider les données
    if (!seriesData.season || typeof seriesData.season !== 'object') {
      console.error('Invalid series data structure - missing season object');
      return NextResponse.json({ error: 'Invalid series data structure' }, { status: 400 });
    }

    console.log('Season data is valid, checking seasons and episodes...');

    // Valider chaque saison et épisode
    for (const [seasonNumber, season] of Object.entries(seriesData.season)) {
      console.log(`Validating season ${seasonNumber}`);
      
      if (!season.episodes || typeof season.episodes !== 'object') {
        console.error(`Invalid episodes in season ${seasonNumber}`);
        return NextResponse.json({ error: `Invalid episodes in season ${seasonNumber}` }, { status: 400 });
      }

      for (const [episodeNumber, episode] of Object.entries(season.episodes)) {
        console.log(`Validating season ${seasonNumber} episode ${episodeNumber}`);
        
        if (!episode.videos || !Array.isArray(episode.videos)) {
          console.error(`Invalid videos in season ${seasonNumber} episode ${episodeNumber}`);
          return NextResponse.json({ error: `Invalid videos in season ${seasonNumber} episode ${episodeNumber}` }, { status: 400 });
        }

        // Valider chaque vidéo
        for (const video of episode.videos) {
          if (!video.name || !video.url || !video.lang || !video.quality) {
            console.error('All video fields are required:', video);
            return NextResponse.json({ error: 'All video fields are required' }, { status: 400 });
          }
          
          // Valider que pub et play sont des nombres 0 ou 1, avec valeurs par défaut
          const pubValue = typeof video.pub === 'number' ? video.pub : 0;
          const playValue = typeof video.play === 'number' ? video.play : 1;
          
          if (pubValue !== 0 && pubValue !== 1) {
            console.error('pub must be 0 or 1:', pubValue);
            return NextResponse.json({ error: 'pub must be 0 or 1' }, { status: 400 });
          }
          if (playValue !== 0 && playValue !== 1) {
            console.error('play must be 0 or 1:', playValue);
            return NextResponse.json({ error: 'play must be 0 or 1' }, { status: 400 });
          }
          
          // Mettre à jour les valeurs si elles étaient manquantes
          video.pub = pubValue;
          video.play = playValue;
        }
      }
    }

    console.log('All validations passed, creating blob...');

    // Créer le nouveau blob
    const blob = await put(`series/${id}.json`, JSON.stringify(seriesData, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
    });

    console.log('Blob created successfully:', blob);

    return NextResponse.json({
      success: true,
      pathname: blob.pathname,
      uploadedAt: new Date().toISOString(),
      size: JSON.stringify(seriesData, null, 2).length,
      url: blob.url
    });
  } catch (error: unknown) {
    console.error('Error updating series:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error message:', errorMessage);
    return NextResponse.json({ error: 'Failed to update series: ' + errorMessage }, { status: 500 });
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
    const { blobs } = await list({ prefix: `series/${id}.json` });
    
    if (blobs.length === 0) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    await del(blobs[0].url);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting series:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to delete series: ' + errorMessage }, { status: 500 });
  }
}

// Fonctions utilitaires
function extractTMDBId(filename: string): string | null {
  const patterns = [
    /(\d+)\.json$/i,
    /tt(\d+)\.json$/i,
    /series-(\d+)\.json$/i,
    /show-(\d+)\.json$/i,
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
      `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}&language=fr-FR`,
      { cache: 'force-cache' }
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
