const express = require('express');
const axios = require('axios');
const router = express.Router();

const apiKey = 'f1ae7d23e6cd9843a6beb8f649cf7c00';

// Маршрут для получения данных о погоде
router.get('/weather', (req, res) => {
    const city = req.query.city || 'Astana'; // Город по умолчанию
    axios
        .get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
        .then((response) => res.json(response.data))
        .catch((error) => {
            console.error('Error fetching weather data:', error.message);
            res.status(500).json({ error: 'Failed to fetch weather data' });
        });
});

module.exports = router;
