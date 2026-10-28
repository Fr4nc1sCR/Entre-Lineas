// netlify/functions/keep-alive.js
// Función programada (ver netlify.toml): consulta la base de datos una vez al día
// para que Supabase no pause el proyecto por inactividad.
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler() {
  const { error } = await supabase.from('libros').select('id').limit(1);

  if (error) {
    console.error('Keep-alive falló:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  console.log('Keep-alive OK:', new Date().toISOString());
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
}
