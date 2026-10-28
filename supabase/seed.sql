-- supabase/seed.sql
-- Libros de ejemplo para que el catálogo no aparezca vacío.
-- Las portadas viven en /img/portadas (las sirve Netlify junto con el sitio).
-- Si ya cargaste los libros con la versión anterior de este archivo, ejecutá supabase/portadas.sql en su lugar.

insert into public.libros (titulo, autor, editorial, isbn, idioma, fecha_publicacion, descripcion, precio, stock, portada_url)
values
  ('Cien años de soledad', 'Gabriel García Márquez', 'Debolsillo', '9788497592208', 'Español', '1967-05-30',
   'La historia de la familia Buendía a lo largo de siete generaciones en el pueblo de Macondo.', 12500, 10,
   '/img/portadas/cien-anos-de-soledad.jpg'),
  ('Don Quijote de la Mancha', 'Miguel de Cervantes', 'Austral', '9788467044812', 'Español', '1605-01-16',
   'Las aventuras de un hidalgo que, tras leer demasiadas novelas de caballería, decide hacerse caballero andante.', 15000, 8,
   '/img/portadas/don-quijote-de-la-mancha.jpg'),
  ('Pedro Páramo', 'Juan Rulfo', 'Fondo de Cultura Económica', null, 'Español', '1955-03-19',
   'Juan Preciado viaja a Comala en busca de su padre y encuentra un pueblo habitado por murmullos.', 9800, 12,
   '/img/portadas/pedro-paramo.jpg');
