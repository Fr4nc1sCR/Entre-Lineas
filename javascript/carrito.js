// Agregar o actualizar libro en el carrito
async function agregarAlCarrito(libroId) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session.user.id;

  // Verificar si el libro ya está en el carrito
  const { data: existente, error: fetchError } = await supabase
    .from('carrito')
    .select('id, cantidad')
    .eq('user_id', userId)
    .eq('libro_id', libroId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error("Error al buscar en el carrito:", fetchError.message);
    return;
  }

  if (existente) {
    // Ya existe, entonces actualizamos la cantidad
    const { error: updateError } = await supabase
      .from('carrito')
      .update({ cantidad: existente.cantidad + 1 })
      .eq('id', existente.id);

    if (updateError) {
      console.error("Error al actualizar cantidad:", updateError.message);
    }
  } else {
    // No existe, lo insertamos
    const { error: insertError } = await supabase
      .from('carrito')
      .insert([{ user_id: userId, libro_id: libroId, cantidad: 1 }]);

    if (insertError) {
      console.error("Error al agregar al carrito:", insertError.message);
    }
  }
}

// Vaciar el carrito completo
async function vaciarCarrito() {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session.user.id;

  const { error } = await supabase
    .from('carrito')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error("Error al vaciar el carrito:", error.message);
  } else {
    Swal.fire({
      icon: 'success',
      title: 'Carrito vaciado',
      text: 'Todos los libros fueron eliminados del carrito.',
    });
  }
}