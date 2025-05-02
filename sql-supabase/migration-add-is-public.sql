-- Add is_public field to profiles table with default value of true
ALTER TABLE profiles 
ADD COLUMN is_public BOOLEAN DEFAULT true;

-- Create index for better performance when filtering by is_public
CREATE INDEX idx_profiles_is_public ON profiles(is_public);

-- Comment on the column to explain its purpose
COMMENT ON COLUMN profiles.is_public IS 'Controls whether the profile appears in the discovery page';