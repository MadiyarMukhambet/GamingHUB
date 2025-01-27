const express = require('express');
const moment = require('moment'); // Для работы с временными метками
const router = express.Router();

const bmiHistory = []; // Хранилище для истории BMI

// Маршрут для расчета и сохранения BMI
router.post('/bmicalculator', (req, res) => {
    const { height, weight, age, gender, units } = req.body;

    // Конвертация единиц измерения, если указаны имперские значения
    let heightInCm = units === 'imperial' ? height * 2.54 : height;
    let weightInKg = units === 'imperial' ? weight * 0.453592 : weight;

    // Логика расчета BMI
    const bmi = (weightInKg / ((heightInCm / 100) ** 2)).toFixed(2);

    // Категория BMI
    let message;
    if (bmi < 18.5) {
        message = 'Underweight';
    } else if (bmi < 24.9) {
        message = 'Normal weight';
    } else if (bmi < 29.9) {
        message = 'Overweight';
    } else {
        message = 'Obesity';
    }

    // Добавление расчета в историю с временной меткой
    const timestamp = moment().format('MMMM Do YYYY, h:mm:ss a');
    bmiHistory.push({ bmi, message, age, gender, timestamp });

    // Ответ клиенту
    res.json({ bmi, message, timestamp });
});

// Маршрут для просмотра истории расчетов BMI
router.get('/bmi-history', (req, res) => {
    res.json(bmiHistory);
});

module.exports = router;
