// controllers/contact.controller.js – SCR-PUB-04 Contact/Request Access form
const ContactRequest = require('../models/ContactRequest');
const ENUMS          = require('../constants/enums');

// POST /api/contact  [Public]
exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, organizationName, role, message } = req.body;

    if (!name || !email || !organizationName)
      return res.status(400).json({ success: false, message: 'name, email, and organizationName are required' });

    const request = await ContactRequest.create({ name, email, organizationName, role, message });
    res.status(201).json({ success: true, message: 'Your request has been received. We will be in touch soon.', data: { _id: request._id } });
  } catch (err) { next(err); }
};

// GET /api/contact  [admin]
exports.listContactRequests = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      if (!ENUMS.contactRequestStatus.includes(req.query.status))
        return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${ENUMS.contactRequestStatus.join(', ')}` });
      filter.status = req.query.status;
    }

    const requests = await ContactRequest.find(filter).sort({ submittedAt: -1 });
    res.json({ success: true, count: requests.length, data: requests });
  } catch (err) { next(err); }
};

// PATCH /api/contact/:id/status  [admin] – update contact request status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!ENUMS.contactRequestStatus.includes(status))
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${ENUMS.contactRequestStatus.join(', ')}` });

    const request = await ContactRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!request) return res.status(404).json({ success: false, message: 'Contact request not found' });

    res.json({ success: true, data: request });
  } catch (err) { next(err); }
};
