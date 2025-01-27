// OpenWeather API ключ и параметры
const apiKey = 'f1ae7d23e6cd9843a6beb8f649cf7c00';
const city = 'Astana';
const esilCoords = [51.089316, 71.416065];

// Инициализация карты
const map = L.map('map').setView(esilCoords, 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

L.marker(esilCoords).addTo(map).bindPopup('Астана, район Есиль').openPopup();

// Получение данных о погоде
axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
    .then(response => {
        const data = response.data;
        const rainVolume = data.rain ? data.rain['3h'] || 'No data' : 'No rain';

        const weatherHtml = `
            <h2>${data.name}, ${data.sys.country}</h2>
            <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}.png" alt="Weather Icon">
            <p>Description: ${data.weather[0].description}</p>
            <p>Temperature: ${data.main.temp}°C</p>
            <p>Feels Like: ${data.main.feels_like}°C</p>
            <p>Coordinates: [${data.coord.lat}, ${data.coord.lon}]</p>
            <p>Humidity: ${data.main.humidity}%</p>
            <p>Pressure: ${data.main.pressure} hPa</p>
            <p>Wind Speed: ${data.wind.speed} m/s</p>
            <p>Rain Volume (last 3h): ${rainVolume}</p>
        `;
        document.getElementById('weather').innerHTML = weatherHtml;
    })
    .catch(error => {
        console.error('Error fetching weather data:', error);
        document.getElementById('weather').innerHTML = '<p>Failed to load weather data.</p>';
    });
