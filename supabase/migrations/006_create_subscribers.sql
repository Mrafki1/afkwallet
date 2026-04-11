-- Email subscriber list for deal alerts and newsletter
CREATE TABLE IF NOT EXISTS subscribers (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email       text        UNIQUE NOT NULL,
  source      text        DEFAULT 'homepage',   -- homepage | blog | deals | compare
  created_at  timestamptz DEFAULT now()
);

-- Index for quick duplicate checks
CREATE INDEX IF NOT EXISTS subscribers_email_idx ON subscribers (email);

-- Allow public inserts (the API route handles validation)
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON subscribers FOR INSERT
  TO public
  WITH CHECK (true);

-- Only service role can read the list
CREATE POLICY "Service role reads subscribers"
  ON subscribers FOR SELECT
  TO service_role
  USING (true);
