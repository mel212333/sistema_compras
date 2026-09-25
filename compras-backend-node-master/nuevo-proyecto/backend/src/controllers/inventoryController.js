import { Op } from 'sequelize';
import Printer from '../models/Printer.js';
import Toner from '../models/Toner.js';
import TonerMovement from '../models/TonerMovement.js';

function required(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export async function dashboard(req, res) {
  const [printers, toners, movements] = await Promise.all([
    Printer.findAll({ order: [['name', 'ASC']] }),
    Toner.findAll({ include: [{ model: Printer, as: 'printer' }], order: [['code', 'ASC']] }),
    TonerMovement.findAll({
      include: [{ model: Toner, as: 'toner' }],
      order: [['periodDate', 'DESC'], ['id', 'DESC']],
      limit: 80
    })
  ]);

  res.json({ printers, toners, movements });
}

export async function createPrinter(req, res) {
  const { name, brand, model, location, serialNumber, status } = req.body;
  if (![name, brand, model, location].every(required)) {
    return res.status(400).json({ message: 'Nombre, marca, modelo y ubicacion son obligatorios.' });
  }

  const printer = await Printer.create({ name, brand, model, location, serialNumber, status });
  return res.status(201).json(printer);
}

export async function updatePrinter(req, res) {
  const printer = await Printer.findByPk(req.params.id);
  if (!printer) return res.status(404).json({ message: 'Impresora no encontrada.' });

  const { name, brand, model, location, serialNumber, status } = req.body;
  await printer.update({ name, brand, model, location, serialNumber, status });
  return res.json(printer);
}

export async function deletePrinter(req, res) {
  const printer = await Printer.findByPk(req.params.id);
  if (!printer) return res.status(404).json({ message: 'Impresora no encontrada.' });

  await printer.destroy();
  return res.status(204).send();
}

export async function createToner(req, res) {
  const { code, color, brand, model, stock = 0, minStock = 1, compatiblePrinter, printerId } = req.body;
  if (![code, color, brand, model].every(required)) {
    return res.status(400).json({ message: 'Codigo, color, marca y modelo son obligatorios.' });
  }

  const toner = await Toner.create({ code, color, brand, model, stock, minStock, compatiblePrinter, printerId: printerId || null });
  return res.status(201).json(toner);
}

export async function updateToner(req, res) {
  const toner = await Toner.findByPk(req.params.id);
  if (!toner) return res.status(404).json({ message: 'Toner no encontrado.' });

  const { code, color, brand, model, stock, minStock, compatiblePrinter, printerId } = req.body;
  await toner.update({ code, color, brand, model, stock, minStock, compatiblePrinter, printerId: printerId || null });
  return res.json(toner);
}

export async function deleteToner(req, res) {
  const toner = await Toner.findByPk(req.params.id);
  if (!toner) return res.status(404).json({ message: 'Toner no encontrado.' });

  await toner.destroy();
  return res.status(204).send();
}

export async function createMovement(req, res) {
  const { tonerId, type, quantity, reason, requestedBy, periodDate } = req.body;
  const numericQuantity = Number(quantity);
  if (!tonerId || !type || !numericQuantity || !reason || !periodDate) {
    return res.status(400).json({ message: 'Toner, tipo, cantidad, motivo y fecha son obligatorios.' });
  }

  const toner = await Toner.findByPk(tonerId);
  if (!toner) return res.status(404).json({ message: 'Toner no encontrado.' });

  let nextStock = toner.stock;
  if (type === 'Ingreso') nextStock += numericQuantity;
  if (type === 'Egreso') nextStock -= numericQuantity;
  if (type === 'Ajuste') nextStock = numericQuantity;

  if (nextStock < 0) {
    return res.status(400).json({ message: 'El egreso supera el stock disponible.' });
  }

  await toner.update({ stock: nextStock });
  const movement = await TonerMovement.create({ tonerId, type, quantity: numericQuantity, reason, requestedBy, periodDate });

  return res.status(201).json(movement);
}

export async function report(req, res) {
  const { period = 'monthly', from, to } = req.query;
  const now = new Date();
  const start = from ? new Date(from) : new Date(now);
  const end = to ? new Date(to) : new Date(now);

  if (!from) start.setDate(period === 'weekly' ? now.getDate() - 7 : now.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const movements = await TonerMovement.findAll({
    where: { periodDate: { [Op.between]: [start, end] } },
    include: [{ model: Toner, as: 'toner' }],
    order: [['periodDate', 'DESC'], ['id', 'DESC']]
  });

  const summary = movements.reduce((acc, item) => {
    acc.totalMovements += 1;
    acc[item.type] = (acc[item.type] || 0) + item.quantity;
    return acc;
  }, { totalMovements: 0, Ingreso: 0, Egreso: 0, Ajuste: 0 });

  res.json({ period, from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10), summary, movements });
}
