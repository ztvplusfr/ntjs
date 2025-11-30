-- Table pour l'historique de visionnage
CREATE TABLE IF NOT EXISTS history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Informations utilisateur
  user_id TEXT NOT NULL, -- Discord user ID
  
  -- Contenu
  content_id TEXT NOT NULL, -- TMDB ID (movie ou series)
  content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'series')),
  
  -- Détails du contenu
  title TEXT NOT NULL,
  poster TEXT, -- URL du poster
  backdrop TEXT, -- URL du backdrop
  
  -- Pour les séries uniquement
  season INTEGER,
  episode INTEGER,
  episode_title TEXT,
  
  -- Informations vidéo
  video_id TEXT,
  video_has_ads BOOLEAN,
  video_lang TEXT,
  video_pub INTEGER,
  video_quality TEXT,
  video_server TEXT,
  video_url TEXT,
  video_server_index INTEGER,
  
  -- Progression
  progress_seconds INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Métadonnées (JSON pour flexibilité)
  metadata JSONB,
  
  -- Index pour optimisation
  CONSTRAINT history_user_content_unique UNIQUE (
    user_id, 
    content_id, 
    content_type, 
    season, 
    episode
  )
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_history_user_id ON history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_content_id ON history(content_id);
CREATE INDEX IF NOT EXISTS idx_history_content_type ON history(content_type);
CREATE INDEX IF NOT EXISTS idx_history_last_watched ON history(last_watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_user_last_watched ON history(user_id, last_watched_at DESC);

-- Index composite pour l'historique d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_history_user_content ON history(user_id, content_type, last_watched_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_watched_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_history_updated_at 
    BEFORE UPDATE ON history 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS (Row Level Security)
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs ne voient que leur propre historique
CREATE POLICY "Users can view their own history" ON history
    FOR SELECT USING (auth.uid()::text = user_id);

-- Politique pour que les utilisateurs puissent insérer leur propre historique
CREATE POLICY "Users can insert their own history" ON history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Politique pour que les utilisateurs puissent mettre à jour leur propre historique
CREATE POLICY "Users can update their own history" ON history
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Politique pour que les utilisateurs puissent supprimer leur propre historique
CREATE POLICY "Users can delete their own history" ON history
    FOR DELETE USING (auth.uid()::text = user_id);

-- Commentaires pour documentation
COMMENT ON TABLE history IS 'Historique de visionnage des utilisateurs';
COMMENT ON COLUMN history.user_id IS 'ID de l''utilisateur Discord';
COMMENT ON COLUMN history.content_id IS 'ID du contenu sur TMDB';
COMMENT ON COLUMN history.content_type IS 'Type de contenu: movie ou series';
COMMENT ON COLUMN history.title IS 'Titre du film ou de la série';
COMMENT ON COLUMN history.poster IS 'URL du poster TMDB';
COMMENT ON COLUMN history.backdrop IS 'URL du backdrop TMDB';
COMMENT ON COLUMN history.season IS 'Numéro de saison (pour les séries)';
COMMENT ON COLUMN history.episode IS 'Numéro d''épisode (pour les séries)';
COMMENT ON COLUMN history.episode_title IS 'Titre de l''épisode';
COMMENT ON COLUMN history.video_id IS 'ID de la vidéo';
COMMENT ON COLUMN history.progress_seconds IS 'Progression de visionnage en secondes';
COMMENT ON COLUMN history.duration_seconds IS 'Durée totale du contenu en secondes';
COMMENT ON COLUMN history.last_watched_at IS 'Dernière date de visionnage';
COMMENT ON COLUMN history.metadata IS 'Métadonnées additionnelles en JSON';
