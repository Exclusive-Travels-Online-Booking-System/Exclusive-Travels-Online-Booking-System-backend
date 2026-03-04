# Firebase Setup for Tourism Treasure Backend

## What's Been Configured

### 1. Firebase Admin SDK
- Installed `firebase-admin` package
- Created `config/firebase.js` for Firebase initialization
- Configured environment variables in `.env`

### 2. Firebase Configuration
Your Firebase project details:
- **Project ID:** exclusive-travels-85070
- **Storage Bucket:** exclusive-travels-85070.firebasestorage.app
- **App ID:** 1:282679890286:web:87a0dcd4476c770ab8317f

### 3. Available Firebase Services
The backend now has access to:
- **Firestore Database** (`db`) - For storing and querying data
- **Firebase Storage** (`storage`) - For file uploads
- **Firebase Auth** (`auth`) - For user authentication

## How to Use Firebase in Your Routes

```javascript
const { db, storage, auth } = require('./config/firebase');

// Example: Get data from Firestore
app.get('/api/tours', async (req, res) => {
  try {
    const snapshot = await db.collection('tours').get();
    const tours = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ tours });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Example: Upload file to Storage
app.post('/api/upload', async (req, res) => {
  try {
    const bucket = storage.bucket();
    const file = bucket.file('filename.jpg');
    // Upload logic here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Important Notes

### Service Account (For Production)
Currently using default credentials. For production, you should:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Generate a new private key
3. Download the JSON file
4. Add it to your project (don't commit to git!)
5. Update `config/firebase.js` to use the service account:

```javascript
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "exclusive-travels-85070.firebasestorage.app"
});
```

## Restart the Server

If you need to restart the backend:

1. **Stop the current server:** Press `Ctrl + C` in the terminal
2. **Start fresh:** Run `npm run dev`

If you get port errors:
```powershell
# Find what's using the port
netstat -ano | findstr :3500

# Kill the process (replace PID with the actual process ID)
taskkill /F /PID <PID>

# Then start the server again
npm run dev
```

## Testing Firebase Connection

Visit `http://localhost:3500/health` - you should see:
```json
{
  "status": "OK",
  "timestamp": "2026-02-07T...",
  "firebase": "Active"
}
```

## Next Steps

1. Set up Firestore collections in Firebase Console
2. Configure Firebase Storage rules
3. Set up Firebase Authentication methods
4. Create API routes that use Firebase services
