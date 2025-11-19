/*
  # Create Flappy Box High Scores Table

  1. New Tables
    - `high_scores`
      - `id` (uuid, primary key)
      - `player_name` (text, player's name)
      - `score` (integer, game score)
      - `created_at` (timestamptz, timestamp of score)
  
  2. Security
    - Enable RLS on `high_scores` table
    - Add policy for anyone to view high scores
    - Add policy for anyone to insert their own scores
  
  3. Indexes
    - Add index on score for efficient leaderboard queries
*/

CREATE TABLE IF NOT EXISTS high_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL DEFAULT 'Anonymous',
  score integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view high scores"
  ON high_scores FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert high scores"
  ON high_scores FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);