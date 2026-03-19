const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

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

// Packages routes
// Public route to get all active packages
app.get('/api/packages', async (req, res) => {
  try {
    const { db } = require('./config/firebase');
    const snapshot = await db.collection('packages').get();
    const packages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // We send all packages (even deleted ones) so the frontend can remove 
    // static packages that have been soft-deleted from its local state map.
    return res.json({ success: true, data: packages });
  } catch (err) {
    console.error('Fetch packages error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch packages' });
  }
});

// Admin routes for packages
app.get('/api/admin/packages', adminAuth, async (req, res) => {
  try {
    const { db } = require('./config/firebase');
    const snapshot = await db.collection('packages').get();
    const packages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Admin sees ALL packages, including isDeleted: true
    return res.json({ success: true, data: packages });
  } catch (err) {
    console.error('Admin fetch packages error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch packages' });
  }
});

app.post('/api/admin/packages', adminAuth, async (req, res) => {
  try {
    const { db } = require('./config/firebase');
    const packageData = req.body;

    // Add timestamp
    const dataToSave = {
      ...packageData,
      createdAt: require('firebase-admin').firestore.FieldValue.serverTimestamp(),
      updatedAt: require('firebase-admin').firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('packages').add(dataToSave);
    return res.json({ success: true, message: 'Package created successfully', id: docRef.id });
  } catch (err) {
    console.error('Create package error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create package' });
  }
});

app.put('/api/admin/packages/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { db } = require('./config/firebase');
    const packageData = req.body;

    // Add timestamp
    const dataToUpdate = {
      ...packageData,
      updatedAt: require('firebase-admin').firestore.FieldValue.serverTimestamp()
    };

    const docRef = db.collection('packages').doc(id);
    await docRef.set(dataToUpdate, { merge: true });

    return res.json({ success: true, message: 'Package updated successfully' });
  } catch (err) {
    console.error('Update package error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update package' });
  }
});

app.delete('/api/admin/packages/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { db } = require('./config/firebase');

    // We do a soft delete so we can hide static packages
    const docRef = db.collection('packages').doc(id);
    await docRef.set({
      isDeleted: true,
      updatedAt: require('firebase-admin').firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return res.json({ success: true, message: 'Package deleted successfully' });
  } catch (err) {
    console.error('Delete package error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete package' });
  }
});

// Chatbot AI route
app.post('/api/chat', async (req, res) => {
  try {
    const { message, isRecommendation } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Fetch active packages
    const { db } = require('./config/firebase');
    const snapshot = await db.collection('packages').get();
    const packages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(p => !p.isDeleted);

    const tourInfo = packages.map(p => `- ${p.title}: ${p.duration} for $${p.price}. Type: ${p.type || 'General'}. ${p.description}`).join('\n');

    let systemPrompt = `You are a helpful travel assistant for "Exclusive Travels". 
Here is a list of our currently available tour packages:
${tourInfo}`;

    if (isRecommendation) {
        systemPrompt += `\n\nThe user has answered a few questions about their preferences (Experience, Budget, and Duration). 
Based strictly on the available tour packages provided above, recommend the single best tour that matches their criteria. 
Explain why this tour is a great fit for their preferences. Keep your answer friendly, extremely concise, and do not invent any packages that are not on the list. If no package perfectly matches, suggest the closest available option and explain why.`;
    } else {
        systemPrompt += `\n\nAnswer the user's question, recommend tours when appropriate based on the list above, and keep your answer concise and friendly. If they ask about something we do not offer, politely let them know and suggest what we do have. Do not make up any packages that aren't on the list.`;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return res.json({ success: true, reply: response.text });
  } catch (err) {
    console.error('Chat error:', err);
    
    // Check for rate limit or overloaded API errors
    if (err.status === 503) {
        return res.status(503).json({ 
            success: false, 
            message: 'Our travel AI is currently helping many customers. Please try again in a few moments!' 
        });
    }

    return res.status(500).json({ success: false, message: 'Failed to process chat', error: err.message });
  }
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
