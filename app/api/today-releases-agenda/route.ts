import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET() {
  try {
    // Récupérer les sorties du jour depuis la table series_releases
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    const { data: releasesData, error: releasesError } = await supabase
      .from('series_releases')
      .select('*')
      .eq('status', 'released')
      .gte('release_date', today)
      .lte('release_date', today)
      .order('release_time', { ascending: true });

    if (releasesError) {
      throw releasesError;
    }

    const releases = releasesData || [];

    if (releases.length === 0) {
      console.log("Aucune sortie trouvée pour aujourd'hui");
      return NextResponse.json([]);
    }

    // Récupérer les détails des séries pour chaque release
    const uniqueTmdbIds = [...new Set(releases.map((r: any) => r.tmdb_id))];
    
    if (uniqueTmdbIds.length > 0) {
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'your_api_key_here';
      
      const seriesPromises = uniqueTmdbIds.map(async (tmdbId: number) => {
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}&language=fr-FR`
          );
          
          if (response.ok) {
            const seriesData = await response.json();
            return { tmdbId, data: seriesData };
          }
        } catch (error) {
          console.error(`Error fetching series ${tmdbId}:`, error);
        }
        return null;
      });

      const seriesResults = await Promise.all(seriesPromises);
      const seriesMap = new Map();
      
      seriesResults.forEach((result) => {
        if (result) {
          seriesMap.set(result.tmdbId, result.data);
        }
      });

      // Combiner les releases avec les détails des séries
      const releasesWithDetails = releases.map((release: any) => {
        const seriesDetails = seriesMap.get(release.tmdb_id);
        
        return {
          id: release.id,
          tmdb_id: release.tmdb_id,
          release_date: release.release_date,
          release_time: release.release_time,
          episode_number: release.episode_number,
          season_number: release.season_number,
          episode_range: release.episode_range,
          episode_title: release.episode_title,
          series_name: release.series_name,
          series_details: seriesDetails ? {
            id: seriesDetails.id,
            name: seriesDetails.name,
            poster_path: seriesDetails.poster_path,
            overview: seriesDetails.overview,
            first_air_date: seriesDetails.first_air_date,
            number_of_seasons: seriesDetails.number_of_seasons,
            genres: seriesDetails.genres || []
          } : null
        };
      });

      return NextResponse.json(releasesWithDetails);
    }

    return NextResponse.json(releases);
  } catch (error: any) {
    console.error('Error in today-releases-agenda API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
