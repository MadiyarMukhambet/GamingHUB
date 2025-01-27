const bmiRoutes = require('./routes/bmiRoutes');
const gameRoutes = require('./routes/gameRoutes'); 
const platfRoutes = require('./routes/platfRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');

const express = require('express');
const path = require('path');
const mongo_connect = process.env.MONGO_CONNECT;
const app = express();
const PORT = process.env.PORT || 3000;

// Подключение к базе данных MongoDB
mongoose.connect(mongo_connect, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch(err => {
    console.log("Error connecting to MongoDB", err);
  });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));


// Модели пользователей (например, User)
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}));


// Настройка движка шаблонов
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware для статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Middleware проверки авторизации
function isAuthenticated(req, res, next) {
  if (req.session.user) {
      return next();
  }
  res.redirect('/');
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) {
      return next();
  }
  res.status(403).send('Access denied. Admins only.');
}

// Маршруты
app.get('/', (req, res) => {
  const user = req.session.user || null; // Проверяем, есть ли пользователь
  res.render('index', { user }); // Передаем пользователя в шаблон
});

// Маршрут для страницы входа
app.get('/login', (req, res) => {
  res.render('login', { error: req.session.error });
  req.session.error = null;  // очищаем ошибку после отображения
});

// Маршрут для страницы регистраций
app.get('/register', (req, res) => {
  res.render('register', { error: req.session.error });
  req.session.error = null;  // очищаем ошибку после отображения
});

// Обработка формы входа
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
      const user = await User.findOne({ username, password });
      if (!user) {
          req.session.error = 'Invalid username or password';
          return res.redirect('/login');
      }

      req.session.user = { username: user.username, isAdmin: user.isAdmin };
      res.redirect('/'); // Перенаправление на главную страницу
  } catch (err) {
      console.error('Error during login:', err);
      req.session.error = 'An error occurred. Please try again.';
      res.redirect('/login');
  }
});

app.get('/bmiCalculator', (req, res) => {
  res.render('bmiCalculator', { user: req.session.user });
});

app.get('/cs', (req, res) => {
  res.render('cs', { user: req.session.user });
});

app.get('/games', (req, res) => {
  res.render('games', { user: req.session.user });
});

app.get('/Platforms', (req, res) => { 
  res.render('Platforms', { user: req.session.user }); 
});

app.get('/weather', (req, res) => {
  res.render('weather', { user: req.session.user });
});

// Админ панель (требует авторизации)
app.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
  try {
      const users = await User.find();
      res.render('admin', { users });
  } catch (err) {
      console.error('Error retrieving users:', err);
      res.status(500).send('Error retrieving users');
  }
});

// Редактирование пользователя (требует авторизации)
app.get('/admin/edit-user/:userID', isAuthenticated, isAdmin, async (req, res) => {
  const userID = req.params.userID;

  try {
      const user = await User.findById(userID);
      if (!user) {
          return res.status(404).send('User not found');
      }
      res.render('edit-user', { user });
  } catch (err) {
      console.error('Error finding user:', err);
      res.status(500).send('Error finding user');
  }
});

// Удаление пользователя (требует авторизации)
app.post('/admin/delete-user/:userID', isAuthenticated, isAdmin, async (req, res) => {
  try {
      await User.findByIdAndDelete(req.params.userID);
      res.redirect('/admin');
  } catch (err) {
      console.error('Error deleting user:', err);
      res.status(500).send('Error deleting user');
  }
});

// Маршрут для выхода
app.get('/logout', async (req, res) => {
  try {
      req.session.destroy((err) => {
          if (err) {
              console.error('Error during logout:', err);
              return res.status(500).send('An error occurred during logout');
          }
          res.redirect('/login');
      });
  } catch (err) {
      console.error('Unexpected error during logout:', err);
      res.status(500).send('An unexpected error occurred');
  }
});


// Подключение маршрутов
app.use('/', bmiRoutes);
app.use('/api', gameRoutes);
app.use('/api', platfRoutes);
app.use('/api', weatherRoutes);


// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
