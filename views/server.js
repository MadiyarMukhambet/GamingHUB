document.addEventListener('DOMContentLoaded', () => {
    // Fetch game data from RAWG API
    fetch('/api/games')
        .then(response => response.json())
        .then(data => {
            const gameContainer = document.getElementById('games');
            gameContainer.innerHTML = data
                .map(game => `
                    <div>
                        <h3>${game.name}</h3>
                        <img src="${game.background_image}" alt="${game.name}" width="200">
                        <p>Рейтинг: ${game.rating}</p>
                        <p>Платформы: ${game.platforms.map(p => p.platform.name).join(', ')}</p>
                    </div>
                `)
                .join('');
        })
        .catch(error => console.error('Error fetching game data:', error));
    fetch('/api/platforms')
        .then(response => response.json())
        .then(data => {
            const gameContainer = document.getElementById('platf');
            gameContainer.innerHTML = data
                .map(game => `
                    <div>
                        <h3>${game.name}</h3>
                        <img src="${game.background_image}" alt="${game.name}" width="200">
                        <p>Рейтинг: ${game.rating}</p>
                        <p>Платформы: ${game.platforms.map(p => p.platform.name).join(', ')}</p>
                    </div>
                `)
                .join('');
        })
        .catch(error => console.error('Error fetching game data:', error));
});
