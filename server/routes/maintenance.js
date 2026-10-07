const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');
const { notify } = require('../utils/notify');

const router = express.Router();

// Renter: submit a maintenance request tied to their active lease
router.post('/', authRequired, requireRole('renter'), (req, res) => {
  const { leaseId, title, description, priority } = req.body;
  if (!leaseId || !title) return res.status(400).json({ error: 'leaseId and title are required' });

  const lease = db.prepare('SELECT * FROM leases WHERE id = ?').get(leaseId);
  if (!lease) return res.status(404).json({ error: 'Lease not found' });
  if (lease.renter_id !== req.user.id) return res.status(403).json({ error: 'Not your lease' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO maintenance_requests (id, lease_id, property_id, renter_id, title, description, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, leaseId, lease.property_id, req.user.id, title, description || '', priority || 'normal');

  notify(lease.owner_id, `New maintenance request: "${title}"`);
  const request = db.prepare('SELECT * FROM maintenance_requests WHERE id = ?').get(id);
  res.status(201).json({ request });
});

router.get('/mine', authRequired, (req, res) => {
  let rows;
  if (req.user.role === 'renter') {
    rows = db.prepare(`
      SELECT m.*, p.title AS property_title FROM maintenance_requests m
      JOIN properties p ON p.id = m.property_id WHERE m.renter_id = ? ORDER BY m.created_at DESC
    `).all(req.user.id);
  } else {
    rows = db.prepare(`
      SELECT m.*, p.title AS property_title, u.name AS renter_name FROM maintenance_requests m
      JOIN properties p ON p.id = m.property_id
      JOIN users u ON u.id = m.renter_id
      WHERE p.owner_id = ? ORDER BY m.created_at DESC
    `).all(req.user.id);
  }
  res.json({ requests: rows });
});

// Owner: update status
router.put('/:id', authRequired, requireRole('owner'), (req, res) => {
  const { status } = req.body;
  if (!['open', 'in_progress', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const request = db.prepare(`
    SELECT m.*, p.owner_id, p.title AS property_title FROM maintenance_requests m
    JOIN properties p ON p.id = m.property_id WHERE m.id = ?
  `).get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.owner_id !== req.user.id) return res.status(403).json({ error: 'Not your property' });

  db.prepare('UPDATE maintenance_requests SET status = ? WHERE id = ?').run(status, req.params.id);
  notify(request.renter_id, `Maintenance request "${request.title}" status updated to ${status}`);

  const updated = db.prepare('SELECT * FROM maintenance_requests WHERE id = ?').get(req.params.id);
  res.json({ request: updated });
});

module.exports = router;
