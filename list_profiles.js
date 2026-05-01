
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvtfpnqduwzrhyadalpy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2dGZwbnFkdXd6cmh5YWRhbHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODkwMjYsImV4cCI6MjA5MjQ2NTAyNn0.UoBnLb5a9ReOanlssz6jeLTXvPqChsffOHXgpJD8DrM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('email, role, full_name, username');

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log(`Found ${data.length} profiles:`);
    data.forEach(p => {
      console.log(`- ${p.email || 'NO EMAIL'} (${p.username || 'NO USERNAME'}) : ${p.role}`);
    });
  }
}

listProfiles();
