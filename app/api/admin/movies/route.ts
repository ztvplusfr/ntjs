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

interface MovieFile {
  pathname: string;
  uploadedAt: string;
  size: number;
  url: string;
}

interface MovieWithTMDB extends MovieFile {
  tmdbData?: any;
  extractedId?: string;
}

interface AdminStats {
  totalMovies: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalSize: number;
  avgRating: number;
}

// Extraire l'ID TMDB du nom de fichier
function extractTMDBId(filename: string): string | null {
  // Patterns possibles : 123.json, tt123.json, movie-123.json, etc.
  const patterns = [
    /(\d+)\.json$/i,           // 123.json
    /tt(\d+)\.json$/i,         // tt123.json
    /movie-(\d+)\.json$/i,     // movie-123.json
    /film-(\d+)\.json$/i,      // film-123.json
  ];

  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// Récupérer les informations TMDB pour un film
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
        cache: 'force-cache', // Cache pour éviter trop de requêtes
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
    // Lister les fichiers dans le dossier movies
    const { blobs: movieBlobs } = await list({ prefix: "movies/" });
    
    // Filtrer seulement les .json
    const movieFiles: MovieFile[] = movieBlobs
      .filter(b => b.pathname.endsWith(".json"))
      .map(blob => ({
        pathname: blob.pathname,
        uploadedAt: blob.uploadedAt.toISOString(),
        size: blob.size,
        url: blob.url
      }));

    // Associer les données TMDB
    const moviesWithTMDB: MovieWithTMDB[] = [];
    
    for (const movieFile of movieFiles) {
      const filename = movieFile.pathname.split('/').pop() || '';
      const tmdbId = extractTMDBId(filename);
      
      const movieWithTMDB: MovieWithTMDB = {
        ...movieFile,
        extractedId: tmdbId || undefined
      };

      // Récupérer les données TMDB si on a un ID
      if (tmdbId) {
        const tmdbData = await fetchTMDBData(tmdbId);
        if (tmdbData) {
          movieWithTMDB.tmdbData = tmdbData;
        }
      }

      moviesWithTMDB.push(movieWithTMDB);
    }

    // Calculer les statistiques
    const stats: AdminStats = {
      totalMovies: moviesWithTMDB.length,
      totalViews: Math.floor(Math.random() * 10000), // Simulé - à remplacer avec vraies données
      totalLikes: Math.floor(Math.random() * 5000),  // Simulé - à remplacer avec vraies données
      totalComments: Math.floor(Math.random() * 1000), // Simulé - à remplacer avec vraies données
      totalSize: moviesWithTMDB.reduce((acc, movie) => acc + movie.size, 0),
      avgRating: moviesWithTMDB
        .filter(m => m.tmdbData?.vote_average)
        .reduce((acc, m, _, arr) => acc + (m.tmdbData?.vote_average || 0), 0) / 
        moviesWithTMDB.filter(m => m.tmdbData?.vote_average).length || 0
    };

    console.log(`Processed ${moviesWithTMDB.length} movies with TMDB data`);
    
    return NextResponse.json({
      movies: moviesWithTMDB,
      stats
    });
  } catch (error: unknown) {
    console.error('Error fetching admin movies:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch movies: ' + errorMessage }, { status: 500 });
  }
}
