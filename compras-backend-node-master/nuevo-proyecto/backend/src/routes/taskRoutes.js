import { Router } from 'express';
import { createTask, listTasks, toggleTask } from '../controllers/taskController.js';

const router = Router();

router.get('/', listTasks);
router.post('/', createTask);
router.patch('/:id/toggle', toggleTask);

export default router;
