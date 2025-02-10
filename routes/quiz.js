app.get('/quiz', isAuthenticated, async (req, res) => {
    try {
      // Fetch 5 random questions
      const questions = await Quiz.aggregate([{ $sample: { size: 5 } }]);
        // Initialize the quiz session if it doesn't already exist
        if (!req.session.quiz) {
            req.session.quiz = {
                startTime: Date.now(), // Record when the quiz started
                questions: questions.map(q => q._id), // Store question IDs, not full questions
                answers: {}, // Store user's answers (questionId: answerIndex)
                score: 0, // Initialize score
                endTime: null,
                completed: false
            }
        }
        const timeLimit = questions.reduce((sum, question) => sum + question.timeLimit, 0)
  
      res.render('quiz', { questions, user: req.session.user, currentRoute: '/quiz', timeLimit: timeLimit, quizSession: req.session.quiz });
    } catch (err) {
      console.error("Error fetching quiz questions:", err);
      res.status(500).send("Error fetching quiz questions.");
    }
  });