
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);

    try {
        // Try to fetch a public table to check connection and schema
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Connection failed or table missing:', error.message);
            if (error.code === 'PGRST204') { // Table not found
                console.log('\nCRITICAL: The "profiles" table was not found.');
                console.log('You MUST run "supabase-schema.sql" in your Supabase SQL Editor.');
            }
        } else {
            console.log('Successfully connected to Supabase!');
            console.log('"profiles" table exists.');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkConnection();
