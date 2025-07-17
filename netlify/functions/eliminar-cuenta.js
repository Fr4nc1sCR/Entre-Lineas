// netlify/functions/eliminar-cuenta.js
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' }),
    };
  }

  try {
    const { user_id } = JSON.parse(event.body);
    if (!user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'ID de usuario faltante' }),
      };
    }

    // Aquí puedes eliminar también datos de tus otras tablas si quieres
    const tablas = ['usuarios', 'carrito', 'pedidos']; // ajusta los nombres si es necesario
    for (const tabla of tablas) {
      await supabaseAdmin.from(tabla).delete().eq('user_id', user_id);
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}