// Get DOM elements
const gamesContainer = document.getElementById("games");
const searchButton = document.getElementById("searchButton");
const gameSearch = document.getElementById("gameSearch");
const viewHistoryButton = document.getElementById("viewHistoryButton");
const downloadHistoryButton = document.getElementById("downloadHistoryButton");
const historyContainer = document.getElementById("historyContainer");

// Declare chart instance globally
let gamesChart;

// Function to fetch games from the server
const fetchGames = async (query = "") => {
    try {
      const params = new URLSearchParams({
        search: query,
        search_precise: true,
        _: new Date().getTime(),
      });
  
      const response = await fetch(`/api/games?${params.toString()}`, {
        cache: "no-store",
      });
  
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
  
      const games = await response.json();
  
      renderGames(games);
      renderChart(games);
  
      if (query.trim()) {
        saveSearchHistory(query, games); // Save query and results
      }
    } catch (error) {
      console.error("Error loading games:", error);
      gamesContainer.innerHTML = `<div class="alert alert-danger">Failed to load games. Please try again later.</div>`;
    }
  };
  

// Call fetchGames on page load
document.addEventListener("DOMContentLoaded", () => {
    fetchGames(); // Load games by default
});

// Function to render games
const renderGames = (games) => {
    gamesContainer.innerHTML = ""; // Clear the container

    if (!Array.isArray(games) || games.length === 0) {
        gamesContainer.innerHTML = `<div class="alert alert-info">No games found. Try another query.</div>`;
        return;
    }

    games.forEach((game) => {
        const gameCard = document.createElement("div");
        gameCard.className = "col-md-4 mb-4";

        const rating = game.rating ? game.rating.toFixed(1) : "N/A";
        const genres = game.genres?.map((g) => g.name).join(", ") || "N/A";
        const released = game.released || "Not provided";
        const playtime = game.playtime ? game.playtime : "N/A";
        const platforms = game.platforms
            ? game.platforms.map((p) => p.platform.name).join(", ")
            : "N/A";

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
                    <p class="card-text">Playtime: ${playtime} hours</p>
                    <p class="card-text">Platforms: ${platforms}</p>
                </div>
            </div>
        `;

        gamesContainer.appendChild(gameCard);
    });
};

// Function to render the chart
const renderChart = (games) => {
    const ctx = document.getElementById("gamesChart").getContext("2d");

    // Extract data for the chart
    const labels = games.map((game) => game.name);
    const playtime = games.map((game) => game.playtime || 0);

    // Destroy the previous chart instance if it exists
    if (gamesChart) {
        gamesChart.destroy();
    }

    // Create a new chart instance
    gamesChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels, // Game names as labels
            datasets: [
                {
                    label: "Game Playtime",
                    data: playtime, // Ratings data
                    backgroundColor: "rgba(245, 40, 145, 0.8)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                tooltip: { enabled: true },
            },
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
};

// Function to save search history
const saveSearchHistory = async (query, results) => {
    try {
      await fetch('/api/history/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, results }),
      });
      console.log(results);
      console.log('Search query and results saved.');
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };
  

// Function to view search history
const viewSearchHistory = async () => {
    try {
        const response = await fetch('/api/history/view');
        const historyData = await response.json();
        historyContainer.innerHTML = historyData
            .map(item => `<p>${item.query} (Date: ${new Date(item.date).toLocaleString()})</p>`)
            .join('');
    } catch (error) {
        console.error('Error fetching search history:', error);
    }
};


// В функции для загрузки истории
const downloadSearchHistory = async () => {
    try {
        const response = await fetch('/api/history/view?limit=5');
        const historyData = await response.json();

        if (!historyData || historyData.length === 0) {
            alert('No data available to download.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(14);
        doc.text('Search History', 10, 10);

        let currentY = 20;  // Начальная вертикальная позиция
        let resultCount = 0;  // Счетчик количества выведенных результатов

        historyData.forEach((item, index) => {
            doc.text(`${index + 1}. Query: ${item.query}, Date: ${new Date(item.date).toLocaleString()}`, 10, currentY);
            currentY += 10;  // Увеличиваем вертикальную позицию для следующего элемента

            // Добавляем результаты игры, если они есть
            if (item.results && item.results.length > 0) {
                item.results.forEach((result, idx) => {
                    doc.text(`  - ${result.name}`, 20, currentY);
                    currentY += 10;  // Увеличиваем вертикальную позицию для каждого нового результата
                    resultCount++;  // Увеличиваем счетчик результатов

                    // Добавляем новую страницу после второго результата
                    if (resultCount % 24 === 0) {
                        doc.addPage();
                        currentY = 10;  // Сброс позиции для новой страницы
                    }
                });
            }
        });

        doc.save('search_history.pdf');
    } catch (error) {
        console.error('Error downloading search history:', error);
    }
};





// Event listeners for search and history buttons
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

viewHistoryButton.addEventListener('click', viewSearchHistory);
downloadHistoryButton.addEventListener('click', downloadSearchHistory);

// Initial fetch of games on page load
document.addEventListener("DOMContentLoaded", () => {
    fetchGames(); // Load games by default
});

