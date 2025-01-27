const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();
const RAWG_API_KEY = process.env.RAWG_API_KEY;

// Маршрут для получения списка игр
router.get('/games', async (req, res) => {
    try {
        const response = await axios.get('https://api.rawg.io/api/games', {
            params: {
                key: RAWG_API_KEY,
                page_size: 10, // Лимит на количество игр
            },
        });
        res.json(response.data.results);
    } catch (error) {
        console.error('Error fetching games data:', error);
        res.status(500).json({ error: 'Failed to fetch games data' });
    }
});

module.exports = router;