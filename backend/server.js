const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());

/* ==========================================================================
   AUTO-INITIALIZE TABLES IF NOT EXISTS (SUPABASE / POSTGRES)
   ========================================================================== */
async function initDb() {
  try {
    await pool.query(`
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
        password       text default '123456',
        created_at     timestamptz not null default now()
      );

      alter table users add column if not exists password text default '123456';

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

      create table if not exists ticket_messages (
        id          bigint generated always as identity primary key,
        ticket_id   text not null references tickets(id) on delete cascade,
        autor       text not null,
        rol         text not null check (rol in ('empresa','admin','tecnico')),
        mensaje     text not null,
        fecha       timestamptz not null default now()
      );

      create table if not exists licenses_catalog (
        id                text primary key,
        nombre            text not null,
        tipo              text,
        fabricante        text,
        precio_unitario   text,
        incluye           text,
        icono             text
      );

      create table if not exists active_licenses (
        id                 text primary key,
        empresa_id         text not null,
        nombre             text not null,
        cantidad           integer not null default 1,
        clave_licencia     text,
        fecha_vencimiento  date,
        estado             text not null default 'Activa'
      );

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
    `);

    // Asegurar usuario Admin General 'GIJIops' y usuario Cliente Normal en PostgreSQL
    await pool.query(`
      insert into users (id, email, name, role, empresa_id, contacto, telefono, plan, especialidad, password)
      values ('usr_admin_gijiops', 'admin@soporte.com', 'GIJIops', 'admin', NULL, 'Administrador General', '+52 55 5555 0101', 'Super Admin', 'Administración Global & DevOps', 'admin123')
      on conflict (email) do update set name = 'GIJIops', password = 'admin123';

      insert into users (id, email, name, role, empresa_id, contacto, telefono, plan, especialidad, password)
      values ('usr_cliente_normal', 'usuario@soporte.com', 'Usuario Normal (Cliente)', 'empresa', 'emp_1', 'Juan Pérez (Cliente Real)', '+52 55 1234 5678', 'Standard Pro', NULL, 'user123')
      on conflict (email) do update set name = 'Usuario Normal (Cliente)', password = 'user123';
    `);
    console.log('✔ Usuarios Admin GIJIops (admin@soporte.com / admin123) y Cliente Normal (usuario@soporte.com / user123) listos en PostgreSQL.');

    console.log('✔ Esquema de base de datos verificado e inicializado correctamente.');
  } catch (err) {
    console.error('⚠ Error inicializando las tablas de PostgreSQL:', err.message);
  }
}

initDb();

/* ==========================================================================
   Helpers - conversores snake_case <-> camelCase
   ========================================================================== */
function mapUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    empresaId: row.empresa_id,
    contacto: row.contacto,
    telefono: row.telefono,
    plan: row.plan,
    especialidad: row.especialidad,
    createdAt: row.created_at,
  };
}

function mapTicket(row, mensajes = []) {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    empresaNombre: row.empresa_nombre,
    titulo: row.titulo,
    descripcion: row.descripcion,
    categoria: row.categoria,
    prioridad: row.prioridad,
    estado: row.estado,
    tecnicoAsignado: row.tecnico_asignado,
    fechaCreacion: row.fecha_creacion,
    fechaActualizacion: row.fecha_actualizacion,
    mensajes: mensajes.map(mapMensaje),
  };
}

function mapMensaje(row) {
  return {
    autor: row.autor,
    rol: row.rol,
    mensaje: row.mensaje,
    fecha: row.fecha,
  };
}

function mapLicenseCatalog(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo,
    fabricante: row.fabricante,
    precioUnitario: row.precio_unitario,
    incluye: row.incluye,
    icono: row.icono,
  };
}

function mapActiveLicense(row) {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    nombre: row.nombre,
    cantidad: row.cantidad,
    claveLicencia: row.clave_licencia,
    fechaVencimiento: row.fecha_vencimiento,
    estado: row.estado,
  };
}

function mapEquipment(row) {
  return {
    id: row.id,
    empresaId: row.empresa_id,
    codigoActivo: row.codigo_activo,
    tipo: row.tipo,
    marcaModelo: row.marca_modelo,
    ubicacion: row.ubicacion,
    especificaciones: row.especificaciones,
    ultimoMantenimiento: row.ultimo_mantenimiento,
    proximoMantenimiento: row.proximo_mantenimiento,
    estado: row.estado,
  };
}

async function loadMensajesForTickets(ticketIds) {
  if (ticketIds.length === 0) return {};
  const { rows } = await pool.query(
    `select * from ticket_messages where ticket_id = any($1::text[]) order by fecha asc`,
    [ticketIds]
  );
  const byTicket = {};
  for (const row of rows) {
    if (!byTicket[row.ticket_id]) byTicket[row.ticket_id] = [];
    byTicket[row.ticket_id].push(row);
  }
  return byTicket;
}

/* ==========================================================================
   AUTH ENDPOINTS
   ========================================================================== */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    let result = await pool.query('select * from users where lower(email) = lower($1)', [email]);

    if (result.rows.length === 0 && role) {
      result = await pool.query('select * from users where role = $1 limit 1', [role]);
    }

    if (result.rows.length === 0) {
      result = await pool.query('select * from users limit 1');
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado en la base de datos' });
    }

    const userRow = result.rows[0];

    if (password && userRow.password && userRow.password !== password) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta. Verifica tus credenciales.' });
    }

    const user = mapUser(userRow);
    return res.json({
      success: true,
      user,
      token: `demo-jwt-token-${user.id}-${Date.now()}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

/* ==========================================================================
   USERS ENDPOINTS (CRUD Completo para Admin)
   ========================================================================== */
app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await pool.query('select * from users order by created_at desc');
    return res.json({ success: true, users: rows.map(mapUser) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error interno obteniendo usuarios' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, name, role, empresaId, contacto, telefono, plan, especialidad } = req.body;
    const id = `usr_${role}_${Date.now()}`;

    const { rows } = await pool.query(
      `insert into users (id, email, name, role, empresa_id, contacto, telefono, plan, especialidad)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       returning *`,
      [id, email, name, role || 'empresa', empresaId || null, contacto || null, telefono || null, plan || null, especialidad || null]
    );

    return res.status(201).json({ success: true, user: mapUser(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || 'Error al crear usuario' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { email, name, role, empresaId, contacto, telefono, plan, especialidad } = req.body;
    const { rows } = await pool.query(
      `update users
       set email = coalesce($2, email),
           name = coalesce($3, name),
           role = coalesce($4, role),
           empresa_id = coalesce($5, empresa_id),
           contacto = coalesce($6, contacto),
           telefono = coalesce($7, telefono),
           plan = coalesce($8, plan),
           especialidad = coalesce($9, especialidad)
       where id = $1
       returning *`,
      [req.params.id, email, name, role, empresaId, contacto, telefono, plan, especialidad]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    return res.json({ success: true, user: mapUser(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error actualizando usuario' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('delete from users where id = $1 returning *', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    return res.json({ success: true, message: 'Usuario eliminado correctamente', user: mapUser(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error eliminando usuario' });
  }
});

/* ==========================================================================
   TICKETS ENDPOINTS (CRUD Completo)
   ========================================================================== */
app.get('/api/tickets', async (req, res) => {
  try {
    const { empresaId, role } = req.query;

    let query = 'select * from tickets';
    const params = [];

    if (role === 'empresa' && empresaId) {
      query += ' where empresa_id = $1';
      params.push(empresaId);
    }
    query += ' order by fecha_creacion desc';

    const { rows } = await pool.query(query, params);
    const mensajesByTicket = await loadMensajesForTickets(rows.map(r => r.id));
    const tickets = rows.map(r => mapTicket(r, mensajesByTicket[r.id] || []));

    return res.json({ success: true, tickets });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

app.get('/api/tickets/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('select * from tickets where id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    }
    const mensajesByTicket = await loadMensajesForTickets([req.params.id]);
    const ticket = mapTicket(rows[0], mensajesByTicket[req.params.id] || []);
    return res.json({ success: true, ticket });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

app.post('/api/tickets', async (req, res) => {
  const client = await pool.connect();
  try {
    const { empresaId, empresaNombre, titulo, descripcion, categoria, prioridad } = req.body;
    const id = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;

    await client.query('begin');

    const { rows } = await client.query(
      `insert into tickets (id, empresa_id, empresa_nombre, titulo, descripcion, categoria, prioridad, estado, tecnico_asignado)
       values ($1, $2, $3, $4, $5, $6, $7, 'pendiente', 'Sin Asignar')
       returning *`,
      [
        id,
        empresaId || 'emp_1',
        empresaNombre || 'TechCorp Logistics S.A.',
        titulo,
        descripcion,
        categoria || 'General',
        prioridad || 'media',
      ]
    );

    await client.query(
      `insert into ticket_messages (ticket_id, autor, rol, mensaje) values ($1, $2, 'empresa', $3)`,
      [id, empresaNombre || 'Cliente', descripcion]
    );

    await client.query('commit');

    const mensajesByTicket = await loadMensajesForTickets([id]);
    const ticket = mapTicket(rows[0], mensajesByTicket[id] || []);

    return res.status(201).json({ success: true, ticket });
  } catch (err) {
    await client.query('rollback');
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  } finally {
    client.release();
  }
});

app.put('/api/tickets/:id', async (req, res) => {
  try {
    const { titulo, descripcion, categoria, prioridad, estado, tecnicoAsignado } = req.body;
    const { rows } = await pool.query(
      `update tickets
       set titulo = coalesce($2, titulo),
           descripcion = coalesce($3, descripcion),
           categoria = coalesce($4, categoria),
           prioridad = coalesce($5, prioridad),
           estado = coalesce($6, estado),
           tecnico_asignado = coalesce($7, tecnico_asignado),
           fecha_actualizacion = now()
       where id = $1
       returning *`,
      [req.params.id, titulo, descripcion, categoria, prioridad, estado, tecnicoAsignado]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    }

    const mensajesByTicket = await loadMensajesForTickets([req.params.id]);
    return res.json({ success: true, ticket: mapTicket(rows[0], mensajesByTicket[req.params.id] || []) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error actualizando ticket' });
  }
});

app.put('/api/tickets/:id/estado', async (req, res) => {
  try {
    const { estado, tecnicoAsignado } = req.body;

    const { rows } = await pool.query(
      `update tickets
       set estado = coalesce($2, estado),
           tecnico_asignado = coalesce($3, tecnico_asignado),
           fecha_actualizacion = now()
       where id = $1
       returning *`,
      [req.params.id, estado || null, tecnicoAsignado || null]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    }

    const mensajesByTicket = await loadMensajesForTickets([req.params.id]);
    const ticket = mapTicket(rows[0], mensajesByTicket[req.params.id] || []);
    return res.json({ success: true, ticket });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

app.delete('/api/tickets/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('delete from tickets where id = $1 returning *', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    }
    return res.json({ success: true, message: 'Ticket eliminado correctamente' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error eliminando ticket' });
  }
});

app.post('/api/tickets/:id/mensajes', async (req, res) => {
  try {
    const { autor, rol, mensaje } = req.body;

    const ticketCheck = await pool.query('select id from tickets where id = $1', [req.params.id]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    }

    await pool.query(
      `insert into ticket_messages (ticket_id, autor, rol, mensaje) values ($1, $2, $3, $4)`,
      [req.params.id, autor, rol, mensaje]
    );

    const { rows } = await pool.query(
      `update tickets set fecha_actualizacion = now() where id = $1 returning *`,
      [req.params.id]
    );

    const mensajesByTicket = await loadMensajesForTickets([req.params.id]);
    const ticket = mapTicket(rows[0], mensajesByTicket[req.params.id] || []);
    return res.json({ success: true, ticket });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

/* ==========================================================================
   LICENSES ENDPOINTS (Active Licenses & Catalog CRUD)
   ========================================================================== */
app.get('/api/licenses/catalog', async (req, res) => {
  try {
    const { rows } = await pool.query('select * from licenses_catalog order by id asc');
    return res.json({ success: true, catalog: rows.map(mapLicenseCatalog) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

app.post('/api/licenses/catalog', async (req, res) => {
  try {
    const { nombre, tipo, fabricante, precioUnitario, incluye, icono } = req.body;
    const id = `lic_${Date.now()}`;

    const { rows } = await pool.query(
      `insert into licenses_catalog (id, nombre, tipo, fabricante, precio_unitario, incluye, icono)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [id, nombre, tipo || 'Suscripción', fabricante || 'Genérico', precioUnitario || '$0.00', incluye || '', icono || 'key-outline']
    );

    return res.status(201).json({ success: true, catalogItem: mapLicenseCatalog(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error agregando item al catálogo' });
  }
});

app.put('/api/licenses/catalog/:id', async (req, res) => {
  try {
    const { nombre, tipo, fabricante, precioUnitario, incluye, icono } = req.body;
    const { rows } = await pool.query(
      `update licenses_catalog
       set nombre = coalesce($2, nombre),
           tipo = coalesce($3, tipo),
           fabricante = coalesce($4, fabricante),
           precio_unitario = coalesce($5, precio_unitario),
           incluye = coalesce($6, incluye),
           icono = coalesce($7, icono)
       where id = $1
       returning *`,
      [req.params.id, nombre, tipo, fabricante, precioUnitario, incluye, icono]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Item de catálogo no encontrado' });
    }

    return res.json({ success: true, catalogItem: mapLicenseCatalog(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error editando item de catálogo' });
  }
});

app.delete('/api/licenses/catalog/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('delete from licenses_catalog where id = $1 returning *', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Item de catálogo no encontrado' });
    }
    return res.json({ success: true, message: 'Item de catálogo eliminado' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error eliminando item de catálogo' });
  }
});

app.get('/api/licenses/active', async (req, res) => {
  try {
    const { empresaId } = req.query;
    let query = 'select * from active_licenses';
    const params = [];
    if (empresaId) {
      query += ' where empresa_id = $1';
      params.push(empresaId);
    }
    const { rows } = await pool.query(query, params);
    return res.json({ success: true, licenses: rows.map(mapActiveLicense) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

app.post('/api/licenses/active', async (req, res) => {
  try {
    const { empresaId, nombre, cantidad, claveLicencia, fechaVencimiento, estado } = req.body;
    const id = `act_lic_${Date.now()}`;

    const { rows } = await pool.query(
      `insert into active_licenses (id, empresa_id, nombre, cantidad, clave_licencia, fecha_vencimiento, estado)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [id, empresaId || 'emp_1', nombre, cantidad || 1, claveLicencia || 'N/A', fechaVencimiento || '2027-12-31', estado || 'Activa']
    );

    return res.status(201).json({ success: true, license: mapActiveLicense(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error creando licencia activa' });
  }
});

app.put('/api/licenses/active/:id', async (req, res) => {
  try {
    const { empresaId, nombre, cantidad, claveLicencia, fechaVencimiento, estado } = req.body;
    const { rows } = await pool.query(
      `update active_licenses
       set empresa_id = coalesce($2, empresa_id),
           nombre = coalesce($3, nombre),
           cantidad = coalesce($4, cantidad),
           clave_licencia = coalesce($5, clave_licencia),
           fecha_vencimiento = coalesce($6, fecha_vencimiento),
           estado = coalesce($7, estado)
       where id = $1
       returning *`,
      [req.params.id, empresaId, nombre, cantidad, claveLicencia, fechaVencimiento, estado]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Licencia activa no encontrada' });
    }

    return res.json({ success: true, license: mapActiveLicense(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error actualizando licencia activa' });
  }
});

app.delete('/api/licenses/active/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('delete from active_licenses where id = $1 returning *', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Licencia activa no encontrada' });
    }
    return res.json({ success: true, message: 'Licencia activa eliminada' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error eliminando licencia activa' });
  }
});

app.post('/api/licenses/request', async (req, res) => {
  const client = await pool.connect();
  try {
    const { empresaId, empresaNombre, nombreLicencia, cantidad, notas } = req.body;
    const id = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
    const titulo = `Solicitud de Licencia: ${nombreLicencia} (x${cantidad})`;
    const descripcion = `Solicitud de adquisición/renovación de ${cantidad} unidades de ${nombreLicencia}. Notas: ${notas || 'Sin notas adicionales.'}`;

    await client.query('begin');

    const { rows } = await client.query(
      `insert into tickets (id, empresa_id, empresa_nombre, titulo, descripcion, categoria, prioridad, estado, tecnico_asignado)
       values ($1, $2, $3, $4, $5, 'Licencias', 'media', 'pendiente', 'Sin Asignar')
       returning *`,
      [id, empresaId || 'emp_1', empresaNombre || 'TechCorp Logistics S.A.', titulo, descripcion]
    );

    await client.query(
      `insert into ticket_messages (ticket_id, autor, rol, mensaje) values ($1, $2, 'empresa', $3)`,
      [id, empresaNombre || 'Cliente', `Solicitud formal de ${cantidad} licencias de ${nombreLicencia}.`]
    );

    await client.query('commit');

    const mensajesByTicket = await loadMensajesForTickets([id]);
    const ticket = mapTicket(rows[0], mensajesByTicket[id] || []);

    return res.status(201).json({ success: true, message: 'Solicitud de licencia enviada exitosamente', ticket });
  } catch (err) {
    await client.query('rollback');
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  } finally {
    client.release();
  }
});

/* ==========================================================================
   EQUIPMENT ENDPOINTS (CRUD Completo)
   ========================================================================== */
app.get('/api/equipment', async (req, res) => {
  try {
    const { empresaId } = req.query;
    let query = 'select * from equipment';
    const params = [];
    if (empresaId) {
      query += ' where empresa_id = $1';
      params.push(empresaId);
    }
    const { rows } = await pool.query(query, params);
    return res.json({ success: true, equipment: rows.map(mapEquipment) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

app.post('/api/equipment', async (req, res) => {
  try {
    const { empresaId, codigoActivo, tipo, marcaModelo, ubicacion, especificaciones, estado } = req.body;
    const id = `eq_${Date.now()}`;
    const codigo = codigoActivo || `EQ-HW-${Math.floor(100 + Math.random() * 900)}`;

    const { rows } = await pool.query(
      `insert into equipment (id, empresa_id, codigo_activo, tipo, marca_modelo, ubicacion, especificaciones,
         ultimo_mantenimiento, proximo_mantenimiento, estado)
       values ($1, $2, $3, $4, $5, $6, $7, current_date, current_date + interval '180 days', $8)
       returning *`,
      [id, empresaId || 'emp_1', codigo, tipo, marcaModelo, ubicacion, especificaciones, estado || 'Operativo']
    );

    return res.status(201).json({ success: true, equipment: mapEquipment(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

app.put('/api/equipment/:id', async (req, res) => {
  try {
    const { empresaId, codigoActivo, tipo, marcaModelo, ubicacion, especificaciones, estado, proximoMantenimiento } = req.body;
    const { rows } = await pool.query(
      `update equipment
       set empresa_id = coalesce($2, empresa_id),
           codigo_activo = coalesce($3, codigo_activo),
           tipo = coalesce($4, tipo),
           marca_modelo = coalesce($5, marca_modelo),
           ubicacion = coalesce($6, ubicacion),
           especificaciones = coalesce($7, especificaciones),
           estado = coalesce($8, estado),
           proximo_mantenimiento = coalesce($9, proximo_mantenimiento)
       where id = $1
       returning *`,
      [req.params.id, empresaId, codigoActivo, tipo, marcaModelo, ubicacion, especificaciones, estado, proximoMantenimiento]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
    }

    return res.json({ success: true, equipment: mapEquipment(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error actualizando equipo' });
  }
});

app.delete('/api/equipment/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('delete from equipment where id = $1 returning *', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Equipo no encontrado' });
    }
    return res.json({ success: true, message: 'Equipo eliminado del inventario' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error eliminando equipo' });
  }
});

/* ==========================================================================
   STATS DASHBOARD ENDPOINT
   ========================================================================== */
app.get('/api/stats', async (req, res) => {
  try {
    const [ticketsRes, equipmentRes, licensesRes] = await Promise.all([
      pool.query('select estado, prioridad from tickets'),
      pool.query('select count(*)::int as total from equipment'),
      pool.query('select coalesce(sum(cantidad), 0)::int as total from active_licenses'),
    ]);

    const tickets = ticketsRes.rows;
    const stats = {
      totalTickets: tickets.length,
      pendientes: tickets.filter(t => t.estado === 'pendiente').length,
      enProceso: tickets.filter(t => t.estado === 'en_proceso').length,
      resueltos: tickets.filter(t => t.estado === 'resuelto').length,
      criticos: tickets.filter(t => t.prioridad === 'critico' && t.estado !== 'resuelto').length,
      totalEquipos: equipmentRes.rows[0].total,
      totalLicenciasActivas: licensesRes.rows[0].total,
    };

    return res.json({ success: true, stats });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

/* ==========================================================================
   HEALTHCHECK
   ========================================================================== */
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('select 1');
    return res.json({ success: true, database: 'connected' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, database: 'disconnected' });
  }
});

app.listen(PORT, HOST, () => {
  const os = require('os');
  const nets = os.networkInterfaces();
  const lanIps = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        lanIps.push(net.address);
      }
    }
  }

  console.log(`====================================================`);
  console.log(` Servidor Backend Soporte Técnico corriendo en:`);
  console.log(` http://localhost:${PORT}  (solo desde esta PC)`);
  if (lanIps.length) {
    lanIps.forEach(ip => {
      console.log(` http://${ip}:${PORT}  <-- usá esta IP en environment.ts`);
    });
  }
  console.log(` Base de datos: Supabase PostgreSQL (${process.env.DATABASE_URL ? 'conectado' : 'SIN CONFIGURAR'})`);
  console.log(`====================================================`);
});
