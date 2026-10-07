const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');
const { notify } = require('../utils/notify');

const router = express.Router();

// Renter applies for a property
router.post('/', authRequired, requireRole('renter'), (req, res) => {
  const { propertyId, message, contactPhone } = req.body;
  if (!propertyId) return res.status(400).json({ error: 'propertyId is required' });

  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  if (property.status !== 'available') return res.status(400).json({ error: 'Property is not available' });

  const existing = db.prepare(
    `SELECT id FROM applications WHERE property_id = ? AND renter_id = ? AND status = 'pending'`
  ).get(propertyId, req.user.id);
  if (existing) return res.status(409).json({ error: 'You already have a pending application for this property' });

  const id = uuidv4();
  db.prepare(
    `INSERT INTO applications (id, property_id, renter_id, message, contact_phone) VALUES (?, ?, ?, ?, ?)`
  ).run(id, propertyId, req.user.id, message || '', contactPhone || null);

  notify(property.owner_id, `New application received for "${property.title}"`);

  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  res.status(201).json({ application });
});

// Renter: my applications
router.get('/mine', authRequired, requireRole('renter'), (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, p.title AS property_title, p.city, p.price, p.image_url,
           u.name AS owner_name, u.email AS owner_email, u.phone AS owner_phone
    FROM applications a
    JOIN properties p ON p.id = a.property_id
    JOIN users u ON u.id = p.owner_id
    WHERE a.renter_id = ? ORDER BY a.created_at DESC
  `).all(req.user.id);
  res.json({ applications: rows });
});

// Owner: applications received on their properties
router.get('/owner', authRequired, requireRole('owner'), (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, p.title AS property_title, u.name AS renter_name, u.email AS renter_email, u.phone AS renter_profile_phone
    FROM applications a
    JOIN properties p ON p.id = a.property_id
    JOIN users u ON u.id = a.renter_id
    WHERE p.owner_id = ? ORDER BY a.created_at DESC
  `).all(req.user.id);
  res.json({ applications: rows });
});

// Owner: approve or reject an application
router.put('/:id', authRequired, requireRole('owner'), (req, res) => {
  const { status, rentAmount, startDate, endDate } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
  }

  const application = db.prepare(`
    SELECT a.*, p.owner_id, p.title AS property_title, p.price
    FROM applications a JOIN properties p ON p.id = a.property_id
    WHERE a.id = ?
  `).get(req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });
  if (application.owner_id !== req.user.id) return res.status(403).json({ error: 'Not your property' });
  if (application.status !== 'pending') return res.status(400).json({ error: 'Application already decided' });

  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.id);

  let lease = null;
  if (status === 'approved') {
    const leaseId = uuidv4();
    const rent = rentAmount || application.price;
    const start = startDate || new Date().toISOString().slice(0, 10);
    db.prepare(`
      INSERT INTO leases (id, property_id, application_id, renter_id, owner_id, start_date, end_date, rent_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(leaseId, application.property_id, application.id, application.renter_id, req.user.id, start, endDate || null, rent);

    db.prepare(`UPDATE properties SET status = 'rented' WHERE id = ?`).run(application.property_id);

    // reject other pending applications for this property
    db.prepare(`UPDATE applications SET status = 'rejected' WHERE property_id = ? AND id != ? AND status = 'pending'`)
      .run(application.property_id, application.id);

    lease = db.prepare('SELECT * FROM leases WHERE id = ?').get(leaseId);
    notify(application.renter_id, `Your application for "${application.property_title}" was approved! Lease created.`);
  } else {
    notify(application.renter_id, `Your application for "${application.property_title}" was rejected.`);
  }

  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  res.json({ application: updated, lease });
});

module.exports = router;
