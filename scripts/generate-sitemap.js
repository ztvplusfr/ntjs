const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const { Readable } = require('stream');

// URLs statiques de votre site
const staticPages = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/browse', changefreq: 'daily', priority: 0.9 },
  { url: '/search', changefreq: 'weekly', priority: 0.8 },
  { url: '/agenda', changefreq: 'daily', priority: 0.8 },
  { url: '/discord', changefreq: 'monthly', priority: 0.7 },
  { url: '/settings', changefreq: 'monthly', priority: 0.5 },
  { url: '/welcome', changefreq: 'monthly', priority: 0.5 },
  { url: '/auth/signin', changefreq: 'monthly', priority: 0.4 },
  { url: '/auth/discord', changefreq: 'monthly', priority: 0.4 }
];

// URLs dynamiques (à générer depuis votre API)
async function generateDynamicPages() {
  const dynamicPages = [];
  
  try {
    // Récupérer les films depuis votre API
    const moviesResponse = await fetch('https://ztvplus.fr/api/movies');
    if (moviesResponse.ok) {
      const movies = await moviesResponse.json();
      movies.forEach(movie => {
        dynamicPages.push({
          url: `/movies/${movie.id}-${movie.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: movie.updated_at || new Date().toISOString()
        });
        dynamicPages.push({
          url: `/watch/${movie.id}`,
          changefreq: 'weekly',
          priority: 0.7,
          lastmod: movie.updated_at || new Date().toISOString()
        });
      });
    }

    // Récupérer les séries depuis votre API
    const seriesResponse = await fetch('https://ztvplus.fr/api/series');
    if (seriesResponse.ok) {
      const series = await seriesResponse.json();
      series.forEach(serie => {
        dynamicPages.push({
          url: `/series/${serie.id}-${serie.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: serie.updated_at || new Date().toISOString()
        });
      });
    }
  } catch (error) {
    console.error('Erreur lors de la génération des pages dynamiques:', error);
  }

  return dynamicPages;
}

async function generateSitemap() {
  try {
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
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du sitemap:', error);
  }
}

// Exécuter la génération
generateSitemap();
