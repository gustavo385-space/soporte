const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Helper function to read database
function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error leyendo db.json:', err);
    return { users: [], tickets: [], licensesCatalog: [], activeLicenses: [], equipment: [] };
  }
}

// Helper function to write database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error escribiendo db.json:', err);
  }
}

/* ==========================================================================
   AUTH ENDPOINTS
   ========================================================================== */
app.post('/api/auth/login', (req, res) => {
  const { email, role } = req.body;
  const db = readDB();
  
  let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user && role) {
    // Demo user fallback matching role
    user = db.users.find(u => u.role === role);
  }
  
  if (!user) {
    // Return default company user if not found
    user = db.users[0];
  }
  
  return res.json({
    success: true,
    user,
    token: `demo-jwt-token-${user.id}-${Date.now()}`
  });
});

/* ==========================================================================
   TICKETS ENDPOINTS
   ========================================================================== */
app.get('/api/tickets', (req, res) => {
  const { empresaId, role } = req.query;
  const db = readDB();
  
  let tickets = db.tickets;
  if (role === 'empresa' && empresaId) {
    tickets = tickets.filter(t => t.empresaId === empresaId);
  }
  
  return res.json({ success: true, tickets });
});

app.get('/api/tickets/:id', (req, res) => {
  const db = readDB();
  const ticket = db.tickets.find(t => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
  }
  return res.json({ success: true, ticket });
});

app.post('/api/tickets', (req, res) => {
  const { empresaId, empresaNombre, titulo, descripcion, categoria, prioridad } = req.body;
  const db = readDB();

  const newTicket = {
    id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
    empresaId: empresaId || 'emp_1',
    empresaNombre: empresaNombre || 'TechCorp Logistics S.A.',
    titulo,
    descripcion,
    categoria: categoria || 'General',
    prioridad: prioridad || 'media',
    estado: 'pendiente',
    tecnicoAsignado: 'Sin Asignar',
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
    mensajes: [
      {
        autor: empresaNombre || 'Cliente',
        rol: 'empresa',
        mensaje: descripcion,
        fecha: new Date().toISOString()
      }
    ]
  };

  db.tickets.unshift(newTicket);
  writeDB(db);

  return res.status(201).json({ success: true, ticket: newTicket });
});

app.put('/api/tickets/:id/estado', (req, res) => {
  const { estado, tecnicoAsignado } = req.body;
  const db = readDB();
  const ticketIndex = db.tickets.findIndex(t => t.id === req.params.id);

  if (ticketIndex === -1) {
    return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
  }

  if (estado) db.tickets[ticketIndex].estado = estado;
  if (tecnicoAsignado) db.tickets[ticketIndex].tecnicoAsignado = tecnicoAsignado;
  db.tickets[ticketIndex].fechaActualizacion = new Date().toISOString();

  writeDB(db);
  return res.json({ success: true, ticket: db.tickets[ticketIndex] });
});

app.post('/api/tickets/:id/mensajes', (req, res) => {
  const { autor, rol, mensaje } = req.body;
  const db = readDB();
  const ticketIndex = db.tickets.findIndex(t => t.id === req.params.id);

  if (ticketIndex === -1) {
    return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
  }

  const newMsg = {
    autor,
    rol,
    mensaje,
    fecha: new Date().toISOString()
  };

  db.tickets[ticketIndex].mensajes.push(newMsg);
  db.tickets[ticketIndex].fechaActualizacion = new Date().toISOString();

  writeDB(db);
  return res.json({ success: true, ticket: db.tickets[ticketIndex] });
});

/* ==========================================================================
   LICENSES ENDPOINTS
   ========================================================================== */
app.get('/api/licenses/catalog', (req, res) => {
  const db = readDB();
  return res.json({ success: true, catalog: db.licensesCatalog });
});

app.get('/api/licenses/active', (req, res) => {
  const { empresaId } = req.query;
  const db = readDB();
  let licenses = db.activeLicenses;
  if (empresaId) {
    licenses = licenses.filter(l => l.empresaId === empresaId);
  }
  return res.json({ success: true, licenses });
});

app.post('/api/licenses/request', (req, res) => {
  const { empresaId, empresaNombre, licenciaId, nombreLicencia, cantidad, notas } = req.body;
  const db = readDB();

  // Create ticket for license request
  const newTicket = {
    id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
    empresaId: empresaId || 'emp_1',
    empresaNombre: empresaNombre || 'TechCorp Logistics S.A.',
    titulo: `Solicitud de Licencia: ${nombreLicencia} (x${cantidad})`,
    descripcion: `Solicitud de adquisición/renovación de ${cantidad} unidades de ${nombreLicencia}. Notas: ${notas || 'Sin notas adicionales.'}`,
    categoria: 'Licencias',
    prioridad: 'media',
    estado: 'pendiente',
    tecnicoAsignado: 'Sin Asignar',
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
    mensajes: [
      {
        autor: empresaNombre || 'Cliente',
        rol: 'empresa',
        mensaje: `Solicitud formal de ${cantidad} licencias de ${nombreLicencia}.`,
        fecha: new Date().toISOString()
      }
    ]
  };

  db.tickets.unshift(newTicket);
  writeDB(db);

  return res.status(201).json({ success: true, message: 'Solicitud de licencia enviada exitosamente', ticket: newTicket });
});

/* ==========================================================================
   EQUIPMENT ENDPOINTS
   ========================================================================== */
app.get('/api/equipment', (req, res) => {
  const { empresaId } = req.query;
  const db = readDB();
  let equipment = db.equipment;
  if (empresaId) {
    equipment = equipment.filter(e => e.empresaId === empresaId);
  }
  return res.json({ success: true, equipment });
});

app.post('/api/equipment', (req, res) => {
  const { empresaId, codigoActivo, tipo, marcaModelo, ubicacion, especificaciones } = req.body;
  const db = readDB();

  const newEquip = {
    id: `eq_${Date.now()}`,
    empresaId: empresaId || 'emp_1',
    codigoActivo: codigoActivo || `EQ-HW-${Math.floor(100 + Math.random() * 900)}`,
    tipo,
    marcaModelo,
    ubicacion,
    especificaciones,
    ultimoMantenimiento: new Date().toISOString().split('T')[0],
    proximoMantenimiento: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estado: 'Operativo'
  };

  db.equipment.push(newEquip);
  writeDB(db);

  return res.status(201).json({ success: true, equipment: newEquip });
});

/* ==========================================================================
   STATS DASHBOARD ENDPOINT
   ========================================================================== */
app.get('/api/stats', (req, res) => {
  const db = readDB();
  const tickets = db.tickets;

  const stats = {
    totalTickets: tickets.length,
    pendientes: tickets.filter(t => t.estado === 'pendiente').length,
    enProceso: tickets.filter(t => t.estado === 'en_proceso').length,
    resueltos: tickets.filter(t => t.estado === 'resuelto').length,
    criticos: tickets.filter(t => t.prioridad === 'critico' && t.estado !== 'resuelto').length,
    totalEquipos: db.equipment.length,
    totalLicenciasActivas: db.activeLicenses.reduce((acc, curr) => acc + curr.cantidad, 0)
  };

  return res.json({ success: true, stats });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Servidor Backend Soporte Técnico corriendo en:`);
  console.log(` http://localhost:${PORT}`);
  console.log(`====================================================`);
});
