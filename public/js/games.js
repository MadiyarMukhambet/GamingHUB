const gamesContainer = document.getElementById('games');

fetch('/games')
    .then(response => response.json())
    .then(games => {
        games.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'col-md-4 game-card';
            gameCard.innerHTML = `
                <div class="card">
                    <img src="${game.background_image}" class="card-img-top" alt="${game.name}">
                    <div class="card-body">
                        <h5 class="card-title">${game.name}</h5>
                        <p class="card-text">Rating: ${game.rating}</p>
                        <a href="#" class="btn btn-primary">Learn More</a>
                    </div>
                </div>
            `;
            gamesContainer.appendChild(gameCard);
        });
    })
    .catch(error => console.error('Error fetching games:', error));
