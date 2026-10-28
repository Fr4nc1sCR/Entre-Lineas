-- supabase/schema.sql
-- Esquema completo de la base de datos de Entre Líneas.
-- Ejecutar una sola vez en un proyecto nuevo: Supabase > SQL Editor > New query > pegar todo > Run.

-- =========================================================
-- Tablas
-- =========================================================

-- Perfil de cada usuario (se crea automáticamente al registrarse, ver trigger más abajo)
create table public.users (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text,
  username      text,
  email         text,
  password_hash text default 'auth',  -- legado: la contraseña real la maneja Supabase Auth
  role          integer not null default 2,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint users_username_key unique (username),
  constraint users_email_key unique (email)
);

-- Catálogo de libros
create table public.libros (
  id                bigint generated always as identity primary key,
  titulo            text not null,
  autor             text not null,
  editorial         text,
  isbn              text,
  idioma            text,
  fecha_publicacion date,
  descripcion       text,
  precio            numeric(10, 2) not null default 0,
  stock             integer not null default 0,
  portada_url       text,
  created_at        timestamptz not null default now()
);

-- Carrito de compras (una fila por libro por usuario)
create table public.carrito (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  libro_id   bigint not null references public.libros (id) on delete cascade,
  cantidad   integer not null default 1 check (cantidad > 0),
  created_at timestamptz not null default now(),
  unique (user_id, libro_id)
);

-- Pedidos pagados (detalle = arreglo JSON con libro_id, cantidad, precio_unitario, subtotal)
create table public.pedidos (
  id      bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  total   numeric(12, 2) not null,
  estado  text not null default 'Pagado',
  detalle jsonb not null default '[]'::jsonb,
  fecha   timestamptz not null default now()
);

-- Registro individual de cada libro comprado
create table public.compras (
  id       bigint generated always as identity primary key,
  user_id  uuid not null references auth.users (id) on delete cascade,
  libro_id bigint references public.libros (id) on delete set null,
  cantidad integer not null default 1,
  fecha    timestamptz not null default now()
);

create index on public.carrito (user_id);
create index on public.pedidos (user_id);
create index on public.compras (user_id);

-- =========================================================
-- Crear la fila en public.users automáticamente al registrarse
-- (toma full_name y username de los metadatos enviados en signUp)
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, username, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'username',
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Permite verificar si un username está libre antes de registrarse
create or replace function public.username_disponible(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.users where username = p_username);
$$;

grant execute on function public.username_disponible(text) to anon, authenticated;

-- =========================================================
-- Seguridad (Row Level Security)
-- =========================================================

alter table public.users   enable row level security;
alter table public.libros  enable row level security;
alter table public.carrito enable row level security;
alter table public.pedidos enable row level security;
alter table public.compras enable row level security;

-- users: cada quien ve y edita solo su perfil (y no puede cambiarse el rol)
create policy "Ver mi perfil" on public.users
  for select to authenticated using (auth.uid() = id);
create policy "Editar mi perfil" on public.users
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

revoke update on public.users from authenticated;
grant update (full_name, username, updated_at) on public.users to authenticated;

-- libros: catálogo público de solo lectura
create policy "Catálogo visible" on public.libros
  for select to anon, authenticated using (true);

-- carrito: control total sobre el propio carrito
create policy "Mi carrito" on public.carrito
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- pedidos y compras: ver y crear los propios
create policy "Ver mis pedidos" on public.pedidos
  for select to authenticated using (auth.uid() = user_id);
create policy "Crear mis pedidos" on public.pedidos
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Ver mis compras" on public.compras
  for select to authenticated using (auth.uid() = user_id);
create policy "Crear mis compras" on public.compras
  for insert to authenticated with check (auth.uid() = user_id);
