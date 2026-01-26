-- Canonical Record Schema for Sonia-Fred Execution Loop
-- Single source of truth for agent state
-- No direct agent communication - all state lives here

CREATE TABLE IF NOT EXISTS canonical_records (
  -- Core identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source tracking
  source TEXT NOT NULL CHECK (source IN ('sonia', 'human', 'webhook')),
  
  -- State management
  status TEXT NOT NULL CHECK (status IN ('new', 'cleaned', 'executed', 'failed', 'review')),
  
  -- Payload data
  payload JSONB NOT NULL,
  normalized_payload JSONB,
  
  -- Decision tracking
  verdict TEXT CHECK (verdict IN ('SAFE', 'REVIEW', 'FAIL')),
  next_action TEXT,
  
  -- Actor tracking
  last_actor TEXT NOT NULL CHECK (last_actor IN ('sonia', 'fred')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for Fred's polling queries
CREATE INDEX idx_cr_status_actor ON canonical_records(status, last_actor);

-- Index for timestamp-based queries
CREATE INDEX idx_cr_created_at ON canonical_records(created_at DESC);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_canonical_records_updated_at
  BEFORE UPDATE ON canonical_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enforcement: No status transitions without last_actor update
-- This is enforced at application level in agents

COMMENT ON TABLE canonical_records IS 'Canonical Record system for Sonia-Fred execution loop. Single source of truth for all agent state.';
COMMENT ON COLUMN canonical_records.source IS 'Origin of the record: sonia (agent scan), human (manual), webhook (external trigger)';
COMMENT ON COLUMN canonical_records.status IS 'Current state: new (raw), cleaned (normalized), executed (done), failed (error), review (needs human)';
COMMENT ON COLUMN canonical_records.payload IS 'Raw input data from source';
COMMENT ON COLUMN canonical_records.normalized_payload IS 'Structured, validated data ready for execution (set by Sonia)';
COMMENT ON COLUMN canonical_records.verdict IS 'Fred decision: SAFE (execute), REVIEW (hold), FAIL (stop)';
COMMENT ON COLUMN canonical_records.next_action IS 'Optional field for Fred to specify what should happen next';
COMMENT ON COLUMN canonical_records.last_actor IS 'Which agent last touched this record (enforces ownership)';
