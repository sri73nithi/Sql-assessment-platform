-- Create sandbox restricted role with no superuser or write permissions
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sandbox_student') THEN
        CREATE ROLE sandbox_student WITH LOGIN PASSWORD 'student_secret_pass';
    END IF;
END
$$;

-- Revoke default privileges from public
REVOKE TEMP ON DATABASE postgres FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Allow connect to postgres for the restricted student role
GRANT CONNECT ON DATABASE postgres TO sandbox_student;
GRANT USAGE ON SCHEMA public TO sandbox_student;
