const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const { notify } = require('../utils/notify');

const router = express.Router();

// Leases visible to the current user (as renter or owner)
router.get('/mine', authRequired, (req, res) => {
  const col = req.user.role === 'owner' ? 'owner_id' : 'renter_id';
  const rows = db.prepare(`
    SELECT l.*, p.title AS property_title, p.city, p.address, p.image_url,
           ru.name AS renter_name, ru.email AS renter_email, ru.phone AS renter_phone,
           ou.name AS owner_name, ou.email AS owner_email, ou.phone AS owner_phone
    FROM leases l
    JOIN properties p ON p.id = l.property_id
    JOIN users ru ON ru.id = l.renter_id
    JOIN users ou ON ou.id = l.owner_id
    WHERE l.${col} = ?
    ORDER BY l.created_at DESC
  `).all(req.user.id);
  res.json({ leases: rows });
});

router.get('/:id', authRequired, (req, res) => {
  const lease = db.prepare('SELECT * FROM leases WHERE id = ?').get(req.params.id);
  if (!lease) return res.status(404).json({ error: 'Lease not found' });
  if (lease.owner_id !== req.user.id && lease.renter_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  const payments = db.prepare('SELECT * FROM rent_payments WHERE lease_id = ? ORDER BY due_date DESC').all(req.params.id);
  res.json({ lease, payments });
});

// Either party: end the lease (e.g. tenant is moving out). Releases the property back to available.
router.put('/:id/end', authRequired, (req, res) => {
  const lease = db.prepare('SELECT * FROM leases WHERE id = ?').get(req.params.id);
  if (!lease) return res.status(404).json({ error: 'Lease not found' });
  if (lease.owner_id !== req.user.id && lease.renter_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  if (lease.status !== 'active') return res.status(400).json({ error: 'This lease is already ended' });

  db.prepare(`UPDATE leases SET status = 'ended', end_date = ? WHERE id = ?`)
    .run(new Date().toISOString().slice(0, 10), lease.id);

  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(lease.property_id);
  if (property && property.status === 'rented') {
    db.prepare(`UPDATE properties SET status = 'available' WHERE id = ?`).run(lease.property_id);
  }

  const otherParty = req.user.id === lease.owner_id ? lease.renter_id : lease.owner_id;
  const who = req.user.id === lease.owner_id ? 'The owner' : 'The tenant';
  notify(otherParty, `${who} has ended the lease for "${property?.title || 'the property'}". The property is now available again.`);

  const updated = db.prepare('SELECT * FROM leases WHERE id = ?').get(req.params.id);
  res.json({ lease: updated });
});

// Owner: generate a new rent due entry for a lease
router.post('/:id/rent', authRequired, (req, res) => {
  const lease = db.prepare('SELECT * FROM leases WHERE id = ?').get(req.params.id);
  if (!lease) return res.status(404).json({ error: 'Lease not found' });
  if (lease.owner_id !== req.user.id) return res.status(403).json({ error: 'Only the owner can create rent dues' });

  const { dueDate, amount } = req.body;
  if (!dueDate) return res.status(400).json({ error: 'dueDate is required' });

  const id = uuidv4();
  db.prepare(`INSERT INTO rent_payments (id, lease_id, amount, due_date) VALUES (?, ?, ?, ?)`)
    .run(id, lease.id, amount || lease.rent_amount, dueDate);

  notify(lease.renter_id, `Rent of ${amount || lease.rent_amount} is due on ${dueDate}`);
  const payment = db.prepare('SELECT * FROM rent_payments WHERE id = ?').get(id);
  res.status(201).json({ payment });
});

// Renter or owner: mark a rent payment as paid
router.put('/rent/:paymentId/pay', authRequired, (req, res) => {
  const payment = db.prepare('SELECT * FROM rent_payments WHERE id = ?').get(req.params.paymentId);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  const lease = db.prepare('SELECT * FROM leases WHERE id = ?').get(payment.lease_id);
  if (lease.owner_id !== req.user.id && lease.renter_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  db.prepare(`UPDATE rent_payments SET status = 'paid', paid_date = ? WHERE id = ?`)
    .run(new Date().toISOString().slice(0, 10), req.params.paymentId);

  notify(lease.owner_id, `Rent payment received for lease at property.`);
  const updated = db.prepare('SELECT * FROM rent_payments WHERE id = ?').get(req.params.paymentId);
  res.json({ payment: updated });
});

module.exports = router;
