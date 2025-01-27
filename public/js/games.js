// Получаем элементы DOM
const gamesContainer = document.getElementById("games");
const searchButton = document.getElementById("searchButton");
const gameSearch = document.getElementById("gameSearch");

// Функция для получения игр с сервера
const fetchGames = async (query = "") => {
    try {
        // Формируем параметры запроса (нечеткий поиск по умолчанию)
        const params = new URLSearchParams({
            search: query,
            search_precise: true,
            _: new Date().getTime(), // Уникальный параметр для предотвращения кэширования
        });

        // Выполняем запрос к API
        const response = await fetch(`/api/games?${params.toString()}`, {
            cache: "no-store", // Полностью отключаем кэширование
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const games = await response.json();

        // Отображаем игры
        renderGames(games);
    } catch (error) {
        console.error("Error loading games:", error);
        gamesContainer.innerHTML = `<div class="alert alert-danger">Failed to load games. Please try again later.</div>`;
    }
};

// Вызов функции fetchGames сразу при загрузке страницы, чтобы показать игры по умолчанию
document.addEventListener("DOMContentLoaded", () => {
    fetchGames();  // Загружаем игры по умолчанию
});

// Функция для отображения игр
const renderGames = (games) => {
    gamesContainer.innerHTML = ""; // Очищаем контейнер

    if (!Array.isArray(games) || games.length === 0) {
        gamesContainer.innerHTML = `<div class="alert alert-info">Игры не найдены. Попробуйте другой запрос.</div>`;
        return;
    }

    games.forEach((game) => {
        const gameCard = document.createElement("div");
        gameCard.className = "col-md-4 mb-4";

        const rating = game.rating ? game.rating.toFixed(1) : "N/A";
        const genres = game.genres?.map(g => g.name).join(", ") || "N/A";
        const released = game.released || "Дата не указана"; 
        const playtime = game.playtime ? game.playtime : "N/A"; 
        const platforms = game.platforms ? game.platforms.map(p => p.platform.name).join(", ") : "N/A"; 

        gameCard.innerHTML = `
            <div class="card h-100">
                <img 
                    src="${game.background_image || '/images/placeholder.jpg'}" 
                    class="card-img-top" 
                    alt="${game.name}" 
                    onerror="this.src='/images/placeholder.jpg'" 
                >
                <div class="card-body">
                    <h5 class="card-title">${game.name}</h5>
                    <p class="card-text">Rating: ${rating}</p>
                    <p class="card-text">Genres: ${genres}</p>
                    <p class="card-text">Release: ${released}</p>
                    <p class="card-text">Playtime: ${playtime} часов</p>
                    <p class="card-text">Platform: ${platforms}</p>
                </div>
            </div>
        `;

        gamesContainer.appendChild(gameCard);
    });
};

// Обработчики событий
searchButton.addEventListener("click", () => {
    const query = gameSearch.value;
    fetchGames(query);
});

gameSearch.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        const query = gameSearch.value;
        fetchGames(query);
    }
});
