import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const dbName = process.env.DB_NAME || 'nuevo_proyecto';
const client = new pg.Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: 'postgres'
});

async function createDatabase() {
  await client.connect();
  const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);

  if (exists.rowCount === 0) {
    await client.query(`CREATE DATABASE "${dbName.replaceAll('"', '""')}"`);
    console.log(`Base creada: ${dbName}`);
  } else {
    console.log(`La base ya existe: ${dbName}`);
  }

  await client.end();
}

createDatabase().catch(async (error) => {
  console.error('No se pudo crear la base:', error.message);
  await client.end().catch(() => {});
  process.exit(1);
});
