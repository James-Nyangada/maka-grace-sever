const Invoice = require('../models/Invoice');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "Maka Grace Travel <info@makagracetravel.co.ke>";

// Create invoice
exports.createInvoice = async (req, res) => {
  try {
    const { invoiceNumber, customerName, packageName } = req.body;
    
    // Check if invoice already exists
    let query = { invoiceNumber };
    if (customerName && packageName) {
      // Escape customer name for regex
      const escapedName = customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query = {
        $or: [
          { invoiceNumber },
          { 
            customerName: { $regex: new RegExp(`^${escapedName}$`, 'i') }, 
            packageName: packageName 
          }
        ]
      }
    }
    
    const existing = await Invoice.findOne(query);
    
    if (existing) {
      return res.status(400).json({ error: 'Invoice already generated for this number or customer/package' });
    }

    const invoice = await Invoice.create(req.body);
    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.status(200).json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send invoice via email
exports.sendInvoiceEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { pdfBase64, email, subject, message } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const targetEmail = email || invoice.customerEmail;
    if (!targetEmail) return res.status(400).json({ error: 'Customer email not provided' });

    // Clean base64 string — jsPDF outputs: data:application/pdf;filename=generated.pdf;base64,...
    const base64Data = pdfBase64.includes('base64,') 
      ? pdfBase64.split('base64,')[1] 
      : pdfBase64;

    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: targetEmail,
      subject: subject || `Your Booking Invoice - ${invoice.invoiceNumber} (Maka Grace Travel)`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px;">Booking Invoice</h2>
          <p>Dear <strong>${invoice.customerName}</strong>,</p>
          <p>Thank you for choosing Maka Grace Travel! Please find attached your booking invoice (<strong>${invoice.invoiceNumber}</strong>) for the <strong>${invoice.packageName || 'travel package'}</strong>.</p>
          ${invoice.depositAmount ? `<p style="background-color: #f8f9fa; padding: 10px; border-left: 4px solid #3b82f6;">A deposit of <strong>${invoice.currency} ${invoice.depositAmount}</strong> (${invoice.depositPercentage}%) is required to secure your booking before the travel date.</p>` : ''}
          <p>${message || 'We have attached your detailed PDF invoice to this email.'}</p>
          <p>If you have any questions or require further assistance, please do not hesitate to contact us.</p>
          <br/>
          <p style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 15px; font-size: 0.9em;">
            Best regards,<br/>
            <strong>Maka Grace Travel Team</strong><br/>
            <a href="mailto:info@makagracetravel.co.ke" style="color: #3b82f6; text-decoration: none;">info@makagracetravel.co.ke</a>
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Invoice_${invoice.invoiceNumber}.pdf`,
          content: Buffer.from(base64Data, 'base64'),
        },
      ],
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: 'Invoice sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
