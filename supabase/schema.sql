-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SIDEQUESTS
-- ============================================================
CREATE TABLE sidequests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  happened_at TIMESTAMPTZ NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  ai_analysis TEXT,
  ai_rating NUMERIC(3,1),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SIDEQUEST MEDIA
-- ============================================================
CREATE TABLE sidequest_media (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sidequest_id UUID REFERENCES sidequests(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  ai_description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FRIENDSHIPS
-- ============================================================
CREATE TABLE friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  addressee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- ============================================================
-- LIKES
-- ============================================================
CREATE TABLE likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sidequest_id UUID REFERENCES sidequests(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sidequest_id)
);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sidequest_id UUID REFERENCES sidequests(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- XP UPDATE FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_user_xp(p_user_id UUID, p_xp_delta INTEGER)
RETURNS VOID AS $$
DECLARE
  new_total INTEGER;
  new_level INTEGER;
BEGIN
  UPDATE profiles
  SET total_xp = total_xp + p_xp_delta,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING total_xp INTO new_total;

  -- Level = 1 + floor(sqrt(total_xp / 100))
  new_level := 1 + FLOOR(SQRT(new_total::FLOAT / 100))::INTEGER;

  UPDATE profiles SET level = new_level WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_sidequests_user_id ON sidequests(user_id);
CREATE INDEX idx_sidequests_happened_at ON sidequests(happened_at DESC);
CREATE INDEX idx_sidequests_created_at ON sidequests(created_at DESC);
CREATE INDEX idx_sidequest_media_sidequest_id ON sidequest_media(sidequest_id);
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_likes_sidequest_id ON likes(sidequest_id);
CREATE INDEX idx_comments_sidequest_id ON comments(sidequest_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sidequests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sidequest_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Sidequests: published visible to all, own always visible
CREATE POLICY "sidequests_select" ON sidequests FOR SELECT
  USING (is_published = TRUE OR auth.uid() = user_id);
CREATE POLICY "sidequests_insert" ON sidequests FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sidequests_update" ON sidequests FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "sidequests_delete" ON sidequests FOR DELETE
  USING (auth.uid() = user_id);

-- Media: same as sidequest owner
CREATE POLICY "media_select" ON sidequest_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sidequests s
    WHERE s.id = sidequest_id AND (s.is_published OR s.user_id = auth.uid())
  ));
CREATE POLICY "media_insert" ON sidequest_media FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM sidequests s WHERE s.id = sidequest_id AND s.user_id = auth.uid()
  ));
CREATE POLICY "media_delete" ON sidequest_media FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM sidequests s WHERE s.id = sidequest_id AND s.user_id = auth.uid()
  ));

-- Friendships
CREATE POLICY "friendships_select" ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "friendships_insert" ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "friendships_update" ON friendships FOR UPDATE
  USING (auth.uid() = addressee_id);

-- Likes
CREATE POLICY "likes_select" ON likes FOR SELECT USING (TRUE);
CREATE POLICY "likes_insert" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "comments_select" ON comments FOR SELECT USING (TRUE);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS (run in Supabase dashboard > Storage)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('sidequest-media', 'sidequest-media', TRUE);
-- CREATE POLICY "media_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'sidequest-media' AND auth.role() = 'authenticated');
-- CREATE POLICY "media_read" ON storage.objects FOR SELECT USING (bucket_id = 'sidequest-media');
-- CREATE POLICY "media_delete" ON storage.objects FOR DELETE USING (bucket_id = 'sidequest-media' AND auth.uid()::text = (storage.foldername(name))[1]);
