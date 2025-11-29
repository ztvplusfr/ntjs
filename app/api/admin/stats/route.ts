import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export async function GET() {
  try {
    // Lister les fichiers dans les dossiers blob
    const { blobs: movieBlobs } = await list({ prefix: "movies/" });
    const { blobs: seriesBlobs } = await list({ prefix: "series/" });

    // Filtrer seulement les .json
    const movieFiles = movieBlobs.filter(b => b.pathname.endsWith(".json"));
    const seriesFiles = seriesBlobs.filter(b => b.pathname.endsWith(".json"));

    const stats = {
      moviesCount: movieFiles.length,
      seriesCount: seriesFiles.length,
      totalFiles: movieFiles.length + seriesFiles.length,
      moviesFiles: movieFiles.map(b => b.pathname),
      seriesFiles: seriesFiles.map(b => b.pathname),
      lastUpdated: new Date().toISOString()
    };

    console.log('Movies files found:', movieFiles.map(b => b.pathname));
    console.log('Series files found:', seriesFiles.map(b => b.pathname));
    console.log('Stats calculated:', stats);

    return NextResponse.json(stats);
  } catch (error: unknown) {
    console.error('Error fetching admin stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch stats: ' + errorMessage }, { status: 500 });
  }
}
