import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import './models/Task.js';
import './models/Printer.js';
import './models/Toner.js';
import './models/TonerMovement.js';
import './models/User.js';
import { seedAdmin } from './scripts/seedAdmin.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Backend funcionando' });
});

app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);

async function start() {
  await sequelize.authenticate();
  await sequelize.sync();
  await seedAdmin();

  app.listen(port, () => {
    console.log(`API lista en http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error.message);
  process.exit(1);
});
