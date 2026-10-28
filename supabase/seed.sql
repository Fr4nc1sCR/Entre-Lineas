-- supabase/seed.sql
-- Libros de ejemplo para que el catálogo no aparezca vacío.
-- Reemplazá estos datos por tu catálogo real (los libros originales se perdieron con la base anterior).
-- portada_url puede ser cualquier URL pública de imagen (por ejemplo, de un bucket de Supabase Storage).

insert into public.libros (titulo, autor, editorial, isbn, idioma, fecha_publicacion, descripcion, precio, stock, portada_url)
values
  ('Cien años de soledad', 'Gabriel García Márquez', 'Editorial Sudamericana', null, 'Español', '1967-05-30',
   'La historia de la familia Buendía a lo largo de siete generaciones en el pueblo de Macondo.', 12500, 10, null),
  ('Don Quijote de la Mancha', 'Miguel de Cervantes', 'Francisco de Robles', null, 'Español', '1605-01-16',
   'Las aventuras de un hidalgo que, tras leer demasiadas novelas de caballería, decide hacerse caballero andante.', 15000, 8, null),
  ('Pedro Páramo', 'Juan Rulfo', 'Fondo de Cultura Económica', null, 'Español', '1955-03-19',
   'Juan Preciado viaja a Comala en busca de su padre y encuentra un pueblo habitado por murmullos.', 9800, 12, null);
