// controllers/donations.controller.js
// Manual donation flow (text-only, no file uploads).
// Donors submit a payment confirmation; admins review and acknowledge.
const Donation    = require('../models/Donation');
const User        = require('../models/User');
const logActivity = require('../helpers/activityLogger');
const sendNotification = require('../helpers/notificationSender');

// Build the donor's unique reference code: SYN- + last 6 of their user id (uppercased)
const referenceFor = (donorId) => 'SYN-' + String(donorId).slice(-6).toUpperCase();

// GET /api/donations/reference  [donor self]
// Returns the donor's reference code to display on the donate page.
exports.getMyReference = async (req, res, next) => {
  try {
    res.json({ success: true, data: { referenceCode: referenceFor(req.user._id) } });
  } catch (err) { next(err); }
};

// POST /api/donations  [donor]
// Donor submits a payment confirmation after paying offline.
exports.submitDonation = async (req, res, next) => {
  try {
    const { amount, datePaid, senderName, note } = req.body;
    if (!amount || !datePaid || !senderName)
      return res.status(400).json({ success: false, message: 'amount, datePaid, and senderName are required' });
    if (Number(amount) <= 0)
      return res.status(400).json({ success: false, message: 'amount must be greater than 0' });

    const donation = await Donation.create({
      donorId:       String(req.user._id),
      referenceCode: referenceFor(req.user._id),
      amount:        Number(amount),
      datePaid:      new Date(datePaid),
      senderName:    senderName.trim(),
      note:          note || '',
      status:        'pending',
    });

    res.status(201).json({ success: true, message: 'Donation confirmation received. An administrator will verify and acknowledge it.', data: donation });
  } catch (err) { next(err); }
};

// GET /api/donations/mine  [donor self]
exports.getMyDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find({ donorId: String(req.user._id) }).sort({ createdAt: -1 });
    const totalAcknowledged = donations
      .filter(d => d.status === 'acknowledged')
      .reduce((s, d) => s + (d.amount || 0), 0);
    res.json({ success: true, count: donations.length, totalAcknowledged, data: donations });
  } catch (err) { next(err); }
};

// GET /api/donations  [admin]
// Optional filter: ?status=pending|acknowledged
exports.listDonations = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      if (!['pending', 'acknowledged'].includes(req.query.status))
        return res.status(400).json({ success: false, message: 'Invalid status filter' });
      filter.status = req.query.status;
    }
    const donations = await Donation.find(filter).sort({ createdAt: -1 });
    // Attach donor email for admin display (donor PII is fine for admin)
    const withEmail = await Promise.all(donations.map(async (d) => {
      let donorEmail = d.donorId;
      try { const u = await User.findById(d.donorId).select('email'); if (u) donorEmail = u.email; } catch (e) {}
      return { ...d.toObject(), donorEmail };
    }));
    const totalAcknowledged = donations
      .filter(d => d.status === 'acknowledged')
      .reduce((s, d) => s + (d.amount || 0), 0);
    const pendingCount = donations.filter(d => d.status === 'pending').length;
    res.json({ success: true, count: donations.length, pendingCount, totalAcknowledged, data: withEmail });
  } catch (err) { next(err); }
};

// PATCH /api/donations/:id/acknowledge  [admin]
exports.acknowledgeDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });
    if (donation.status === 'acknowledged')
      return res.status(400).json({ success: false, message: 'This donation is already acknowledged' });

    donation.status         = 'acknowledged';
    donation.acknowledgedBy = String(req.user._id);
    donation.acknowledgedAt = new Date();
    if (req.body.projectId) donation.projectId = req.body.projectId;
    await donation.save();

    // Notify the donor in-app that their donation was acknowledged
    await sendNotification({
      recipientId:      donation.donorId,
      notificationType: 'donor_milestone_alert',
      referenceType:    'project',
      referenceId:      donation.projectId || String(donation._id),
      message:          `Your donation (${donation.referenceCode}) has been received and acknowledged. Thank you for your support.`,
    });

    await logActivity({
      activityType: 'donor_linked',
      actorId:      String(req.user._id),
      targetType:   'project',
      targetId:     donation.projectId || String(donation._id),
      description:  `${req.user.email} acknowledged donation ${donation.referenceCode}`,
    });

    res.json({ success: true, message: 'Donation acknowledged', data: donation });
  } catch (err) { next(err); }
};
