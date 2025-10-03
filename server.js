import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'hermee';

// --- MongoDB connection (only once!) ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// --- Middleware ---
app.use(cors({
  origin: 'http://localhost:5176',
  credentials: true
}));
app.use(express.json());

// --- Schemas ---
const userSchema = new mongoose.Schema({
  name: String,
  email: String
});
const orderSchema = new mongoose.Schema({
  userId: String,
  items: Array,
  total: Number,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);

// --- Auth middleware ---
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// --- Routes ---
// Login / Signup
app.post('/api/auth/login', async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) return res.status(400).json({ error: "Email & Name required" });

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, name }); // auto signup
  }

  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ user, token });
});

// Orders
app.post('/api/orders', authMiddleware, async (req, res) => {
  const { items, total } = req.body;
  if (!items || !total) return res.status(400).json({ error: "Items and total required" });

  const order = await Order.create({
    userId: req.user.id,
    items,
    total
  });

  res.json({ message: "Order placed successfully", order });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: "Backend is working" });
});

// --- Start server ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
