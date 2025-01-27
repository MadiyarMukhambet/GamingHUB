const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();
const RAWG_API_KEY = '4d7ae76c6f2f4da3b2b97575700dbad5';

// Маршрут для получения платформ
router.get('/platforms', async (req, res) => {
    try {
        const response = await axios.get('https://api.rawg.io/api/platforms', {
            params: {
                key: RAWG_API_KEY,
            },
        });

        res.json(response.data.results); // Отправляем платформы на фронтенд
    } catch (error) {
        console.error('Ошибка при получении платформ:', error.message);
        res.status(500).json({ error: 'Не удалось получить платформы' });
    }
});

module.exports = router;
