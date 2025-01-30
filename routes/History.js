const express = require('express');
const router = express.Router();
const History = require('../models/gameHistory');

// Save search history
router.post('/save', async (req, res) => {
  try {
    const { query, results } = req.body;
    
    if (!query || !results || results.length === 0) {
      return res.status(400).json({ message: 'Query and results are required' });
    }

    const newHistory = new History({ query, results });
    await newHistory.save();

    res.status(201).json({ message: 'History saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// View search history with limit (if provided)
router.get("/view", async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;  // Если параметр limit не передан, по умолчанию будет 10
  try {
      const history = await History.find().sort({ date: -1 }).limit(limit);
      res.status(200).json(history);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


module.exports = router;

