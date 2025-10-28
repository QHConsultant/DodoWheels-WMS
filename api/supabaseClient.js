const { createClient } = require('@supabase/supabase-js');

// These details are safe to expose in a browser context
// if you have Row Level Security enabled on your tables.
const supabaseUrl = 'https://hdgocjwmgpcdrkomtxaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ29jandtZ3BjZHJrb210eGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NTUxOTYsImV4cCI6MjA3NzIzMTE5Nn0.pzS9qn8KP1tVByuVbDhHvD83yStouqY925SldnFmDXc';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;