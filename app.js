const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const methodOverride = require('method-override');
const historyRoutes = require('./routes/History');
const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);
// Routes
const gameRoutes = require('./routes/gameRoutes');
const platfRoutes = require('./routes/platfRoutes');

// MongoDB Connection
const mongo_connect = process.env.MONGO_CONNECT; // Ensure this is set in your environment
mongoose.connect(mongo_connect, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch(err => {
    console.log("Error connecting to MongoDB", err);
  });

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: 'MadiyarMukhambet', 
  resave: false,
  saveUninitialized: false, 
  cookie: {
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax', 
    maxAge: 1000 * 60 * 60 * 24 
  }
}));
app.use(methodOverride('_method'));

// Static Files and View Engine
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Authentication Middleware
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) {
    return next();
  }
  res.status(403).send('Access denied. Admins only.');
}
app.use('/api/history', historyRoutes);
// Models
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

const Inventory = mongoose.model('Inventory', new mongoose.Schema({
  steamId: String,
  gameId: String,
  items: Array,
  timestamp: { type: Date, default: Date.now }
}));

const HistorySchema = new mongoose.Schema({
  userId: { type: String, required: false },
  api: { type: String, required: true },
  endpoint: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  request: { type: Object, required: true },
  response: { type: Object, required: true },
});
const History = mongoose.model('History', HistorySchema);

// Routes

// Index Route
app.get('/', (req, res) => {
  const user = req.session.user || null;
  res.render('index', { user, currentRoute: '/' });
});

// Login Routes
app.get('/login', (req, res) => {
  res.render('login', { error: req.session.error, user: req.session.user || null, currentRoute: '/login' });
  req.session.error = null;
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      req.session.error = 'Invalid username or password';
      return res.redirect('/login');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.session.error = 'Invalid username or password';
      return res.redirect('/login');
    }

    // Store the user's ID in the session
    req.session.user = { id: user._id, username: user.username, isAdmin: user.isAdmin };

    res.redirect('/');
  } catch (err) {
    console.error('Error during login:', err);
    req.session.error = 'An error occurred. Please try again.';
    res.redirect('/login');
  }
});

// Register Routes
app.get('/register', (req, res) => {
  res.render('register', { error: req.session.error, user: req.session.user || null, currentRoute: '/register' });
  req.session.error = null;
});

app.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    req.session.error = 'Passwords do not match';
    return res.redirect('/register');
  }
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      req.session.error = 'Username already exists';
      return res.redirect('/register');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      isAdmin: false,
    });
    await newUser.save();
    res.redirect('/login');
  } catch (err) {
    console.error('Error during registration:', err);
    req.session.error = 'An error occurred. Please try again.';
    res.redirect('/register');
  }
});

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).send('An error occurred during logout');
    }
    res.redirect('/login');
  });
});

app.get('/games', (req, res) => {
  res.render('games', { user: req.session.user, currentRoute: '/games' });
});

app.get('/Platforms', (req, res) => {
  res.render('Platforms', { user: req.session.user, currentRoute: '/Platforms' });
});

// Inventory Routes
app.get('/inventory', (req, res) => {
  res.render('inventory', { items: null, error: null, user: req.session.user, currentRoute: '/inventory' });
});

app.post('/inventory', async (req, res) => {
  const { steamId, game } = req.body;
  if (!steamId || !game) {
    return res.render('inventory', { items: null, error: 'Steam ID and game are required.', user: req.session.user });
  }
  try {
    const steamApiUrl = `https://steamcommunity.com/inventory/${steamId}/${game}/2`;
    const response = await axios.get(steamApiUrl);
    const { assets, descriptions } = response.data;
    const items = assets.map(asset => {
      const description = descriptions.find(desc => desc.classid === asset.classid);
      return {
        name: description.market_name,
        type: description.type,
        imageUrl: `https://steamcommunity-a.akamaihd.net/economy/image/${description.icon_url}`
      };
    });
    const inventory = new Inventory({ steamId, gameId: game, items });
    await inventory.save();
    res.render('inventory', { items, error: null, user: req.session.user });
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.render('inventory', { items: null, error: 'Failed to fetch inventory. Please check the Steam ID and try again.', user: req.session.user });
  }
});

// Discounts Route
app.get('/discounts', async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    const response = await axios.get('https://store.steampowered.com/api/featuredcategories?cc=kz');
    const { specials } = response.data;
    const users = await User.find();
    if (!specials || !specials.items) {
      return res.render('discounts', { discounts: [], error: 'No discounts found.', searchQuery, users, user: req.session.user, currentRoute: '/discounts' });
    }
    const discounts = specials.items
      .map(item => ({
        name: item.name,
        discountPercent: item.discount_percent,
        originalPrice: item.original_price / 100,
        finalPrice: item.final_price / 100,
        imageUrl: item.large_capsule_image,
      }))
      .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const historyEntry = new History({
      api: 'https://store.steampowered.com/api/featuredcategories',
      endpoint: '/discounts',
      timestamp: new Date(),
      request: { searchQuery },
      response: discounts,
    });
    await historyEntry.save();
    res.render('discounts', { discounts, error: null, searchQuery, users, user: req.session.user, currentRoute: '/discounts' });
  } catch (err) {
    console.error('Error fetching discounts:', err);
    res.render('discounts', { discounts: [], error: 'Failed to fetch discounts. Please try again later.', searchQuery: '', user: req.session.user, currentRoute: '/discounts' });
  }
});

// History Route
app.get('/history', async (req, res) => {
  const users = await User.find();
  try {
    const history = await History.find().sort({ timestamp: -1 }).limit(50);
    res.render('history', { history, user: req.session.user, users, currentRoute: '/history' });
  } catch (err) {
    console.error('Error fetching history:', err);
    res.render('history', { history: [], error: 'Failed to load history.', user: req.session.user, currentRoute: '/history' });
  }
});

// User Profile Routes
app.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).send('User not found');
    }

    res.render('profile', { user, currentRoute: '/profile' });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).send('Error fetching user profile');
  }
});

app.get('/profile/edit/:userID', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).send('User not found');
    }

    res.render('edit-profile', { user, currentRoute: '/profile/edit' });
  } catch (err) {
    console.error('Error fetching user profile for editing:', err);
    res.status(500).send('Error fetching user profile for editing');
  }
});

app.put('/profile/edit/:userID', isAuthenticated, async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).send('User not found');
    }

    user.username = username;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    user.updatedAt = Date.now();
    await user.save();

    res.redirect('/profile');
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).send('Error updating user profile');
  }
});

// Admin Routes
app.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.render('admin', { user: req.session.user, users, currentRoute: '/admin' });
  } catch (err) {
    console.error('Error retrieving users:', err);
    res.status(500).send('Error retrieving users');
  }
});

app.post('/admin/add-user', isAuthenticated, isAdmin, async (req, res) => {
  const { username, password, isAdmin } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send('User already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      isAdmin: !!isAdmin
    });
    await newUser.save();
    res.redirect('/admin');
  } catch (err) {
    console.error('Error adding user:', err);
    res.status(500).send('Error adding user');
  }
});

app.get('/admin/edit-user/:userID', isAuthenticated, isAdmin, async (req, res) => {
  const userID = req.params.userID;
  try {
    const user = await User.findById(userID);
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.render('edit-user', { user, currentRoute: '/admin' });
  } catch (err) {
    console.error('Error finding user:', err);
    res.status(500).send('Error finding user');
  }
});

app.put('/admin/edit-user/:userID', isAuthenticated, isAdmin, async (req, res) => {
  const userID = req.params.userID;
  const { username, isAdmin } = req.body;
  try {
    const user = await User.findById(userID);
    if (!user) {
      return res.status(404).send('User not found');
    }
    user.username = username;
    user.isAdmin = !!isAdmin;
    user.updatedAt = Date.now();
    await user.save();
    res.redirect('/admin');
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).send('Error updating user');
  }
});

app.delete('/admin/delete-user/:userID', isAuthenticated, isAdmin, async (req, res) => {
  const userID = req.params.userID;
  try {
    const deletedUser = await User.findByIdAndDelete(userID);
    if (!deletedUser) {
      return res.status(404).send('User not found');
    }
    res.redirect('/admin');
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).send('Error deleting user');
  }
});

// API Routes
app.use('/api', gameRoutes);
app.use('/api', platfRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});