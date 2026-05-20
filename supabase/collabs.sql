-- ============================================================
-- SIDEQUEST COLLABORATORS
-- ============================================================
CREATE TABLE sidequest_collabs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sidequest_id UUID REFERENCES sidequests(id) ON DELETE CASCADE NOT NULL,
  invited_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(sidequest_id, invited_user_id)
);

ALTER TABLE sidequest_collabs ENABLE ROW LEVEL SECURITY;

-- Owner of the sidequest can see all collabs on their posts
-- Invited user can see their own invites
CREATE POLICY "collabs_select" ON sidequest_collabs FOR SELECT
  USING (
    auth.uid() = invited_user_id OR
    EXISTS (SELECT 1 FROM sidequests s WHERE s.id = sidequest_id AND s.user_id = auth.uid())
  );

-- Only sidequest owner can invite
CREATE POLICY "collabs_insert" ON sidequest_collabs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sidequests s WHERE s.id = sidequest_id AND s.user_id = auth.uid()));

-- Invited user can update (accept/decline)
CREATE POLICY "collabs_update" ON sidequest_collabs FOR UPDATE
  USING (auth.uid() = invited_user_id);

-- Owner can delete
CREATE POLICY "collabs_delete" ON sidequest_collabs FOR DELETE
  USING (EXISTS (SELECT 1 FROM sidequests s WHERE s.id = sidequest_id AND s.user_id = auth.uid()));

CREATE INDEX idx_collabs_sidequest ON sidequest_collabs(sidequest_id);
CREATE INDEX idx_collabs_invited ON sidequest_collabs(invited_user_id);
