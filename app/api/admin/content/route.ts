import { NextResponse } from "next/server";
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { updateMovieVideos } from "@/lib/supabase";

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

export async function POST(request: Request) {
  // Vérifier l'accès admin
  if (!checkAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contentData = await request.json();

    // Validation des données requises
    const requiredFields = ['tmdb_id', 'type', 'overview', 'poster_path', 'backdrop_path', 'vote_average', 'vote_count', 'popularity', 'adult', 'original_language', 'genres'];
    for (const field of requiredFields) {
      if (!(field in contentData)) {
        return NextResponse.json({ error: `Field '${field}' is required` }, { status: 400 });
      }
    }

    if (!['movie', 'tv'].includes(contentData.type)) {
      return NextResponse.json({ error: 'Type must be either "movie" or "tv"' }, { status: 400 });
    }

    const tmdbId = contentData.tmdb_id;
    const contentType = contentData.type;

    // Déterminer le dossier et le nom de fichier
    const folder = contentType === 'movie' ? 'movies' : 'series';
    const fileName = `${tmdbId}.json`;
    const filePath = join(process.cwd(), 'public', folder, fileName);

    // Créer le dossier s'il n'existe pas
    const folderPath = join(process.cwd(), 'public', folder);
    if (!existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true });
    }

    // Vérifier si le fichier existe déjà
    if (existsSync(filePath)) {
      return NextResponse.json({ error: 'Content already exists' }, { status: 409 });
    }

    // Créer les données du fichier JSON
    const fileData = {
      videos: [] // Structure vide pour les vidéos
    };

    // Sauvegarder le fichier JSON
    await writeFile(filePath, JSON.stringify(fileData, null, 2));

    // Initialiser les vidéos dans Supabase (vide pour commencer)
    if (contentType === 'movie') {
      await updateMovieVideos(tmdbId, []);
    } else {
      // Pour les séries, on pourrait initialiser les vidéos de séries ici
      // Mais pour l'instant, on garde vide
    }

    // Retourner les informations du contenu créé
    return NextResponse.json({
      id: tmdbId.toString(),
      pathname: `${folder}/${fileName}`,
      uploadedAt: new Date().toISOString(),
      size: JSON.stringify(fileData).length,
      url: `/${folder}/${fileName}`,
      tmdbData: contentData,
      extractedId: tmdbId.toString()
    });

  } catch (error: unknown) {
    console.error('Error creating content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create content: ' + errorMessage }, { status: 500 });
  }
}
