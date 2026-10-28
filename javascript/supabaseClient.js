// javascript/supabaseClient.js
// Si se crea un proyecto nuevo de Supabase, reemplazar estos dos valores con los de
// Project Settings > API (Project URL y la clave anon/publishable).

const supabaseUrl = 'https://egashjhrkdcfsjhynrpo.supabase.co'; // CORREGIDO: dominio válido
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYXNoamhya2RjZnNqaHlucnBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMzc4NDksImV4cCI6MjEwODcxMzg0OX0.y8q2yQKnkQ0LurRDwuujKcmo4RygePNu5qXgzdnFw5o';

window.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);