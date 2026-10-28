-- supabase/portadas.sql
-- Agrega portada (y ediciones con ISBN) a los libros que ya se cargaron con el seed anterior.
-- Ejecutar una vez: Supabase > SQL Editor > New query > pegar todo > Run.
-- Las imágenes están en /img/portadas (fuente: Open Library, covers.openlibrary.org).

update public.libros
set portada_url = '/img/portadas/cien-anos-de-soledad.jpg',
    editorial   = 'Debolsillo',
    isbn        = '9788497592208'
where titulo = 'Cien años de soledad';

update public.libros
set portada_url = '/img/portadas/don-quijote-de-la-mancha.jpg',
    editorial   = 'Austral',
    isbn        = '9788467044812'
where titulo = 'Don Quijote de la Mancha';

update public.libros
set portada_url = '/img/portadas/pedro-paramo.jpg'
where titulo = 'Pedro Páramo';
