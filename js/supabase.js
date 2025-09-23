// Load Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase configuration
const SUPABASE_URL = "https://qqlpjmknhihcyhkgsbqb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbHBqbWtuaGloY3loa2dzYnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MTc3MjYsImV4cCI6MjA3MTA5MzcyNn0.JCLuJT-6rCwrYpZmQZftXiRo7gpVaBPRPEgos8CZwj0";

// Create and export Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false
    }
});

// Test connection
supabase.from('users').select('count', { count: 'exact', head: true })
    .then(({ error }) => {
        if (error) {
            console.warn('Supabase connection issue:', error.message);
        } else {
            console.log('Supabase connected successfully');
        }
    });

export default supabase;

