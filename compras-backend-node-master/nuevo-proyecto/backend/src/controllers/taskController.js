import Task from '../models/Task.js';

export async function listTasks(req, res) {
  const tasks = await Task.findAll({ order: [['id', 'ASC']] });
  res.json(tasks);
}

export async function createTask(req, res) {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'El titulo es obligatorio.' });
  }

  const task = await Task.create({ title: title.trim() });
  return res.status(201).json(task);
}

export async function toggleTask(req, res) {
  const task = await Task.findByPk(req.params.id);

  if (!task) {
    return res.status(404).json({ message: 'Tarea no encontrada.' });
  }

  task.completed = !task.completed;
  await task.save();

  return res.json(task);
}
