-- ============================================================================
-- Esquema de base de datos - App de Soporte Técnico (GIJIops)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

-- Extensión necesaria para generar UUIDs si se llegan a usar en el futuro
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- USERS
-- ----------------------------------------------------------------------------
create table if not exists users (
  id             text primary key,
  email          text not null unique,
  name           text not null,
  role           text not null check (role in ('empresa', 'admin', 'tecnico')),
  empresa_id     text,
  contacto       text,
  telefono       text,
  plan           text,
  especialidad   text,
  created_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TICKETS
-- ----------------------------------------------------------------------------
create table if not exists tickets (
  id                   text primary key,
  empresa_id           text not null,
  empresa_nombre       text not null,
  titulo               text not null,
  descripcion          text not null,
  categoria            text not null default 'General',
  prioridad            text not null default 'media' check (prioridad in ('baja','media','alta','critico')),
  estado               text not null default 'pendiente' check (estado in ('pendiente','en_proceso','resuelto')),
  tecnico_asignado     text default 'Sin Asignar',
  fecha_creacion       timestamptz not null default now(),
  fecha_actualizacion  timestamptz not null default now()
);

create index if not exists idx_tickets_empresa on tickets (empresa_id);
create index if not exists idx_tickets_estado on tickets (estado);

-- ----------------------------------------------------------------------------
-- TICKET MESSAGES (relación 1-N con tickets, reemplaza el array "mensajes")
-- ----------------------------------------------------------------------------
create table if not exists ticket_messages (
  id          bigint generated always as identity primary key,
  ticket_id   text not null references tickets(id) on delete cascade,
  autor       text not null,
  rol         text not null check (rol in ('empresa','admin','tecnico')),
  mensaje     text not null,
  fecha       timestamptz not null default now()
);

create index if not exists idx_messages_ticket on ticket_messages (ticket_id);

-- ----------------------------------------------------------------------------
-- LICENSES CATALOG (catálogo público de licencias ofrecidas)
-- ----------------------------------------------------------------------------
create table if not exists licenses_catalog (
  id                text primary key,
  nombre            text not null,
  tipo              text,
  fabricante        text,
  precio_unitario   text,
  incluye           text,
  icono             text
);

-- ----------------------------------------------------------------------------
-- ACTIVE LICENSES (licencias asignadas a cada empresa)
-- ----------------------------------------------------------------------------
create table if not exists active_licenses (
  id                 text primary key,
  empresa_id         text not null,
  nombre             text not null,
  cantidad           integer not null default 1,
  clave_licencia     text,
  fecha_vencimiento  date,
  estado             text not null default 'Activa'
);

create index if not exists idx_licenses_empresa on active_licenses (empresa_id);

-- ----------------------------------------------------------------------------
-- EQUIPMENT (inventario de hardware por empresa)
-- ----------------------------------------------------------------------------
create table if not exists equipment (
  id                     text primary key,
  empresa_id             text not null,
  codigo_activo          text not null,
  tipo                   text,
  marca_modelo           text,
  ubicacion              text,
  especificaciones       text,
  ultimo_mantenimiento   date,
  proximo_mantenimiento  date,
  estado                 text not null default 'Operativo'
);

create index if not exists idx_equipment_empresa on equipment (empresa_id);

-- ----------------------------------------------------------------------------
-- Trigger: mantener fecha_actualizacion al día en tickets
-- ----------------------------------------------------------------------------
create or replace function set_ticket_updated_at()
returns trigger as $$
begin
  new.fecha_actualizacion = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tickets_updated_at on tickets;
create trigger trg_tickets_updated_at
  before update on tickets
  for each row
  execute function set_ticket_updated_at();
