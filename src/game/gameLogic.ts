import { GameState, Fighter, ChamberShot, GameAction } from "../types/game";
import { getRandomItems } from "./items";

export class GameLogic {
    static createGame(gameId: string, playerName: string, playerRegion: 'bisaya' | 'tagalog'): GameState {
        const opponentRegion = playerRegion === 'bisaya' ? 'tagalog' : 'bisaya';
        const opponentName = opponentRegion === 'bisaya' ? 'Bisaya Fighter' : 'Tagalog Fighter';

        const player: Fighter = {
            id: 'player',
            name: playerName,
            region: playerRegion,
            health: 6,
            maxHealth: 6,
            items: getRandomItems(playerRegion, 4),
            isPlayer: true,
            shield: false,
            wins: 0
        };

        const opponent: Fighter = {
            id: 'opponent',
            name: opponentName,
            region: opponentRegion,
            health: 6,
            maxHealth: 6,
            items: getRandomItems(opponentRegion, 4),
            isPlayer: false,
            shield: false,
            wins: 0
        };

        const chamber = this.generateChamber();

        return {
            id: gameId,
            player,
            opponent,
            currentTurn: 'player',
            chamber,
            currentChamberIndex: 0,
            gamePhase: 'item_selection',
            round: 1,
            maxRounds: 3,
            lastAction: `${playerName} vs ${opponentName} - Sugod!`,
            damageMultiplier: 1
        };
    }

    private static generateChamber(): ChamberShot[] {
        // Generate 8 shots: mix of live and blank (like Buckshot Roulette)
        const liveCount = Math.floor(Math.random() * 3) + 3; // 3-5 live rounds
        const blankCount = 8 - liveCount;
        
        const chamber: ChamberShot[] = [];
        
        for (let i = 0; i < liveCount; i++) {
            chamber.push({ type: 'live', revealed: false });
        }
        
        for (let i = 0; i < blankCount; i++) {
            chamber.push({ type: 'blank', revealed: false });
        }
        
        // Shuffle the chamber
        for (let i = chamber.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chamber[i], chamber[j]] = [chamber[j], chamber[i]];
        }
        
        return chamber;
    }

    static shootOpponent(gameState: GameState): GameAction {
        if (gameState.currentChamberIndex >= gameState.chamber.length) {
            // Chamber empty, reload
            gameState.chamber = this.generateChamber();
            gameState.currentChamberIndex = 0;
            gameState.lastAction = 'Bag-o nga bala! New ammo loaded!';
        }

        const currentShot = gameState.chamber[gameState.currentChamberIndex];
        currentShot.revealed = true;
        gameState.currentChamberIndex++;

        let damage = 0;
        const target = gameState.opponent;

        if (currentShot.type === 'live') {
            damage = 1 * gameState.damageMultiplier;
            
            if (target.shield) {
                target.shield = false;
                gameState.lastAction = `Shield blocked the shot! Gisangga sa kalasag!`;
                damage = 0;
            } else {
                target.health -= damage;
                gameState.lastAction = `HIT! ${damage} damage sa ${target.name}!`;
            }
        } else {
            gameState.lastAction = `BLANK! Walay bala! ${gameState.player.name} saved!`;
        }

        // Reset multiplier
        gameState.damageMultiplier = 1;

        // Check for knockout
        if (target.health <= 0) {
            target.health = 0;
            gameState.gamePhase = 'game_over';
            gameState.player.wins++;
            gameState.lastAction = `KNOCKOUT! ${gameState.player.name} wins!`;
        } else {
            gameState.currentTurn = 'opponent';
        }

        return { gameState, damage };
    }

    static shootSelf(gameState: GameState): GameAction {
        if (gameState.currentChamberIndex >= gameState.chamber.length) {
            gameState.chamber = this.generateChamber();
            gameState.currentChamberIndex = 0;
            gameState.lastAction = 'New chamber loaded!';
        }

        const currentShot = gameState.chamber[gameState.currentChamberIndex];
        currentShot.revealed = true;
        gameState.currentChamberIndex++;

        let damage = 0;

        if (currentShot.type === 'live') {
            damage = 1 * gameState.damageMultiplier;
            
            if (gameState.player.shield) {
                gameState.player.shield = false;
                gameState.lastAction = `Shield saved you! Kalasag nagluwas!`;
                damage = 0;
            } else {
                gameState.player.health -= damage;
                gameState.lastAction = `SELF HIT! ${damage} damage sa ${gameState.player.name}!`;
            }
            
            gameState.currentTurn = 'opponent';
        } else {
            gameState.lastAction = `BLANK! You keep your turn! Padayon!`;
            // Player keeps the turn
        }

        gameState.damageMultiplier = 1;

        if (gameState.player.health <= 0) {
            gameState.player.health = 0;
            gameState.gamePhase = 'game_over';
            gameState.opponent.wins++;
            gameState.lastAction = `KNOCKOUT! ${gameState.opponent.name} wins!`;
        }

        return { gameState, damage };
    }

    static aiTurn(gameState: GameState): GameAction {
        // AI decision making (simple but effective)
        const liveRemaining = gameState.chamber.slice(gameState.currentChamberIndex).filter(s => s.type === 'live').length;
        const totalRemaining = gameState.chamber.length - gameState.currentChamberIndex;
        const liveProbability = liveRemaining / totalRemaining;

        // AI uses items strategically
        if (gameState.opponent.items.length > 0 && Math.random() < 0.4) {
            const item = gameState.opponent.items[Math.floor(Math.random() * gameState.opponent.items.length)];
            this.useItem(gameState, item.id, false);
        }

        // AI decision: shoot self if low probability of live, shoot opponent otherwise
        if (liveProbability < 0.4 && Math.random() < 0.6) {
            return this.aiShootSelf(gameState);
        } else {
            return this.aiShootOpponent(gameState);
        }
    }

    private static aiShootSelf(gameState: GameState): GameAction {
        if (gameState.currentChamberIndex >= gameState.chamber.length) {
            gameState.chamber = this.generateChamber();
            gameState.currentChamberIndex = 0;
        }

        const currentShot = gameState.chamber[gameState.currentChamberIndex];
        currentShot.revealed = true;
        gameState.currentChamberIndex++;

        let damage = 0;

        if (currentShot.type === 'live') {
            damage = 1 * gameState.damageMultiplier;
            
            if (gameState.opponent.shield) {
                gameState.opponent.shield = false;
                gameState.lastAction = `AI shield blocked!`;
                damage = 0;
            } else {
                gameState.opponent.health -= damage;
                gameState.lastAction = `AI hit itself! ${damage} damage!`;
            }
            
            gameState.currentTurn = 'player';
        } else {
            gameState.lastAction = `AI got blank! Keeps turn!`;
        }

        gameState.damageMultiplier = 1;

        if (gameState.opponent.health <= 0) {
            gameState.opponent.health = 0;
            gameState.gamePhase = 'game_over';
            gameState.player.wins++;
            gameState.lastAction = `AI KNOCKED OUT! You win!`;
        }

        return { gameState, damage };
    }

    private static aiShootOpponent(gameState: GameState): GameAction {
        if (gameState.currentChamberIndex >= gameState.chamber.length) {
            gameState.chamber = this.generateChamber();
            gameState.currentChamberIndex = 0;
        }

        const currentShot = gameState.chamber[gameState.currentChamberIndex];
        currentShot.revealed = true;
        gameState.currentChamberIndex++;

        let damage = 0;

        if (currentShot.type === 'live') {
            damage = 1 * gameState.damageMultiplier;
            
            if (gameState.player.shield) {
                gameState.player.shield = false;
                gameState.lastAction = `Your shield blocked AI attack!`;
                damage = 0;
            } else {
                gameState.player.health -= damage;
                gameState.lastAction = `AI HITS YOU! ${damage} damage!`;
            }
        } else {
            gameState.lastAction = `AI shot blank! You're safe!`;
        }

        gameState.damageMultiplier = 1;
        gameState.currentTurn = 'player';

        if (gameState.player.health <= 0) {
            gameState.player.health = 0;
            gameState.gamePhase = 'game_over';
            gameState.opponent.wins++;
            gameState.lastAction = `YOU'RE KNOCKED OUT! AI wins!`;
        }

        return { gameState, damage };
    }

    static useItem(gameState: GameState, itemId: string, isPlayer: boolean): GameAction {
        const fighter = isPlayer ? gameState.player : gameState.opponent;
        const item = fighter.items.find(i => i.id === itemId && i.uses > 0);

        if (!item) return { gameState };

        item.uses--;

        switch (item.effect) {
            case 'heal':
                fighter.health = Math.min(fighter.health + 2, fighter.maxHealth);
                gameState.lastAction = `${fighter.name} used ${item.nameLocal}! +2 health!`;
                break;

            case 'shield':
                fighter.shield = true;
                gameState.lastAction = `${fighter.name} activated shield! Protektado!`;
                break;

            case 'peek':
                if (gameState.currentChamberIndex < gameState.chamber.length) {
                    const nextShot = gameState.chamber[gameState.currentChamberIndex];
                    nextShot.revealed = true;
                    gameState.lastAction = `Next shot is: ${nextShot.type === 'live' ? '🔴 LIVE' : '⚪ BLANK'}`;
                }
                break;

            case 'double_damage':
                gameState.damageMultiplier = 2;
                gameState.lastAction = `${fighter.name} powered up! Next shot deals 2x damage!`;
                break;
        }

        fighter.items = fighter.items.filter(i => i.uses > 0);

        return { gameState };
    }

    static startNewRound(gameState: GameState): void {
        if (gameState.round >= gameState.maxRounds) {
            const winner = gameState.player.wins > gameState.opponent.wins ? 
                gameState.player : gameState.opponent;
            gameState.gamePhase = 'game_over';
            gameState.lastAction = `${winner.name} wins the match!`;
            return;
        }

        gameState.round++;
        gameState.player.health = 6;
        gameState.opponent.health = 6;
        gameState.player.shield = false;
        gameState.opponent.shield = false;
        gameState.player.items = getRandomItems(gameState.player.region, 4);
        gameState.opponent.items = getRandomItems(gameState.opponent.region, 4);
        gameState.chamber = this.generateChamber();
        gameState.currentChamberIndex = 0;
        gameState.currentTurn = 'player';
        gameState.gamePhase = 'item_selection';
        gameState.damageMultiplier = 1;
        gameState.lastAction = `Round ${gameState.round} - Sugod!`;
    }

    static getChamberInfo(gameState: GameState): { live: number; blank: number; total: number } {
        const remaining = gameState.chamber.slice(gameState.currentChamberIndex);
        const live = remaining.filter(s => s.type === 'live' && !s.revealed).length;
        const blank = remaining.filter(s => s.type === 'blank' && !s.revealed).length;
        return { live, blank, total: live + blank };
    }
}