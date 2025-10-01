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
        
        // Generate AI taunt
        let taunt: string | undefined;
        if (Math.random() < 0.3) {
            taunt = await this.aiService.generateTrashTalk(
                gameState.opponent.region,
                result.damage ? 'hit' : 'miss'
            );
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