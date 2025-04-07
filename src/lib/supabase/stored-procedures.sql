-- Function to temporarily disable RLS for the current transaction
CREATE OR REPLACE FUNCTION disable_rls_for_transaction()
RETURNS void AS $$
BEGIN
  -- Check if the user has the necessary permissions
  IF (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    -- Temporarily disable RLS for this transaction
    SET LOCAL row_security = off;
  ELSE
    RAISE EXCEPTION 'Permission denied: Only superusers can disable RLS';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION disable_rls_for_transaction() IS 'Temporarily disables row-level security for the current transaction. Only callable by service role or superusers.';

-- Function to check if a users record exists by clerk_id
CREATE OR REPLACE FUNCTION check_user_exists(clerk_id_param TEXT)
RETURNS TABLE (
  exists_flag BOOLEAN,
  user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM users WHERE clerk_id = clerk_id_param) as exists_flag,
    CASE 
      WHEN EXISTS(SELECT 1 FROM users WHERE clerk_id = clerk_id_param)
      THEN (SELECT id FROM users WHERE clerk_id = clerk_id_param)
      ELSE NULL::UUID
    END as user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION check_user_exists(TEXT) IS 'Checks if a user exists by clerk_id and returns the user_id if found.';

-- Function to safely create a user if it doesn't exist
CREATE OR REPLACE FUNCTION create_user_if_not_exists(
  clerk_id_param TEXT,
  email_param TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  clerk_id TEXT,
  is_new BOOLEAN
) AS $$
DECLARE
  user_exists BOOLEAN;
  user_id UUID;
  created_user_id UUID;
BEGIN
  -- First check if user exists
  SELECT e.exists_flag, e.user_id INTO user_exists, user_id
  FROM check_user_exists(clerk_id_param) e;
  
  -- If user exists, return it
  IF user_exists THEN
    RETURN QUERY SELECT user_id, clerk_id_param, FALSE;
    RETURN;
  END IF;
  
  -- User doesn't exist, create it with RLS disabled for this transaction
  SET LOCAL row_security = off;
  
  INSERT INTO users (
    clerk_id,
    email,
    created_at,
    updated_at
  ) VALUES (
    clerk_id_param,
    email_param,
    NOW(),
    NOW()
  )
  RETURNING id INTO created_user_id;
  
  -- Return the newly created user
  RETURN QUERY SELECT created_user_id, clerk_id_param, TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION create_user_if_not_exists(TEXT, TEXT) IS 'Creates a user if one does not already exist with the given clerk_id.';

-- Function to disable RLS temporarily (for admin operations)
CREATE OR REPLACE FUNCTION public.disable_rls_for_transaction()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Execute with owner privileges
AS $$
BEGIN
  -- Temporarily disable RLS on the cards table
  ALTER TABLE public.cards DISABLE ROW LEVEL SECURITY;
END;
$$;

-- Function to re-enable RLS (call after operations)
CREATE OR REPLACE FUNCTION public.enable_rls_for_transaction()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Execute with owner privileges
AS $$
BEGIN
  -- Re-enable RLS on the cards table
  ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
END;
$$;

-- Function to match a user ID against the authenticated user
CREATE OR REPLACE FUNCTION public.match_user_id(clerk_user_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Execute with owner privileges
AS $$
BEGIN
  -- Return true if the passed ID matches the authenticated user
  RETURN clerk_user_id = current_setting('request.jwt.claim.sub', TRUE);
END;
$$; 