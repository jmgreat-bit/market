
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvtfpnqduwzrhyadalpy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2dGZwbnFkdXd6cmh5YWRhbHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODkwMjYsImV4cCI6MjA5MjQ2NTAyNn0.UoBnLb5a9ReOanlssz6jeLTXvPqChsffOHXgpJD8DrM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoles() {
  const emails = [
    'jgreat000@gmail.com',
    'trader_verify_final@test.com',
    'final_check@test.com',
    'joe_coffee@test.com'
  ];

  console.log('--- V2 Database Role Audit ---');
  for (const email of emails) {
    const { data, error } = await supabase
      .from('profiles')
      .select('email, role, full_name')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching ${email}:`, error.message);
    } else if (data) {
      console.log(`[${data.role.toUpperCase()}] ${email} (${data.full_name || 'No Name'})`);
    } else {
      console.log(`[MISSING] ${email}`);
    }
  }
  console.log('---------------------------');
}

checkRoles();
