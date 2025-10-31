import { createClient } from '@supabase/supabase-js';

// 这些凭据在启用了行级安全（RLS）的情况下可以安全地在浏览器环境中使用。
const supabaseUrl = 'https://hdgocjwmgpcdrkomtxaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ29jandtZ3BjZHJrb210eGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NTUxOTYsImV4cCI6MjA3NzIzMTE5Nn0.pzS9qn8KP1tVByuVbDhHvD83yStouqY925SldnFmDXc';

export const supabase = createClient(supabaseUrl, supabaseKey);
