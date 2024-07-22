const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || '0a66b55b76bab0e1bc56208dc1e1fde9e5fc199ea7a93545ce012ee283253702';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// User schema and model
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
});
const User = mongoose.model('User', userSchema);

// Product schema and model
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    image: String
});
const Product = mongoose.model('Product', productSchema);

// Cart schema and model
const cartSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number
    }]
});
const Cart = mongoose.model('Cart', cartSchema);

// Signup route
app.post('/api/users/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name) {
        return res.status(401).json({ error: 'Name cannot be empty' });
    }
    // Check if name is empty
    try {
        // Check if email is already in use
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(401).json({ error: 'Email already in use' });
        }
    

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error registering user' });
    }
});
// Login route
app.post('/api/users/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Fetch products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching products' });
    }
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Add product to cart
app.post('/api/cart/add', authenticateToken, async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.userId;
    try {
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += 1;
        } else {
            cart.items.push({ productId, quantity: 1 });
        }

        await cart.save();
        res.json({ message: 'Product added to cart' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error adding to cart' });
    }
});

// Remove product from cart
app.delete('/api/cart/remove/:cartItemId', authenticateToken, async (req, res) => {
    const { cartItemId } = req.params;
    const userId = req.user.userId;
    try {
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item._id.toString() === cartItemId);
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        cart.items.splice(itemIndex, 1);
        await cart.save();
        res.json({ message: 'Product removed from cart' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error removing from cart' });
    }
});

// Fetch cart items
app.get('/api/cart', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    try {
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        res.json(cart);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching cart' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
