const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// Search & Discovery (public) - filters: city, minPrice, maxPrice, bedrooms, propertyType, q
router.get('/', (req, res) => {
  const { city, minPrice, maxPrice, bedrooms, propertyType, q } = req.query;
  let sql = `SELECT p.*, u.name AS owner_name FROM properties p JOIN users u ON u.id = p.owner_id WHERE p.status = 'available'`;
  const params = [];

  if (city) { sql += ' AND p.city LIKE ?'; params.push(`%${city}%`); }
  if (minPrice) { sql += ' AND p.price >= ?'; params.push(Number(minPrice)); }
  if (maxPrice) { sql += ' AND p.price <= ?'; params.push(Number(maxPrice)); }
  if (bedrooms) { sql += ' AND p.bedrooms >= ?'; params.push(Number(bedrooms)); }
  if (propertyType) { sql += ' AND p.property_type = ?'; params.push(propertyType); }
  if (q) { sql += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.address LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }

  sql += ' ORDER BY p.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json({ properties: rows });
});

// Owner's own listings (any status) - must be before /:id
router.get('/owner/mine', authRequired, requireRole('owner'), (req, res) => {
  const rows = db.prepare('SELECT * FROM properties WHERE owner_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ properties: rows });
});

router.get('/:id', (req, res) => {
  const property = db.prepare(
    `SELECT p.*, u.name AS owner_name, u.email AS owner_email FROM properties p JOIN users u ON u.id = p.owner_id WHERE p.id = ?`
  ).get(req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  res.json({ property });
});

router.post('/', authRequired, requireRole('owner'), (req, res) => {
  const { title, description, propertyType, address, city, price, bedrooms, bathrooms, areaSqft, latitude, longitude, imageUrl } = req.body;
  if (!title || !address || !city || !price) {
    return res.status(400).json({ error: 'title, address, city and price are required' });
  }
  const id = uuidv4();
  db.prepare(`
    INSERT INTO properties (id, owner_id, title, description, property_type, address, city, price, bedrooms, bathrooms, area_sqft, latitude, longitude, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, title, description || '', propertyType || 'apartment', address, city, price, bedrooms || 1, bathrooms || 1, areaSqft || null, latitude || null, longitude || null, imageUrl || null);

  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
  res.status(201).json({ property });
});

router.put('/:id', authRequired, requireRole('owner'), (req, res) => {
  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  if (property.owner_id !== req.user.id) return res.status(403).json({ error: 'Not your property' });

  const fields = ['title', 'description', 'property_type', 'address', 'city', 'price', 'bedrooms', 'bathrooms', 'area_sqft', 'latitude', 'longitude', 'image_url', 'status'];
  const body = req.body;
  const map = {
    title: body.title, description: body.description, property_type: body.propertyType,
    address: body.address, city: body.city, price: body.price, bedrooms: body.bedrooms,
    bathrooms: body.bathrooms, area_sqft: body.areaSqft, latitude: body.latitude,
    longitude: body.longitude, image_url: body.imageUrl, status: body.status
  };
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (map[f] !== undefined) { updates.push(`${f} = ?`); values.push(map[f]); }
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id);
  db.prepare(`UPDATE properties SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  res.json({ property: updated });
});

router.delete('/:id', authRequired, requireRole('owner'), (req, res) => {
  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  if (property.owner_id !== req.user.id) return res.status(403).json({ error: 'Not your property' });
  db.prepare('DELETE FROM properties WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
