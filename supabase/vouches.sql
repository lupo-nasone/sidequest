-- ============================================================
-- VOUCHES (experience authentication by peers)
-- ============================================================
CREATE TABLE vouches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sidequest_id UUID REFERENCES sidequests(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sidequest_id)
);

ALTER TABLE vouches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vouches_select" ON vouches FOR SELECT USING (TRUE);
CREATE POLICY "vouches_insert" ON vouches FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  -- Can't vouch your own sidequest
  NOT EXISTS (SELECT 1 FROM sidequests s WHERE s.id = sidequest_id AND s.user_id = auth.uid())
);
CREATE POLICY "vouches_delete" ON vouches FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_vouches_sidequest ON vouches(sidequest_id);
CREATE INDEX idx_vouches_user ON vouches(user_id);
