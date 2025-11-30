-- Table pour les sorties de séries (simplifiée)
CREATE TABLE series_releases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tmdb_id INTEGER NOT NULL,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  episode_title TEXT,
  release_date DATE NOT NULL,
  release_time TIME,
  status TEXT DEFAULT 'upcoming' -- upcoming, released, delayed
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_series_releases_date ON series_releases(release_date);
CREATE INDEX idx_series_releases_tmdb ON series_releases(tmdb_id);

-- Politiques RLS (Row Level Security)
ALTER TABLE series_releases ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre les lectures publiques
CREATE POLICY "Public read access for series releases" ON series_releases
  FOR SELECT USING (true);

-- Politique pour permettre les insertions (si vous avez une authentification)
CREATE POLICY "Allow insertions for authenticated users" ON series_releases
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politique pour permettre les mises à jour (si vous avez une authentification)
CREATE POLICY "Allow updates for authenticated users" ON series_releases
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Politique pour permettre les suppressions (si vous avez une authentification)
CREATE POLICY "Allow deletions for authenticated users" ON series_releases
  FOR DELETE USING (auth.role() = 'authenticated');

-- Quelques exemples de données (optionnel)
INSERT INTO series_releases (tmdb_id, season_number, episode_number, episode_title, release_date, release_time, status) VALUES
(84958, 2, 6, 'Episodio 6', '2023-11-09', '21:00', 'upcoming'),
(94605, 3, 8, 'The Spies', '2023-11-15', '20:00', 'upcoming'),
(1402, 5, 14, 'Ozymandias', '2023-11-20', '22:00', 'upcoming');
