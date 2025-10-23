-- Create a function that allows executing arbitrary SQL
CREATE OR REPLACE FUNCTION execute_custom_sql(sql_query text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the creator
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Execute the SQL and capture the result
  EXECUTE 'SELECT jsonb_agg(t) FROM (' || sql_query || ') t' INTO result;
  RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- By default, revoke execute permission from public and authenticated users
REVOKE EXECUTE ON FUNCTION execute_custom_sql(text) FROM PUBLIC, authenticated;