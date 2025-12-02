import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

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

interface SeriesFile {
  pathname: string;
  uploadedAt: string;
  size: number;
  url: string;
}

interface SeriesWithTMDB extends SeriesFile {
  tmdbData?: any;
  extractedId?: string;
}

interface AdminStats {
  totalSeries: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalSize: number;
  avgRating: number;
}

// Extraire l'ID TMDB du nom de fichier
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

// Récupérer les informations TMDB pour une série
async function fetchTMDBData(tmdbId: string): Promise<any> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    if (!apiKey) {
      console.error('TMDB API key not found');
      return null;
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}&language=fr-FR`,
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

export async function GET(request: Request) {
  // Vérifier l'accès admin
  if (!checkAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Lister les fichiers dans le dossier series
    const { blobs: seriesBlobs } = await list({ prefix: "series/" });
    
    // Filtrer seulement les .json
    const seriesFiles: SeriesFile[] = seriesBlobs
      .filter(b => b.pathname.endsWith(".json"))
      .map(blob => ({
        pathname: blob.pathname,
        uploadedAt: blob.uploadedAt.toISOString(),
        size: blob.size,
        url: blob.url
      }));

    // Associer les données TMDB
    const seriesWithTMDB: SeriesWithTMDB[] = [];
    
    for (const seriesFile of seriesFiles) {
      const filename = seriesFile.pathname.split('/').pop() || '';
      const tmdbId = extractTMDBId(filename);
      
      const seriesWithTMDBData: SeriesWithTMDB = {
        ...seriesFile,
        extractedId: tmdbId || undefined
      };

      // Récupérer les données TMDB si on a un ID
      if (tmdbId) {
        const tmdbData = await fetchTMDBData(tmdbId);
        if (tmdbData) {
          seriesWithTMDBData.tmdbData = tmdbData;
        }
      }

      seriesWithTMDB.push(seriesWithTMDBData);
    }

    // Calculer les statistiques
    const stats: AdminStats = {
      totalSeries: seriesWithTMDB.length,
      totalViews: Math.floor(Math.random() * 8000), // Simulé - à remplacer avec vraies données
      totalLikes: Math.floor(Math.random() * 4000),  // Simulé - à remplacer avec vraies données
      totalComments: Math.floor(Math.random() * 800),  // Simulé - à remplacer avec vraies données
      totalSize: seriesWithTMDB.reduce((acc, series) => acc + series.size, 0),
      avgRating: seriesWithTMDB
        .filter(s => s.tmdbData?.vote_average)
        .reduce((acc, s, _, arr) => acc + (s.tmdbData?.vote_average || 0), 0) / 
        seriesWithTMDB.filter(s => s.tmdbData?.vote_average).length || 0
    };

    console.log(`Processed ${seriesWithTMDB.length} series with TMDB data`);
    
    return NextResponse.json({
      series: seriesWithTMDB,
      stats
    });
  } catch (error: unknown) {
    console.error('Error fetching admin series:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch series: ' + errorMessage }, { status: 500 });
  }
}
