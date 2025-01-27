const express = require('express');
const path = require('path');
const platformRoutes = require('./routes/platfRoutes'); 

const app = express();

// Используем маршруты для платформ
app.use('/api', platformRoutes);

// Обслуживание статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

