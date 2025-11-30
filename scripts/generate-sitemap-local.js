const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const { Readable } = require('stream');
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabase = createClient(
  'https://tguacmowepoinizvzhnv.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
);

// URLs statiques de votre site
const staticPages = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/browse', changefreq: 'daily', priority: 0.9 },
  { url: '/search', changefreq: 'weekly', priority: 0.8 },
  { url: '/agenda', changefreq: 'daily', priority: 0.8 },
  { url: '/chat', changefreq: 'monthly', priority: 0.7 },
  { url: '/discord', changefreq: 'monthly', priority: 0.7 },
  { url: '/player', changefreq: 'weekly', priority: 0.6 },
  { url: '/settings', changefreq: 'monthly', priority: 0.5 },
  { url: '/welcome', changefreq: 'monthly', priority: 0.5 },
  { url: '/auth/signin', changefreq: 'monthly', priority: 0.4 },
  { url: '/auth/test', changefreq: 'monthly', priority: 0.4 },
  { url: '/auth/error', changefreq: 'monthly', priority: 0.4 },
  { url: '/auth/discord', changefreq: 'monthly', priority: 0.4 }
];

// URLs dynamiques depuis Supabase
async function generateDynamicPages() {
  const dynamicPages = [];
  
  try {
    // Récupérer les films depuis Supabase
    const { data: movies, error: moviesError } = await supabase
      .from('movies')
      .select('id, title, updated_at, created_at')
      .eq('visible', true)
      .order('created_at', { ascending: false });

    if (!moviesError && movies) {
      movies.forEach(movie => {
        const title = movie.title || '';
        const slug = title.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');
        
        dynamicPages.push({
          url: `/movies/${movie.id}-${slug || movie.id}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: movie.updated_at || movie.created_at || new Date().toISOString()
        });
        
        dynamicPages.push({
          url: `/watch/${movie.id}`,
          changefreq: 'weekly',
          priority: 0.7,
          lastmod: movie.updated_at || movie.created_at || new Date().toISOString()
        });
      });
      console.log(`✅ ${movies.length} films ajoutés au sitemap`);
    }

    // Récupérer les séries depuis Supabase
    const { data: series, error: seriesError } = await supabase
      .from('series')
      .select('id, name, updated_at, created_at')
      .eq('visible', true)
      .order('created_at', { ascending: false });

    if (!seriesError && series) {
      series.forEach(serie => {
        const name = serie.name || '';
        const slug = name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');
        
        dynamicPages.push({
          url: `/series/${serie.id}-${slug || serie.id}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: serie.updated_at || serie.created_at || new Date().toISOString()
        });
      });
      console.log(`✅ ${series.length} séries ajoutées au sitemap`);
    }

    // Ajouter quelques URLs d'exemples pour les épisodes populaires
    const { data: episodes } = await supabase
      .from('episodes')
      .select('tmdb_id, season_number, episode_number, updated_at')
      .limit(100);

    if (episodes) {
      const uniqueSeries = [...new Set(episodes.map(ep => ep.tmdb_id))];
      uniqueSeries.forEach(tmdbId => {
        const seriesEpisodes = episodes.filter(ep => ep.tmdb_id === tmdbId);
        const seasons = [...new Set(seriesEpisodes.map(ep => ep.season_number))];
        
        seasons.forEach(season => {
          const seasonEpisodes = seriesEpisodes.filter(ep => ep.season_number === season);
          const episodesInSeason = [...new Set(seasonEpisodes.map(ep => ep.episode_number))];
          
          episodesInSeason.slice(0, 5).forEach(episode => { // Limiter à 5 épisodes par saison
            dynamicPages.push({
              url: `/watch/series/${tmdbId}/${season}/${episode}`,
              changefreq: 'weekly',
              priority: 0.6,
              lastmod: new Date().toISOString()
            });
          });
        });
      });
      console.log(`✅ Pages d'épisodes ajoutées au sitemap`);
    }

  } catch (error) {
    console.error('Erreur lors de la génération des pages dynamiques:', error);
  }

  return dynamicPages;
}

async function generateSitemap() {
  try {
    console.log('🚀 Génération du sitemap...');
    
    const dynamicPages = await generateDynamicPages();
    const allPages = [...staticPages, ...dynamicPages];

    // Créer le stream sitemap
    const smStream = new SitemapStream({
      hostname: 'https://ztvplus.site',
      xmlns: {
        news: false,
        xhtml: false,
        image: false,
        video: false
      }
    });

    // Écrire les URLs dans le stream
    const links = allPages.map(page => ({
      url: page.url,
      changefreq: page.changefreq,
      priority: page.priority,
      lastmod: page.lastmod || new Date().toISOString()
    }));

    // Créer le stream et générer le sitemap
    const stream = Readable.from(links);
    stream.pipe(smStream);

    // Générer le sitemap XML
    const xml = await streamToPromise(smStream);
    
    // Écrire le fichier sitemap.xml
    const writeStream = createWriteStream('./public/sitemap.xml');
    writeStream.write(xml.toString());
    writeStream.end();

    console.log('✅ Sitemap généré avec succès!');
    console.log(`📄 ${allPages.length} URLs ajoutées au sitemap`);
    console.log('🌐 Disponible: https://ztvplus.site/sitemap.xml');
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du sitemap:', error);
  }
}

// Exécuter la génération
generateSitemap();
