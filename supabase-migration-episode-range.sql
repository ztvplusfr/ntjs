-- Migration pour ajouter le support des plages d'épisodes
-- Ajout d'une colonne episode_range pour stocker des plages comme "1-6"

-- Ajouter la colonne episode_range
ALTER TABLE series_releases 
ADD COLUMN episode_range TEXT;

-- Ajouter la colonne series_name si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='series_releases' AND column_name='series_name') THEN
        ALTER TABLE series_releases ADD COLUMN series_name TEXT;
    END IF;
END $$;

-- Mettre à jour les données existantes pour utiliser episode_range
UPDATE series_releases 
SET episode_range = episode_number::TEXT 
WHERE episode_range IS NULL;

-- Créer un index pour optimiser les requêtes sur episode_range
CREATE INDEX idx_series_releases_episode_range ON series_releases(episode_range);

-- Mettre à jour quelques exemples pour utiliser des plages
UPDATE series_releases 
SET episode_range = '1-6', episode_number = 1
WHERE tmdb_id = 84958 AND season_number = 2;

-- Ajouter des exemples de plages d'épisodes
INSERT INTO series_releases (tmdb_id, season_number, episode_number, episode_range, episode_title, series_name, release_date, release_time, status) VALUES
(84958, 2, 1, '1-6', 'Episodes 1-6', 'Loki', '2023-11-09', '21:00', 'upcoming'),
(94605, 3, 8, '8', 'The Spies', 'Loki', '2023-11-15', '20:00', 'upcoming'),
(1402, 5, 14, '14', 'Ozymandias', 'Breaking Bad', '2023-11-20', '22:00', 'upcoming');

-- Commentaire sur les nouvelles colonnes
COMMENT ON COLUMN series_releases.episode_range IS 'Range of episodes (e.g., "1-6", "8", "10-15")';
COMMENT ON COLUMN series_releases.series_name IS 'Name of the series';
