import { Router } from 'express';
import {
  createMovement,
  createPrinter,
  createToner,
  dashboard,
  deletePrinter,
  deleteToner,
  report,
  updatePrinter,
  updateToner
} from '../controllers/inventoryController.js';

const router = Router();

router.get('/dashboard', dashboard);
router.get('/reports', report);
router.post('/printers', createPrinter);
router.put('/printers/:id', updatePrinter);
router.delete('/printers/:id', deletePrinter);
router.post('/toners', createToner);
router.put('/toners/:id', updateToner);
router.delete('/toners/:id', deleteToner);
router.post('/movements', createMovement);

export default router;
