require('dotenv').config(); // Загружаем переменные .env *ПЕРВЫМ ДЕЛОМ*
const mongoose = require('mongoose');
const Quiz = require('./models/quiz'); // Скорректируйте путь, если нужно

const mongo_connect = process.env.MONGO_CONNECT;

// Проверяем, определена ли mongo_connect ПЕРЕД попыткой подключения
if (!mongo_connect) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА: MONGO_CONNECT не определена в файле .env.");
  process.exit(1); // Завершаем скрипт с кодом ошибки
}

mongoose.connect(mongo_connect) // Убираем устаревшие опции
  .then(() => console.log("Подключено к MongoDB (для наполнения данными)"))
  .catch(err => console.error("Не удалось подключиться к MongoDB (для наполнения данными)", err));

const quizData = [
  {
    question: "What is the capital of France?",
    options: ["Berlin", "Madrid", "Paris", "Rome"],
    correctAnswer: 2,
    category: "Geography",
    difficulty: "easy",
    timeLimit: 30
  },
  {
    question: "Which game features the character 'Master Chief'?",
    options: ["Halo", "Destiny", "Mass Effect", "Fallout"],
    correctAnswer: 0,
    category: "Gaming",
    difficulty: "medium",
    timeLimit: 20
  },
    {
    question: "What year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswer: 2,
    category: "History",
    difficulty: "easy",
    timeLimit: 15
  },
  {
    question: "What is the chemical symbol for Gold?",
    options: ["Ag", "Au", "Fe", "Hg"],
    correctAnswer: 1,
    category: "Science",
    difficulty: "medium",
    timeLimit: 25
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Michelangelo", "Raphael", "Donatello", "Leonardo da Vinci"],
    correctAnswer: 3,
    category: "Art",
    difficulty: "hard",
    timeLimit: 40
  },
  {
      question: "Which game studio developed the 'Grand Theft Auto' series?",
      options: ["Ubisoft", "Rockstar Games", "EA Sports", "Activision"],
      correctAnswer: 1,
      category: "Gaming",
      difficulty: "easy",
      timeLimit: 20
    },
    {
      question: "In what year was the first Call of Duty game released?",
      options: ["2001", "2003", "2005", "2007"],
      correctAnswer: 1,
      category: "Gaming",
      difficulty: "medium",
      timeLimit: 30
    },
    {
      question: "Which of these games is known for its Battle Royale mode?",
      options: ["Overwatch", "Fortnite", "League of Legends", "Minecraft"],
      correctAnswer: 1,
      category: "Gaming",
      difficulty: "easy",
      timeLimit: 15
    },
      {
      question: "Which game features a character named 'Kratos'?",
      options: ["God of War", "The Witcher", "Dark Souls", "Assassin's Creed"],
      correctAnswer: 0,
      category: "Gaming",
      difficulty: "hard",
      timeLimit: 25
    },
    {
        question: "The game 'The Legend of Zelda' is primarily associated with which console?",
        options: ["PlayStation", "Xbox", "Nintendo", "PC"],
        correctAnswer: 2,
        category: "Gaming",
        difficulty: "medium",
        timeLimit: 60
      }
];

async function seedDatabase() {
  try {
    await Quiz.deleteMany({}); // Очищаем существующие викторины (опционально, ОСТОРОЖНО в продакшене)
    await Quiz.insertMany(quizData);
    console.log("База данных наполнена данными викторины!");
  } catch (error) {
    console.error("Ошибка наполнения базы данных:", error);
  } finally {
    mongoose.disconnect(); // Закрываем соединение
  }
}

seedDatabase();