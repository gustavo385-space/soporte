const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Escucha en todas las interfaces de red, no solo localhost,
                         // así tu teléfono en la misma WiFi puede alcanzarlo por la IP de tu PC

app.use(cors());
app.use(express.json());

/* ==========================================================================
   Helpers - convierten filas de Postgres (snake_case) al shape que ya
   consume el frontend Angular (camelCase), para no tener que tocarlo.
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
    const { email, role } = req.body;

    let result = await pool.query('select * from users where lower(email) = lower($1)', [email]);

    if (result.rows.length === 0 && role) {
      result = await pool.query('select * from users where role = $1 limit 1', [role]);
    }

    if (result.rows.length === 0) {
      result = await pool.query('select * from users limit 1');
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No hay usuarios registrados' });
    }

    const user = mapUser(result.rows[0]);
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
   TICKETS ENDPOINTS
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

app.put('/api/tickets/:id/estado', async (req, res) => {
  try {
    const { estado, tecnicoAsignado } = req.body;

    const { rows } = await pool.query(
      `update tickets
       set estado = coalesce($2, estado),
           tecnico_asignado = coalesce($3, tecnico_asignado)
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
   LICENSES ENDPOINTS
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
   EQUIPMENT ENDPOINTS
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
    const { empresaId, codigoActivo, tipo, marcaModelo, ubicacion, especificaciones } = req.body;
    const id = `eq_${Date.now()}`;
    const codigo = codigoActivo || `EQ-HW-${Math.floor(100 + Math.random() * 900)}`;

    const { rows } = await pool.query(
      `insert into equipment (id, empresa_id, codigo_activo, tipo, marca_modelo, ubicacion, especificaciones,
         ultimo_mantenimiento, proximo_mantenimiento, estado)
       values ($1, $2, $3, $4, $5, $6, $7, current_date, current_date + interval '180 days', 'Operativo')
       returning *`,
      [id, empresaId || 'emp_1', codigo, tipo, marcaModelo, ubicacion, especificaciones]
    );

    return res.status(201).json({ success: true, equipment: mapEquipment(rows[0]) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
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
   HEALTHCHECK - útil para confirmar que la conexión a Supabase funciona
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
