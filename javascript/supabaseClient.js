// javascript/supabaseClient.js

const supabaseUrl = 'https://tesgrczidahfjwrniijv.supabase.co'; // CORREGIDO: dominio válido
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc2dyY3ppZGFoZmp3cm5paWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDU0NjYsImV4cCI6MjA2NzA4MTQ2Nn0.5kvXrymn7ahLu01E0hL0GTwD1LFyC5aCMMbSvecqnrA';

window.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);