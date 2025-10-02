import { Router, Request, Response } from 'express';
import { GameState, GameAction } from '../types/game';
import { GameLogic } from '../game/gameLogic';
import { AIService } from '../services/aiService';

export class GameRoutes {
    private router: Router;
    private games: Map<string, GameState>;
    private aiService: AIService;

    constructor(aiService: AIService) {
        this.router = Router();
        this.games = new Map();
        this.aiService = aiService;
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post('/create-fight', this.createFight.bind(this));
        this.router.post('/shoot-opponent', this.shootOpponent.bind(this));
        this.router.post('/shoot-self', this.shootSelf.bind(this));
        this.router.post('/use-item', this.useItem.bind(this));
        this.router.post('/ai-turn', this.aiTurn.bind(this));
        this.router.post('/next-round', this.nextRound.bind(this));
        this.router.get('/game/:gameId', this.getGame.bind(this));
        this.router.get('/chamber-info/:gameId', this.getChamberInfo.bind(this));
    }

    private createFight(req: Request, res: Response): void {
        const { gameId, playerName, playerRegion } = req.body;
        const gameState = GameLogic.createGame(gameId, playerName, playerRegion);
        this.games.set(gameId, gameState);
        res.json(gameState);
    }

    private shootOpponent(req: Request, res: Response): void {
        const { gameId } = req.body;
        const gameState = this.games.get(gameId);

        if (!gameState) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }

        const result = GameLogic.shootOpponent(gameState);
        res.json(result);
    }

    private shootSelf(req: Request, res: Response): void {
        const { gameId } = req.body;
        const gameState = this.games.get(gameId);

        if (!gameState) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }

        const result = GameLogic.shootSelf(gameState);
        res.json(result);
    }

    private async useItem(req: Request, res: Response): Promise<void> {
        const { gameId, itemId } = req.body;
        const gameState = this.games.get(gameId);

        if (!gameState) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }

        const result = GameLogic.useItem(gameState, itemId, true);
        res.json(result);
    }

    private async aiTurn(req: Request, res: Response): Promise<void> {
        const { gameId } = req.body;
        const gameState = this.games.get(gameId);

        if (!gameState) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }

        const result = GameLogic.aiTurn(gameState);
        
        // Generate AI taunt with better context
        let taunt: string | undefined;
        
        // 70% chance to generate taunt (increased from 30%)
        if (Math.random() < 0.7) {
            // Build detailed situation for better taunts
            let situation = '';
            
            if (result.damage && result.damage > 0) {
                if (result.damage > 1) {
                    situation = `critical_hit_dealt_${result.damage}_damage_player_health_${gameState.player.health}`;
                } else {
                    situation = `successful_hit_player_health_${gameState.player.health}`;
                }
            } else if (gameState.lastAction.includes('BLANK')) {
                situation = 'shot_blank_keeps_turn';
            } else if (gameState.lastAction.includes('shield')) {
                situation = 'hit_blocked_by_shield';
            } else {
                situation = 'missed_shot';
            }
            
            // Add health context
            if (gameState.player.health <= 2) {
                situation += '_player_low_health';
            }
            if (gameState.opponent.health <= 2) {
                situation += '_ai_low_health';
            }
            
            // Add win streak context
            if (gameState.opponent.wins > gameState.player.wins) {
                situation += '_ai_winning';
            } else if (gameState.player.wins > gameState.opponent.wins) {
                situation += '_player_winning';
            }

            try {
                taunt = await this.aiService.generateTrashTalk(
                    gameState.opponent.region,
                    situation
                );
            } catch (error) {
                console.error('Failed to generate taunt:', error);
                // Fallback taunts
                taunt = gameState.opponent.region === 'bisaya' 
                    ? 'Unsa man? Hadlok ka?' 
                    : 'Ano na? Takot ka ba?';
            }
        }

        res.json({ ...result, taunt });
    }

    private nextRound(req: Request, res: Response): void {
        const { gameId } = req.body;
        const gameState = this.games.get(gameId);

        if (!gameState) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }

        GameLogic.startNewRound(gameState);
        res.json(gameState);
    }

    private getGame(req: Request, res: Response): void {
        const gameState = this.games.get(req.params.gameId);
        if (!gameState) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        res.json(gameState);
    }

    private getChamberInfo(req: Request, res: Response): void {
        const gameState = this.games.get(req.params.gameId);
        if (!gameState) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        const info = GameLogic.getChamberInfo(gameState);
        res.json(info);
    }

    getRouter(): Router {
        return this.router;
    }
}