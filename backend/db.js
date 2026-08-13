// ============================================================================
// Conexión a PostgreSQL (Supabase) usando el pool de conexiones "pg"
// La cadena de conexión SIEMPRE se lee de variables de entorno, nunca
// se escribe aquí directamente.
// ============================================================================
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('ERROR: Falta la variable de entorno DATABASE_URL.');
  console.error('Copia backend/.env.example a backend/.env y completa tu connection string de Supabase.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase requiere SSL incluso en el pooler de sesión/transacción
  ssl: { rejectUnauthorized: false },
  max: 10,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

module.exports = pool;
