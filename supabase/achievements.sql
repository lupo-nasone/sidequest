-- ============================================================
-- ACHIEVEMENTS
-- ============================================================
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_bonus INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'general'
);

CREATE TABLE user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT REFERENCES achievements(id) NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ua_select" ON user_achievements FOR SELECT USING (TRUE);
CREATE POLICY "ua_insert" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- Seed achievements
INSERT INTO achievements (id, name, description, icon, xp_bonus, category) VALUES
  ('first_quest',     'Prima Sidequest',       'Hai pubblicato la tua prima avventura.',            '⚔️',  50,  'quests'),
  ('five_quests',     'Avventuriero',           'Hai pubblicato 5 sidequest.',                       '🗺️',  100, 'quests'),
  ('ten_quests',      'Esploratore Seriale',    'Hai pubblicato 10 sidequest.',                      '🧭',  200, 'quests'),
  ('twenty_quests',   'Leggenda Vivente',       'Hai pubblicato 20 sidequest.',                      '🏆',  500, 'quests'),
  ('with_photo',      'Fotografo di Avventure', 'Hai pubblicato una sidequest con foto come prova.', '📸',  30,  'quests'),
  ('night_owl',       'Nottambulo',             'Una sidequest è iniziata dopo mezzanotte.',         '🦉',  75,  'quests'),
  ('explorer',        'Localizzatore',          'Hai aggiunto un luogo a una sidequest.',            '📍',  25,  'quests'),
  ('storyteller',     'Narratore Epico',        'Hai scritto una descrizione di oltre 200 caratteri.','📖', 40,  'quests'),
  ('epic_rating',     'Follia Certificata',     'Hai ottenuto un rating AI di 9 o più.',             '🔥',  150, 'quests'),
  ('xp_100',          'Primo Sangue',           'Hai raggiunto 100 XP totali.',                      '💫',  0,   'xp'),
  ('xp_500',          'Guerriero',              'Hai raggiunto 500 XP totali.',                      '⚡',  0,   'xp'),
  ('xp_1000',         'Eroe',                   'Hai raggiunto 1000 XP totali.',                     '👑',  0,   'xp'),
  ('xp_5000',         'Semidio',                'Hai raggiunto 5000 XP totali.',                     '🌟',  0,   'xp'),
  ('single_500xp',    'Una Botta Sola',         'Hai guadagnato 500+ XP con una singola sidequest.', '💥',  100, 'quests'),
  ('first_friend',    'Non Sei Solo',           'Hai aggiunto il tuo primo amico.',                  '🤝',  50,  'social'),
  ('five_friends',    'Social Butterfly',       'Hai 5 amici.',                                      '🦋',  100, 'social'),
  ('first_like',      'Ti Vogliono Bene',       'La tua sidequest ha ricevuto il primo like.',       '❤️',  25,  'social');
