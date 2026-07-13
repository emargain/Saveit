-- SaveIt — migration 011: categories table.
-- Fuente única de verdad para las categorías del marketplace.
-- Consumida por la app móvil (customer) y el dashboard partner (web).
-- Cada categoría tiene un slug estable (identificador interno) y un display_name
-- que es lo que ve el usuario. Icono y color son metadatos para el UI.

create table if not exists public.categories (
  slug text primary key,
  display_name text not null,
  display_order int not null default 0,
  icon_name text,
  color_hex text,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.categories enable row level security;

-- Lectura pública: cualquiera puede ver las categorías (incluso sin autenticar,
-- porque el partner que apenas empieza el onboarding necesita ver las opciones).
create policy "categories_select_public"
  on public.categories for select
  using (true);

-- Escritura solo admin (por ahora, esto significa via dashboard de Supabase).
-- Cuando exista un admin panel, se ajusta.
create policy "categories_write_admin_only"
  on public.categories for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

comment on table public.categories is
  'Categorías del marketplace. Consumida por app móvil y dashboard partner. Cambios aquí se reflejan en ambas apps sin redeploy.';

-- Seed con las 6 categorías del piloto
insert into public.categories (slug, display_name, display_order, icon_name, color_hex)
values
  ('fitness', 'Fitness', 1, 'dumbbell', '#E8E4FF'),
  ('yoga_flex', 'Yoga / Flex', 2, 'yoga', '#FFE4EC'),
  ('padel', 'Pádel', 3, 'tennis-ball', '#FFEACC'),
  ('boxeo', 'Boxeo', 4, 'boxing-glove', '#FFDEDE'),
  ('belleza', 'Belleza', 5, 'flower', '#E8E4FF'),
  ('bienestar', 'Bienestar', 6, 'leaf', '#E4F5E9')
on conflict (slug) do nothing;

-- Verificar
select slug, display_name, display_order, is_active
from public.categories
order by display_order;
