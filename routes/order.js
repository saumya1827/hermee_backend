const router = require('express').Router();
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if(!token) return res.status(401).json({ error: 'No token' });
  jwt.verify(token.split(' ')[1], process.env.JWT_SECRET, (err, decoded) => {
    if(err) return res.status(401).json({ error: 'Invalid token' });
    req.userId = decoded.id;
    next();
  });
};

// Create order (mock checkout)
router.post('/', verifyToken, async (req, res) => {
  const { items, total } = req.body;
  const order = new Order({ userId: req.userId, items, total });
  await order.save();
  res.json({ message: 'Order placed', order });
});

// Get user orders
router.get('/', verifyToken, async (req, res) => {
  const orders = await Order.find({ userId: req.userId });
  res.json(orders);
});

module.exports = router;
