const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }], // Array of answer options
  correctAnswer: { type: Number, required: true }, // Index of the correct answer (0, 1, 2, 3...)
  category: { type: String, required: true }, // e.g., "Gaming", "General Knowledge"
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }, // Difficulty level
  timeLimit: { type: Number, default: 60 } // Time limit in seconds (default 60)
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;