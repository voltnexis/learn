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

// Test connection with better error handling for GitHub Pages
supabase.from('users').select('count', { count: 'exact', head: true })
    .then(({ error }) => {
        if (error) {
            console.warn('Supabase connection issue:', error.message);
            // Try alternative connection test
            return supabase.from('users').select('id').limit(1);
        } else {
            console.log('Supabase connected successfully');
        }
    })
    .catch(err => {
        console.error('Supabase connection failed:', err);
        // Set a flag for fallback behavior
        window.supabaseConnectionFailed = true;
    });

export default supabase;

