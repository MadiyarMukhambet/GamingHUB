const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();
const RAWG_API_KEY = process.env.RAWG_API_KEY;

// Маршрут для получения игр
router.get("/games", async (req, res) => {
    const searchQuery = req.query.search || "";
    const searchPrecise = req.query.search_precise === "true"; // Читаем параметр "search_precise"
    const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${searchQuery}&search_precise=${searchPrecise}&page_size=10`;

    try {
        const response = await axios.get(url);
        res.json(response.data.results); // Отправляем список игр
    } catch (error) {
        console.error("Ошибка получения игр с RAWG:", error);
        res.status(500).json({ error: "Не удалось получить данные об играх." });
    }
});

module.exports = router;