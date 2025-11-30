const { execSync } = require('child_process');

console.log('🔄 Génération du sitemap après le build...');

try {
  // Exécuter le script de génération de sitemap
  execSync('node scripts/generate-sitemap-local.js', { stdio: 'inherit' });
  console.log('✅ Sitemap mis à jour avec succès!');
} catch (error) {
  console.error('❌ Erreur lors de la mise à jour du sitemap:', error.message);
}
