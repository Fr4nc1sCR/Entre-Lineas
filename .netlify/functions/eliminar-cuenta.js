// netlify/functions/eliminar-cuenta.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
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

  // Obtener el usuario a partir de su token de sesión (no se confía en un ID enviado por el cliente)
  const token = (event.headers.authorization || '').replace('Bearer ', '');

  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Sesión no proporcionada' }),
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData?.user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Sesión inválida o expirada' }),
    };
  }

  const user_id = userData.user.id;

  try {
    // Eliminar pedidos
    await supabase.from('pedidos').delete().eq('user_id', user_id);

    // Eliminar carrito
    await supabase.from('carrito').delete().eq('user_id', user_id);

    // Eliminar de la tabla personalizada de usuarios
    await supabase.from('users').delete().eq('id', user_id);

    // Eliminar el usuario de Supabase Auth (requiere Service Role Key)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);

    if (deleteError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: deleteError.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}