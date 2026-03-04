const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables (.env.local takes precedence)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '.env.local'), override: true });

// Initialize express app
const app = express();

// Admin auth middleware
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const validToken = 'admin_authenticated';
  if (token === validToken) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Unauthorized' });
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Tourism Treasure API',
    status: 'Server is running successfully!',
    connected: true
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    connected: true
  });
});

// Ping route for connection testing
app.get('/api/ping', (req, res) => {
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    backend: 'connected'
  });
});

// Admin login (username/password only)
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const validUser = process.env.ADMIN_USERNAME || 'admin';
  const validPass = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === validUser && password === validPass) {
    return res.json({
      success: true,
      token: 'admin_authenticated',
      message: 'Login successful'
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid username or password'
  });
});

// Admin bookings (protected)
app.get('/api/admin/bookings', adminAuth, async (req, res) => {
  try {
    const { db } = require('./config/firebase');
    const snapshot = await db.collection('bookings').get();
    const bookings = snapshot.docs.map((d) => {
      const doc = d.data();
      let createdAt = doc.createdAt;
      if (createdAt && typeof createdAt.toDate === 'function') {
        createdAt = { seconds: Math.floor(createdAt.toDate().getTime() / 1000) };
      } else if (createdAt && (createdAt.seconds != null || createdAt._seconds != null)) {
        createdAt = { seconds: createdAt.seconds ?? createdAt._seconds };
      }
      return { id: d.id, ...doc, createdAt };
    });
    bookings.sort((a, b) => {
      const aSec = a.createdAt?.seconds ?? 0;
      const bSec = b.createdAt?.seconds ?? 0;
      return bSec - aSec;
    });
    return res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('Admin bookings error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch bookings',
    });
  }
});

app.patch('/api/admin/bookings/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const { db } = require('./config/firebase');
    const ref = db.collection('bookings').doc(id);
    await ref.update({ status });
    return res.json({ success: true, message: 'Updated' });
  } catch (err) {
    console.error('Admin update booking error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to update booking',
    });
  }
});

// Sample API routes
app.get('/api/destinations', (req, res) => {
  res.json({
    message: 'Get all destinations',
    data: [] 
  });
});

app.get('/api/tours', (req, res) => {
  res.json({
    message: 'Get all tours',
    data: [] 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}`);
});
