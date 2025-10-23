-- Create admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  SELECT COALESCE(up.is_admin, FALSE) INTO is_admin_user
  FROM user_profiles up
  WHERE up.id = auth.uid();
  
  RETURN is_admin_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view their own profile"
ON user_profiles 
FOR SELECT
USING (auth.uid() = id);

-- Users can update only specific fields in their own profile
CREATE POLICY "Users can update their own profile"
ON user_profiles 
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND is_admin IS NOT DISTINCT FROM FALSE);

-- Only admins can change the is_admin field
CREATE POLICY "Only admins can change admin status"
ON user_profiles 
FOR UPDATE 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON user_profiles 
FOR SELECT
USING (is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON user_profiles 
FOR UPDATE
USING (is_admin());

-- Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON requests
FOR SELECT
USING (is_admin());

-- Admins can insert requests (if needed)
CREATE POLICY "Admins can insert requests"
ON requests
FOR INSERT
WITH CHECK (is_admin());

-- Deny delete policies
CREATE POLICY "Deny delete for user_profiles" ON user_profiles FOR DELETE USING (false);
CREATE POLICY "Deny delete for requests" ON requests FOR DELETE USING (false);