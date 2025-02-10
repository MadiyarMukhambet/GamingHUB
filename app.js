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
const Invite = require('./models/invite'); // Import the Invite model
const crypto = require('crypto');

// Routes
const gameRoutes = require('./routes/gameRoutes');
const platfRoutes = require('./routes/platfRoutes');
const i18n = require('./utils/i18n'); // Если используется, убедитесь, что i18n настроен правильно
const Quiz = require('./models/quiz'); // Add this with your other model imports

// MongoDB Connection
const mongo_connect = process.env.MONGO_CONNECT; // Убедитесь, что переменная окружения установлена
mongoose.connect(mongo_connect, { useNewUrlParser: true, useUnifiedTopology: true }) // Эти опции устарели в новых версиях
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch(err => {
    console.log("Error connecting to MongoDB", err);
  });

// --- MIDDLEWARE (Сессии ПЕРВЫМИ) ---
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});
app.use('/api/history', historyRoutes);
// Set view engine and static folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Mount admin routes under /admin
app.use('/admin', require('./routes/adminItems'));

// Main route – fetch items and render main page
const Item = require('./models/item');
app.get('/', async (req, res) => {
  try {
    const items = await Item.find({ deletedAt: null });
    // Например, берем язык из сессии, если он там установлен, или задаем значение по умолчанию
    const language = req.session.language || 'english';
    res.render('index', { items, language, user: req.session.user, currentRoute: '/' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// Middleware для установки языка по умолчанию
app.use((req, res, next) => {
  if (!req.session.language) {
    req.session.language = 'russian'; // Язык по умолчанию
  }
  next();
});

// Static Files and View Engine
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Authentication Middleware (лучше вынести в отдельный файл, например, middleware/auth.js)
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next(); // User is logged in, proceed to the next middleware/route handler
  }
  res.redirect('/login'); // User is not logged in, redirect to login
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) {
    return next();
  }
  res.status(403).send('Access denied. Admins only.');
}


// Models (лучше вынести в отдельную папку models)
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

const HistorySchema = new mongoose.Schema({  //Лучше вынести в отдельную папку models
  userId: { type: String, required: false },
  api: { type: String, required: true },
  endpoint: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  request: { type: Object, required: true },
  response: { type: Object, required: true },
});
const History = mongoose.model('History', HistorySchema);


// --- ROUTES ---
app.get('/quiz', isAuthenticated, async (req, res) => {
  console.log("/quiz GET route accessed"); // Add this
  console.log("req.session.quiz:", req.session.quiz);
  try {
    // Check for a completed quiz session *first*
    if (req.session.quiz && req.session.quiz.completed) {
      console.log("Quiz already completed, redirecting to /quiz-results"); // Add this
      return res.redirect('/quiz-results'); // Redirect to results if already completed
    }

    // Получаем 5 случайных вопросов (только если викторина еще не завершена)
    const questions = await Quiz.aggregate([{ $sample: { size: 5 } }]);

      // Инициализируем сессию викторины, если она еще не существует
      if (!req.session.quiz) {
          req.session.quiz = {
              startTime: Date.now(), // Записываем время начала викторины
              questions: questions.map(q => q._id), // Сохраняем ID вопросов
              answers: {}, // Сохраняем ответы пользователя (questionId: answerIndex)
              score: 0,
              endTime: null,
              completed: false
          };
      }

      const timeLimit = questions.reduce((sum, question) => sum + question.timeLimit, 0);
    res.render('quiz', { questions, user: req.session.user, currentRoute: '/quiz', timeLimit, quizSession: req.session.quiz });

  } catch (err) {
    console.error("Error fetching quiz questions:", err);
    res.status(500).send("Error fetching quiz questions.");
  }
});

app.post('/quiz', isAuthenticated, async (req, res) => {
  try {
    if (!req.session.quiz || req.session.quiz.completed) {
      // Предотвращаем отправку, если викторина не начата или уже завершена
      return res.redirect('/quiz'); // Или отображаем ошибку
    }

    const userAnswers = req.body;
    const quizSession = req.session.quiz;
    quizSession.endTime = Date.now();  // Записываем время окончания
    const questionIds = quizSession.questions;

    // Получаем правильные ответы из БД
    const questions = await Quiz.find({ '_id': { $in: questionIds } });

    let score = 0;
    for (const question of questions) {
      const userAnswer = parseInt(userAnswers[question._id]); // Получаем ответ пользователя
      quizSession.answers[question._id] = userAnswer; // Сохраняем ответ

      if (!isNaN(userAnswer) && userAnswer === question.correctAnswer) {
        score++;
      }
    }

    quizSession.score = score;
    quizSession.completed = true; // Помечаем викторину как завершенную

     const elapsedTime = (quizSession.endTime - quizSession.startTime) / 1000

    res.render('quiz-results', { questions, userAnswers: quizSession.answers, score, totalQuestions: questions.length, user: req.session.user, currentRoute: '/quiz', elapsedTime, quizSession }); // Pass to results page


  } catch (error) {
    console.error("Error submitting quiz:", error);
    res.status(500).send("Error submitting quiz.");
  }
});


app.get('/quiz-results', isAuthenticated, (req, res) => {
  console.log("/quiz-results GET route accessed"); // Add this
  console.log("req.session.quiz:", req.session.quiz);
  // Проверяем, есть ли завершенная сессия викторины
   if (!req.session.quiz || !req.session.quiz.completed) {
    console.log("No completed quiz found, redirecting to /quiz");
     return res.redirect('/quiz'); // Перенаправляем к началу викторины, если нет результатов
   }

   const quizSession = req.session.quiz;
   const userAnswers = quizSession.answers;
   const score = quizSession.score;
   const elapsedTime = (quizSession.endTime - quizSession.startTime) / 1000;
    const questionIds = quizSession.questions;

     // Получаем вопросы *после* проверки на завершенную викторину
   Quiz.find({ '_id': { $in: questionIds } }).then(questions => { // Получаем вопросы по ID
    // Add these lines to prevent caching:
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache'); // For older browsers
    res.setHeader('Expires', '0');      // Set expiration to the past

       res.render('quiz-results', {
           questions,
           userAnswers,
           score,
           totalQuestions: questions.length,
           user: req.session.user,
           currentRoute: '/quiz',  //  здесь, возможно, нужен другой currentRoute
           elapsedTime,
           quizSession // Передаем всю сессию для отладки или дополнительных функций
       });

       // Очищаем данные сессии викторины *после* отображения результатов
       req.session.quiz = null;
       console.log("req.session.quiz after clearing:", req.session.quiz); // Add this

   }).catch(err => {
       console.error("Error fetching quiz questions for results:", err);
       res.status(500).send("Error fetching quiz results.");
   });
});

app.post('/quiz/invite', isAuthenticated, async (req, res) => {
    try {
        // Get quizId from the current session (requires fetching all questions)
        if (!req.session.quiz || !req.session.quiz.questions || req.session.quiz.questions.length === 0) {
            return res.status(400).json({ error: "No quiz in progress." });
        }

        // Get the questions to find ONE quiz id.
        const questionIds = req.session.quiz.questions;
        const questions = await Quiz.find({ '_id': { $in: questionIds } });

        if(questions.length === 0){
            return res.status(400).json({error: "Quiz ID not found."});
        }

        const quizId = questions[0]._id; // Get ID of the FIRST question


        const inviteCode = crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 1);

        const newInvite = new Invite({
            quizId: quizId, // Use the retrieved quizId
            code: inviteCode,
            expiresAt: expiresAt,
            used: false
        });
        console.log("newInvite:", newInvite);
        await newInvite.save();
        console.log("Invite saved successfully!");

        const inviteLink = `<span class="math-inline">\{req\.protocol\}\://</span>{req.get('host')}/quiz/join/${inviteCode}`;
        console.log("inviteLink:", inviteLink);
        res.json({ inviteLink });

    } catch (error) {
        console.error("Error generating invite link:", error);
        res.status(500).json({ error: "Failed to generate invite link." });
    }
});

app.get('/quiz/join/:code', isAuthenticated, async (req, res) => {
  try {
      const inviteCode = req.params.code;

      // 1. Find the invite in the database.
      const invite = await Invite.findOne({ code: inviteCode, used: false, expiresAt: { $gt: new Date() } });

      if (!invite) {
          // Invalid or expired invite
          return res.status(404).send("Invalid or expired invite link.");
      }
      // Mark the invite as used *before* starting the quiz
      invite.used = true;
      await invite.save();

        const questions = await Quiz.aggregate([{ $sample: { size: 5 } }]);
         const timeLimit = questions.reduce((sum, question) => sum + question.timeLimit, 0)

      req.session.quiz = {
          startTime: Date.now(),
          questions: questions.map(q => q._id), // Store question IDs,
          answers: {},
          score: 0,
          endTime: null,
          completed: false,
      };

       res.render('quiz', { questions, user: req.session.user, currentRoute: '/quiz', timeLimit, quizSession: req.session.quiz });


  } catch (error) {
      console.error("Error joining quiz with invite:", error);
      res.status(500).send("Error joining quiz.");
  }
});

// Login Routes
app.get('/login', (req, res) => {
    //  Очищаем ошибку при *каждом* GET-запросе к /login
    const error = req.session.error || null;
    req.session.error = null;  // Очищаем
    res.render('login', { error: error, user: req.session.user || null, currentRoute: '/login' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      req.session.error = 'Invalid username or password';
      return res.redirect('/login'); //  Используем return
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.session.error = 'Invalid username or password';
      return res.redirect('/login'); //  Используем return
    }

    // Store the user's ID in the session
    req.session.user = { id: user._id, username: user.username, isAdmin: user.isAdmin };
    res.redirect('/'); //  Перенаправляем на главную после успешного входа
  } catch (err) {
    console.error('Error during login:', err);
    req.session.error = 'An error occurred. Please try again.';
    res.redirect('/login'); //  Используем return
  }
});

// Register Routes
app.get('/register', (req, res) => {
   const error = req.session.error || null;
    req.session.error = null;
    res.render('register', { error: error, user: req.session.user || null, currentRoute: '/register' });
});

app.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    req.session.error = 'Passwords do not match';
    return res.redirect('/register'); //  Используем return
  }
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      req.session.error = 'Username already exists';
      return res.redirect('/register'); //  Используем return
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
    res.redirect('/register'); //  Используем return
  }
});

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).send('An error occurred during logout'); //  Используем return
    }
    res.redirect('/login');
  });
});

app.get('/games', isAuthenticated, (req, res) => {
  res.render('games', { user: req.session.user, currentRoute: '/games' });
});

app.get('/Platforms', isAuthenticated, (req, res) => {
  res.render('Platforms', { user: req.session.user, currentRoute: '/Platforms' });
});

// Inventory Routes
app.get('/inventory', isAuthenticated, (req, res) => {
  res.render('inventory', { items: null, error: null, user: req.session.user, currentRoute: '/inventory', language: req.session.language });
});

app.post('/inventory', isAuthenticated, async (req, res) => {
  const { steamId, game } = req.body;
  const language = req.session.language; // Получаем язык из сессии

  if (!steamId || !game) {
    return res.render('inventory', { items: null, error: 'Steam ID and game are required.', user: req.session.user, currentRoute: '/inventory', language: req.session.language });
  }

  try {
    const steamApiUrl = `https://steamcommunity.com/inventory/${steamId}/${game}/2?l=${language}`; // Добавляем параметр языка
    const response = await axios.get(steamApiUrl);
    const data = response.data;

    if (!data || !data.assets || !data.descriptions) {
      return res.render('inventory', { items: null, error: 'Invalid response from Steam API.', user: req.session.user, currentRoute: '/inventory', language: req.session.language });
    }

    const { assets, descriptions } = data;

    const items = assets.map(asset => {
      const description = descriptions.find(desc => desc.classid === asset.classid && desc.appid == asset.appid);
      if (!description) {
        return null;
      }
      return {
        name: description.market_name || 'No Name',
        type: description.type || 'Unknown',
        imageUrl: `https://steamcommunity-a.akamaihd.net/economy/image/${description.icon_url}`
      };
    }).filter(item => item !== null);

    res.render('inventory', { items, error: null, user: req.session.user, currentRoute: '/inventory', language: req.session.language });

  } catch (err) {
    console.error('Error fetching inventory:', err);
    let errorMessage = 'Failed to fetch inventory. Please check the Steam ID and try again.';

    if (err.response) {
      if (err.response.status === 404) {
        errorMessage = 'Steam user or game not found.';
      } else if (err.response.status === 403) {
        errorMessage = "Steam inventory is private.";
      } else if (err.response.status === 500) {
        errorMessage = 'Internal Server Error. Please try again later.';
      } else {
        errorMessage = `Steam API error: ${err.response.status}`;
      }
    } else if (err.request) {
      errorMessage = 'No response from Steam. Please check your internet connection.';
    } else if (err.code === 'ENOTFOUND') {
      errorMessage = 'Could not connect to Steam servers. Check your internet connection.';
    } else {
      errorMessage = `Error: ${err.message}`;
    }

    res.render('inventory', { items: null, error: errorMessage, user: req.session.user, currentRoute: '/inventory', language: req.session.language });
  }
});

// Маршрут смены языка (если его еще нет)
app.get('/change-language', (req, res) => {
    req.session.language = req.session.language === 'russian' ? 'english' : 'russian';
    res.redirect('back'); // Перенаправляем обратно на предыдущую страницу
});

// Маршрут смены языка
app.get('/change-language', (req, res) => {
    req.session.language = req.session.language === 'russian' ? 'english' : 'russian';
    res.redirect('back'); // Перенаправляем обратно на предыдущую страницу
});

// Discounts Route
app.get('/discounts', isAuthenticated, async (req, res) => {
    try {
        const searchQuery = req.query.search || '';
        const language = req.session.language;

        const response = await axios.get(`https://store.steampowered.com/api/featuredcategories?cc=kz&l=${language}`);
        const apiData = response.data;


        if (!apiData) {
            return res.render('discounts', { combinedDiscounts: [], error: 'No data found.', searchQuery, user: req.session.user, currentRoute: '/discounts', language: req.session.language });
        }

        let combinedDiscounts = [];

        // 1. Обрабатываем "specials" (Скидки)
        if (apiData.specials && apiData.specials.items) {
            const specialDiscounts = apiData.specials.items
                .map(item => ({
                    type: 'special',
                    name: item.name || "Название отсутствует",
                    discountPercent: item.discount_percent,
                    originalPrice: item.original_price ? item.original_price / 100 : null,
                    finalPrice: item.final_price ? item.final_price / 100 : null,
                    imageUrl: item.large_capsule_image,
                    url: `/app/${item.id}` //  Всегда используем /app/{id}

                }))
                .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
            combinedDiscounts = combinedDiscounts.concat(specialDiscounts);
        }

        // 2. Обрабатываем "Spotlights"
        for (const key in apiData) {
            if (apiData[key] && apiData[key].id === 'cat_spotlight' && apiData[key].items) {
                const spotlightItems = apiData[key].items.map(item => ({
                    type: 'spotlight',
                    name: item.name || "Без названия",
                    imageUrl: item.header_image,
                    body: item.body || "",
                    url: item.url  //  Для spotlight используем предоставленный URL
                }));
                combinedDiscounts = combinedDiscounts.concat(spotlightItems);
            }
        }

        // 3. Обрабатываем "Daily Deal"
        if (apiData.dailydeal && apiData.dailydeal.items) {
            const dailyDealItems = apiData.dailydeal.items.map(item => ({
                type: 'dailydeal',
                name: item.name || 'Без названия',
                discountPercent: item.discount_percent,
                originalPrice: item.original_price ? item.original_price / 100 : null,
                finalPrice: item.final_price ? item.final_price / 100 : null,
                imageUrl: item.header_image,
                url: `/app/${item.id}` //  Всегда используем /app/{id}
            }));
            combinedDiscounts = combinedDiscounts.concat(dailyDealItems)
        }

        const historyEntry = new History({
            api: 'https://store.steampowered.com/api/featuredcategories',
            endpoint: '/discounts',
            timestamp: new Date(),
            request: { searchQuery, language }, //  Сохраняем язык и поисковый запрос
            response: combinedDiscounts,
        });
        await historyEntry.save();

        res.render('discounts', { combinedDiscounts, error: null, searchQuery, user: req.session.user, currentRoute: '/discounts', language: req.session.language });

    } catch (err) {
        console.error('Error fetching discounts:', err);
        res.render('discounts', { combinedDiscounts: [], error: 'Failed to fetch discounts. Please try again later.', searchQuery: '', user: req.session.user, currentRoute: '/discounts', language: req.session.language });
    }
});

// History Route
app.get('/history', isAuthenticated, async (req, res) => {
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
    const user = await User.findById(req.session.user.id);  //  Используем ID из сессии

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
    const user = await User.findById(req.session.user.id); //  Используем ID из сессии

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
      isAdmin: !!isAdmin // Convert to boolean
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
    res.render('edit-user', { user, currentRoute: '/admin' }); //  Передаем currentRoute
  } catch (err) {
    console.error('Error finding user:', err);
    res.status(500).send('Error finding user');
  }
});

app.put('/admin/edit-user/:userID', isAuthenticated, isAdmin, async (req, res) => {
  const userID = req.params.userID;
  const { username, isAdmin } = req.body; //  Не получаем пароль
  try {
    const user = await User.findById(userID);
    if (!user) {
      return res.status(404).send('User not found');
    }
    user.username = username;
    user.isAdmin = !!isAdmin; // Convert to boolean
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


// API Routes (если нужны)
app.use('/api', gameRoutes); //  Убедитесь, что gameRoutes и platfRoutes определены
app.use('/api', platfRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});