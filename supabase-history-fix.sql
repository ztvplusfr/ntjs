-- Désactiver RLS temporairement pour tester
ALTER TABLE history DISABLE ROW LEVEL SECURITY;

-- Créer une politique plus simple qui fonctionne avec NextAuth
-- Au lieu d'utiliser auth.uid() (Supabase auth), on utilisera une approche différente

-- Option 1: Pas de RLS pour le moment (test)
-- Les utilisateurs peuvent insérer leur propre historique via l'API qui vérifie déjà l'authentification

-- Option 2: Politique basée sur le user_id directement (pas besoin de auth.uid)
-- CREATE POLICY "Users can view their own history" ON history
--     FOR SELECT USING (true); -- L'API filtre déjà par user_id

-- CREATE POLICY "Users can insert their own history" ON history
--     FOR INSERT WITH CHECK (true); -- L'API vérifie déjà l'authentification

-- CREATE POLICY "Users can update their own history" ON history
--     FOR UPDATE USING (true); -- L'API filtre déjà par user_id

-- CREATE POLICY "Users can delete their own history" ON history
--     FOR DELETE USING (true); -- L'API filtre déjà par user_id

-- Pour l'instant, gardons RLS désactivé pour tester
-- On pourra le réactiver plus tard avec des politiques appropriées
