require('dotenv').config();
const express = require('express');
const cors = require('cors');

require('./db'); // ensures schema is created

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const applicationRoutes = require('./routes/applications');
const leaseRoutes = require('./routes/leases');
const maintenanceRoutes = require('./routes/maintenance');
const notificationRoutes = require('./routes/notifications');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'RentalHub API' }));

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`RentalHub API running on http://localhost:${PORT}`));
