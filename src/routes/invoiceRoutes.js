const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const requireAuth = require('../middleware/authMiddleware');

router.post('/', requireAuth, invoiceController.createInvoice);
router.get('/', requireAuth, invoiceController.getAllInvoices);
router.get('/:id', requireAuth, invoiceController.getInvoiceById);
router.put('/:id', requireAuth, invoiceController.updateInvoice);
router.delete('/:id', requireAuth, invoiceController.deleteInvoice);
router.post('/:id/email', requireAuth, invoiceController.sendInvoiceEmail);

module.exports = router;
