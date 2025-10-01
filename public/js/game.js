// game.js

let gameState = null;
let gameId = null;
let selectedRegion = null;
const API_BASE = '/api';

function selectRegion(region) {
    selectedRegion = region;
    document.querySelectorAll('.region-card').forEach(card => {
        card.style.borderColor = '#ff0000';
    });
    event.target.closest('.region-card').style.borderColor = '#fff';
    document.getElementById('startBtn').disabled = false;
}

async function startGame() {
    const playerName = document.getElementById('playerName').value.trim() || 'Fighter';
    if (!selectedRegion) return;

    gameId = 'game_' + Date.now();
    
    const response = await fetch(`${API_BASE}/create-fight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, playerName, playerRegion: selectedRegion })
    });

    gameState = await response.json();
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameScreen').style.display = 'block';
    updateUI();
}

function updateUI() {
    if (!gameState) return;

    // Update names
    document.querySelector('#gameScreen .fighter-name').textContent = gameState.player.name.toUpperCase();
    document.getElementById('opponentName').textContent = gameState.opponent.name.toUpperCase();

    // Update round
    document.getElementById('roundInfo').textContent = 
        `Round ${gameState.round} of ${gameState.maxRounds} | Wins: ${gameState.player.wins}-${gameState.opponent.wins}`;

    // Update health bars
    updateHealthBar('player', gameState.player);
    updateHealthBar('opponent', gameState.opponent);

    // Update shields
    document.getElementById('playerShield').classList.toggle('hidden', !gameState.player.shield);
    document.getElementById('opponentShield').classList.toggle('hidden', !gameState.opponent.shield);

    // Update items
    updateItems();

    // Update chamber
    updateChamber();

    // Update action log
    document.getElementById('actionLog').textContent = gameState.lastAction;

    // Update opponent item count
    document.getElementById('opponentItemCount').textContent = gameState.opponent.items.length;

    // Check game over
    if (gameState.gamePhase === 'game_over') {
        showGameOver();
    }

    // Disable buttons during opponent turn
    const isPlayerTurn = gameState.currentTurn === 'player' && gameState.gamePhase !== 'game_over';
    document.querySelectorAll('#actionButtons button').forEach(btn => {
        btn.disabled = !isPlayerTurn;
    });
}

function updateHealthBar(type, fighter) {
    const healthPercent = (fighter.health / fighter.maxHealth) * 100;
    document.getElementById(`${type}Health`).style.width = healthPercent + '%';
    document.getElementById(`${type}HealthText`).textContent = `${fighter.health}/${fighter.maxHealth}`;
}

function updateItems() {
    const itemsDiv = document.getElementById('playerItems');
    itemsDiv.innerHTML = '';
    
    gameState.player.items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item' + (item.uses <= 0 ? ' used' : '');
        itemDiv.innerHTML = `<strong>${item.nameLocal}</strong><br>${item.descriptionLocal}`;
        if (item.uses > 0) {
            itemDiv.onclick = () => useItem(item.id);
        }
        itemsDiv.appendChild(itemDiv);
    });
}

function updateChamber() {
    const remaining = gameState.chamber.slice(gameState.currentChamberIndex);
    const live = remaining.filter(s => s.type === 'live' && !s.revealed).length;
    const blank = remaining.filter(s => s.type === 'blank' && !s.revealed).length;
    
    document.getElementById('chamberInfo').innerHTML = 
        `Chamber: 🔴 ${live} Live | ⚪ ${blank} Blank`;

    const shotsDiv = document.getElementById('chamberShots');
    shotsDiv.innerHTML = '';
    
    remaining.slice(0, 8).forEach(shot => {
        const shotDiv = document.createElement('div');
        shotDiv.className = 'shot';
        if (shot.revealed) {
            shotDiv.classList.add(shot.type);
        }
        shotsDiv.appendChild(shotDiv);
    });
}

async function shootOpponent() {
    if (gameState.currentTurn !== 'player') return;

    const response = await fetch(`${API_BASE}/shoot-opponent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
    });

    const result = await response.json();
    gameState = result.gameState;
    updateUI();

    if (gameState.currentTurn === 'opponent' && gameState.gamePhase !== 'game_over') {
        setTimeout(doAITurn, 1500);
    }
}

async function shootSelf() {
    if (gameState.currentTurn !== 'player') return;

    const response = await fetch(`${API_BASE}/shoot-self`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
    });

    const result = await response.json();
    gameState = result.gameState;
    updateUI();

    if (gameState.currentTurn === 'opponent' && gameState.gamePhase !== 'game_over') {
        setTimeout(doAITurn, 1500);
    }
}

async function useItem(itemId) {
    if (gameState.currentTurn !== 'player') return;

    const response = await fetch(`${API_BASE}/use-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, itemId })
    });

    const result = await response.json();
    gameState = result.gameState;
    updateUI();
}

async function doAITurn() {
    document.getElementById('actionLog').textContent = 'AI is thinking...';
    
    const response = await fetch(`${API_BASE}/ai-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
    });

    const result = await response.json();
    gameState = result.gameState;

    if (result.taunt) {
        const tauntDiv = document.getElementById('aiTaunt');
        tauntDiv.textContent = result.taunt;
        tauntDiv.classList.remove('hidden');
        setTimeout(() => tauntDiv.classList.add('hidden'), 3000);
    }

    updateUI();

    // Continue AI turn if it got a blank
    if (gameState.currentTurn === 'opponent' && gameState.gamePhase !== 'game_over') {
        setTimeout(doAITurn, 1500);
    }
}

function showGameOver() {
    const gameOverDiv = document.getElementById('gameOverSection');
    gameOverDiv.classList.remove('hidden');
    
    const winner = gameState.player.wins > gameState.opponent.wins ? 
        gameState.player.name : gameState.opponent.name;
    
    document.getElementById('winnerText').textContent = 
        `${winner.toUpperCase()} WINS!`;
    document.getElementById('finalScore').textContent = 
        `Final Score: ${gameState.player.wins} - ${gameState.opponent.wins}`;
    
    document.getElementById('actionButtons').classList.add('hidden');
}