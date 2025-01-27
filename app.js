const bmiRoutes = require('./routes/bmiRoutes');
const gameRoutes = require('./routes/gameRoutes'); 
const platfRoutes = require('./routes/platfRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Подключение к базе данных MongoDB
mongoose.connect("mongodb+srv://danel:0000@cluster0.avoaf.mongodb.net/TodoApp", { useNewUrlParser: true, useUnifiedTopology: true })
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
function isAuthenticated(req, res, next) {
  if (req.session.user) {
      return next();
  }
  res.redirect('/login');
}

// Middleware проверки авторизации
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

// Маршруты
app.get('/', isAuthenticated, isAdmin, (req, res) => {
  res.render('index', { user: req.session.user });
});

// Маршрут для страницы входа
app.get('/login', (req, res) => {
  res.render('login', { error: req.session.error });
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
  res.render('bmiCalculator');
});

app.get('/cs', (req, res) => {
  res.render('cs');
});

app.get('/games', (req, res) => {
  res.render('games');
});

app.get('/Platforms', (req, res) => {
  res.render('Platforms');
});

app.get('/weather', (req, res) => {
  res.render('weather');
});

// Маршрут для выхода
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
      res.redirect('/login');
  });
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


// Добавление нового пользователя
// Добавление нового пользователя
app.post('/admin/add-user', isAuthenticated, isAdmin, async (req, res) => {
  const { username, password, isAdmin } = req.body;
  try {
      const newUser = new User({ username, password, isAdmin: isAdmin === 'on' });
      await newUser.save();
      res.redirect('/admin');
  } catch (err) {
      console.error('Error adding user:', err);
      res.status(500).send('Error adding user');
  }
});


// Редактирование пользователя
app.get('/admin/edit-user/:userID', isAuthenticated, async (req, res) => {
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


// Удаление пользователя
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
