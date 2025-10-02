// game.js - Complete Version

let gameId = 'fight_' + Math.random().toString(36).substr(2, 9);
let gameState = null;
let selectedRegion = null;
let soundEnabled = true;

// Sound effects
const sounds = {
    background: new Audio('sounds/background.mp3'),
    click: new Audio('sounds/click.mp3'),
    dryClick: new Audio('sounds/dry-click.mp3'),
    gunshot: new Audio('sounds/gunshot.mp3'),
    shieldActivate: new Audio('sounds/shield-activate.mp3'),
    shieldBlock: new Audio('sounds/shield-block.mp3'),
};

// Setup background music
sounds.background.loop = true;
sounds.background.volume = 0.3;

function playSound(soundName) {
    if (!soundEnabled) return;
    
    const sound = sounds[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(err => console.log('Sound play failed:', err));
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundBtn = document.getElementById('soundIcon');
    
    if (soundEnabled) {
        soundBtn.textContent = '🔊';
        sounds.background.play().catch(err => console.log('Background music failed:', err));
    } else {
        soundBtn.textContent = '🔇';
        sounds.background.pause();
    }
}

// Region selection with event delegation
document.addEventListener('DOMContentLoaded', () => {
    const regionCards = document.querySelectorAll('.region-card');
    regionCards.forEach(card => {
        card.addEventListener('click', function() {
            playSound('click');
            selectedRegion = this.dataset.region;
            regionCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('startBtn').disabled = false;
        });
    });
    
    // Create taunt container for floating bubbles
    createTauntContainer();
});

function createTauntContainer() {
    if (!document.getElementById('floatingTauntContainer')) {
        const container = document.createElement('div');
        container.id = 'floatingTauntContainer';
        container.className = 'floating-taunt-container';
        document.body.appendChild(container);
    }
}

async function startFight() {
    const playerName = document.getElementById('playerName').value.trim();
    
    if (!playerName) {
        alert('Please enter your name!');
        return;
    }
    
    if (!selectedRegion) {
        alert('Please select your region!');
        return;
    }
    
    playSound('click');
    showLoading(true);
    
    try {
        const response = await fetch('/api/create-fight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId, playerName, playerRegion: selectedRegion })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create game');
        }
        
        gameState = await response.json();
        
        // Start background music
        if (soundEnabled) {
            sounds.background.play().catch(err => console.log('Background music failed:', err));
        }
        
        showLoading(false);
        showGameScreen();
        renderGame();
        await updateChamberInfo();
    } catch (error) {
        console.error('Error creating fight:', error);
        showLoading(false);
        alert('Error starting the fight! Make sure the server is running.');
    }
}

function showGameScreen() {
    document.getElementById('setupScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';
}

function renderGame() {
    if (!gameState) return;
    
    renderFighters();
    renderItems();
    updateActionMessage();
    updateMultiplier();
    updateRoundInfo();
}

function renderFighters() {
    const { player, opponent } = gameState;
    
    // Player info
    document.getElementById('playerNameDisplay').textContent = player.name;
    document.getElementById('playerHealth').textContent = `${player.health}/${player.maxHealth}`;
    updateHealthBar('player', player.health, player.maxHealth);
    document.getElementById('playerShield').style.display = player.shield ? 'block' : 'none';
    
    // Opponent info
    document.getElementById('opponentNameDisplay').textContent = opponent.name;
    document.getElementById('opponentHealth').textContent = `${opponent.health}/${opponent.maxHealth}`;
    updateHealthBar('opponent', opponent.health, opponent.maxHealth);
    document.getElementById('opponentShield').style.display = opponent.shield ? 'block' : 'none';
}

function updateHealthBar(type, health, maxHealth) {
    const percentage = (health / maxHealth) * 100;
    const fillElement = document.getElementById(`${type}HealthFill`);
    
    if (fillElement) {
        fillElement.style.width = percentage + '%';
        
        fillElement.classList.remove('critical');
        if (percentage <= 33) {
            fillElement.classList.add('critical');
        }
    }
}

function updateRoundInfo() {
    const roundElement = document.getElementById('currentRound');
    if (roundElement) {
        roundElement.textContent = gameState.round;
    }
    
    const winsElement = document.getElementById('winsDisplay');
    if (winsElement) {
        winsElement.textContent = `${gameState.player.wins} - ${gameState.opponent.wins}`;
    }
}

function renderItems() {
    const container = document.getElementById('playerItems');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!gameState.player.items || gameState.player.items.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; color: #888; text-align: center;">No items available</div>';
        return;
    }
    
    gameState.player.items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        if (item.uses === 0) itemCard.classList.add('used');
        
        itemCard.innerHTML = `
            <div class="item-name">${item.nameLocal}</div>
            <div class="item-description">${item.descriptionLocal}</div>
            <div class="item-uses">${item.uses}/${item.maxUses}</div>
        `;
        
        if (item.uses > 0 && gameState.currentTurn === 'player') {
            itemCard.onclick = () => useItem(item.id);
            itemCard.style.cursor = 'pointer';
        } else {
            itemCard.style.cursor = 'not-allowed';
        }
        
        container.appendChild(itemCard);
    });
}

async function updateChamberInfo() {
    try {
        const response = await fetch(`/api/chamber-info/${gameId}`);
        if (!response.ok) throw new Error('Failed to fetch chamber info');
        
        const info = await response.json();
        const liveElement = document.getElementById('liveCount');
        const blankElement = document.getElementById('blankCount');
        
        if (liveElement) liveElement.textContent = info.live;
        if (blankElement) blankElement.textContent = info.blank;
    } catch (error) {
        console.error('Error updating chamber info:', error);
    }
}

function updateActionMessage() {
    const messageElement = document.getElementById('actionMessage');
    if (messageElement) {
        messageElement.textContent = gameState.lastAction;
        
        // Animate message
        messageElement.classList.remove('pulse');
        void messageElement.offsetWidth; // Force reflow
        messageElement.classList.add('pulse');
    }
}

function updateMultiplier() {
    const indicator = document.getElementById('multiplierIndicator');
    if (indicator) {
        indicator.style.display = gameState.damageMultiplier > 1 ? 'block' : 'none';
        indicator.textContent = `⚡ ${gameState.damageMultiplier}X DAMAGE ⚡`;
    }
}

async function shootOpponent() {
    if (gameState.currentTurn !== 'player') return;
    
    playSound('click');
    disableActions();
    
    try {
        const response = await fetch('/api/shoot-opponent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId })
        });
        
        if (!response.ok) throw new Error('Failed to shoot opponent');
        
        const result = await response.json();
        const wasLive = gameState.chamber[gameState.currentChamberIndex]?.type === 'live';
        const hadShield = gameState.opponent.shield;
        
        gameState = result.gameState;
        
        // Play appropriate sound
        if (wasLive) {
            if (hadShield) {
                playSound('shieldBlock');
            } else {
                playSound('gunshot');
                if (result.damage > 0) flashBlood();
            }
        } else {
            playSound('dryClick');
        }
        
        renderGame();
        await updateChamberInfo();
        
        if (gameState.gamePhase === 'game_over') {
            setTimeout(() => showGameOver(), 1500);
        } else if (gameState.currentTurn === 'opponent') {
            setTimeout(() => aiTurn(), 2000);
        } else {
            enableActions();
        }
    } catch (error) {
        console.error('Error shooting opponent:', error);
        alert('Action failed. Check server connection.');
        enableActions();
    }
}

async function shootSelf() {
    if (gameState.currentTurn !== 'player') return;
    
    playSound('click');
    disableActions();
    
    try {
        const response = await fetch('/api/shoot-self', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId })
        });
        
        if (!response.ok) throw new Error('Failed to shoot self');
        
        const result = await response.json();
        const wasLive = gameState.chamber[gameState.currentChamberIndex]?.type === 'live';
        const hadShield = gameState.player.shield;
        
        gameState = result.gameState;
        
        // Play appropriate sound
        if (wasLive) {
            if (hadShield) {
                playSound('shieldBlock');
            } else {
                playSound('gunshot');
                if (result.damage > 0) flashBlood();
            }
        } else {
            playSound('dryClick');
        }
        
        renderGame();
        await updateChamberInfo();
        
        if (gameState.gamePhase === 'game_over') {
            setTimeout(() => showGameOver(), 1500);
        } else if (gameState.currentTurn === 'opponent') {
            setTimeout(() => aiTurn(), 2000);
        } else {
            enableActions();
        }
    } catch (error) {
        console.error('Error shooting self:', error);
        alert('Action failed. Check server connection.');
        enableActions();
    }
}

async function useItem(itemId) {
    if (gameState.currentTurn !== 'player') return;
    
    playSound('click');
    
    try {
        const response = await fetch('/api/use-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId, itemId })
        });
        
        if (!response.ok) throw new Error('Failed to use item');
        
        const result = await response.json();
        
        // Find the item to determine sound
        const item = gameState.player.items.find(i => i.id === itemId);
        if (item) {
            if (item.effect === 'shield') {
                playSound('shieldActivate');
            }
        }
        
        gameState = result.gameState;
        
        renderGame();
        await updateChamberInfo();
    } catch (error) {
        console.error('Error using item:', error);
        alert('Failed to use item. Check server connection.');
    }
}

async function aiTurn() {
    showLoading(true);
    disableActions();
    
    try {
        // Simulate AI thinking time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch('/api/ai-turn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId })
        });
        
        if (!response.ok) throw new Error('AI turn failed');
        
        const result = await response.json();
        const wasLive = gameState.chamber[gameState.currentChamberIndex]?.type === 'live';
        
        gameState = result.gameState;
        
        showLoading(false);
        
        // Play sound based on AI action
        if (wasLive) {
            playSound('gunshot');
            if (result.damage > 0) flashBlood();
        } else {
            playSound('dryClick');
        }
        
        // Show AI taunt as floating bubble if available
        if (result.taunt) {
            showFloatingTaunt(result.taunt);
        }
        
        renderGame();
        await updateChamberInfo();
        
        if (gameState.gamePhase === 'game_over') {
            setTimeout(() => showGameOver(), 1500);
        } else if (gameState.currentTurn === 'opponent') {
            // AI got blank, continue its turn
            setTimeout(() => aiTurn(), 2000);
        } else {
            enableActions();
        }
    } catch (error) {
        console.error('Error during AI turn:', error);
        showLoading(false);
        alert('AI turn failed. Check server connection.');
        enableActions();
    }
}

function showFloatingTaunt(tauntText) {
    const container = document.getElementById('floatingTauntContainer');
    if (!container) {
        createTauntContainer();
        return showFloatingTaunt(tauntText);
    }
    
    // Create bubble element
    const bubble = document.createElement('div');
    bubble.className = 'floating-taunt-bubble';
    bubble.textContent = tauntText;
    
    // Random position near opponent side (right side)
    const randomTop = Math.random() * 40 + 10; // 10-50% from top
    const randomRight = Math.random() * 15 + 5; // 5-20% from right
    
    bubble.style.top = randomTop + '%';
    bubble.style.right = randomRight + '%';
    
    container.appendChild(bubble);
    
    // Trigger animation
    setTimeout(() => bubble.classList.add('show'), 50);
    
    // Remove after animation
    setTimeout(() => {
        bubble.classList.remove('show');
        bubble.classList.add('hide');
        setTimeout(() => bubble.remove(), 600);
    }, 4000);
}

function disableActions() {
    document.querySelectorAll('.action-btn').forEach(btn => btn.disabled = true);
    document.querySelectorAll('.item-card').forEach(card => {
        card.style.pointerEvents = 'none';
        card.style.opacity = '0.5';
    });
}

function enableActions() {
    if (gameState.currentTurn === 'player') {
        document.querySelectorAll('.action-btn').forEach(btn => btn.disabled = false);
        document.querySelectorAll('.item-card:not(.used)').forEach(card => {
            card.style.pointerEvents = 'auto';
            card.style.opacity = '1';
        });
    }
}

function flashBlood() {
    const overlay = document.getElementById('bloodOverlay');
    if (overlay) {
        overlay.classList.add('active');
        setTimeout(() => overlay.classList.remove('active'), 500);
    }
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

function showGameOver() {
    const modal = document.getElementById('gameOverModal');
    if (!modal) return;
    
    const winner = gameState.player.health > 0 ? gameState.player : gameState.opponent;
    const isPlayerWinner = winner.id === 'player';
    
    // Stop background music
    sounds.background.pause();
    
    const titleElement = document.getElementById('gameOverTitle');
    const winnerElement = document.getElementById('winnerName');
    const statsElement = document.getElementById('matchStats');
    
    if (titleElement) {
        titleElement.textContent = isPlayerWinner ? 'PANALO!' : 'TALO!';
        titleElement.style.color = isPlayerWinner ? '#00ff00' : '#ff0000';
    }
    
    if (winnerElement) {
        winnerElement.textContent = winner.name;
    }
    
    if (statsElement) {
        statsElement.innerHTML = `
            <div style="margin: 10px 0;">
                <strong>${gameState.player.name}:</strong> ${gameState.player.wins} wins
            </div>
            <div style="margin: 10px 0;">
                <strong>${gameState.opponent.name}:</strong> ${gameState.opponent.wins} wins
            </div>
        `;
    }
    
    const nextRoundBtn = document.getElementById('nextRoundBtn');
    if (nextRoundBtn) {
        nextRoundBtn.style.display = gameState.round < gameState.maxRounds ? 'inline-block' : 'none';
    }
    
    modal.style.display = 'flex';
}

async function nextRound() {
    playSound('click');
    showLoading(true);
    
    try {
        const response = await fetch('/api/next-round', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId })
        });
        
        if (!response.ok) throw new Error('Failed to start next round');
        
        gameState = await response.json();
        
        document.getElementById('gameOverModal').style.display = 'none';
        showLoading(false);
        
        // Restart background music
        if (soundEnabled) {
            sounds.background.play().catch(err => console.log('Background music failed:', err));
        }
        
        renderGame();
        await updateChamberInfo();
        enableActions();
    } catch (error) {
        console.error('Error starting next round:', error);
        showLoading(false);
        alert('Failed to start next round. Check server connection.');
    }
}

function newGame() {
    playSound('click');
    document.getElementById('gameOverModal').style.display = 'none';
    gameId = 'fight_' + Math.random().toString(36).substr(2, 9);
    startFight();
}

function backToSetup() {
    playSound('click');
    
    // Stop background music
    sounds.background.pause();
    sounds.background.currentTime = 0;
    
    document.getElementById('gameOverModal').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('setupScreen').style.display = 'flex';
    
    gameState = null;
    selectedRegion = null;
    gameId = 'fight_' + Math.random().toString(36).substr(2, 9);
    
    document.getElementById('playerName').value = '';
    document.querySelectorAll('.region-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.getElementById('startBtn').disabled = true;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (!gameState || gameState.currentTurn !== 'player') return;
    
    switch(e.key) {
        case '1':
            shootOpponent();
            break;
        case '2':
            shootSelf();
            break;
        case 'm':
        case 'M':
            toggleSound();
            break;
    }
});