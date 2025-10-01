export interface Fighter {
    id: string;
    name: string;
    region: 'bisaya' | 'tagalog';
    health: number;
    maxHealth: number;
    items: FightItem[];
    isPlayer: boolean;
    shield: boolean;
    wins: number;
}

export interface FightItem {
    id: string;
    name: string;
    nameLocal: string;
    description: string;
    descriptionLocal: string;
    uses: number;
    maxUses: number;
    effect: ItemEffect;
}

export type ItemEffect = 
    | 'heal'
    | 'shield'
    | 'peek'
    | 'skip_turn'
    | 'double_damage'
    | 'reverse_damage';

export interface GameState {
    id: string;
    player: Fighter;
    opponent: Fighter;
    currentTurn: 'player' | 'opponent';
    chamber: ChamberShot[];
    currentChamberIndex: number;
    gamePhase: 'setup' | 'item_selection' | 'shooting' | 'game_over';
    round: number;
    maxRounds: number;
    lastAction: string;
    damageMultiplier: number;
}

export interface ChamberShot {
    type: 'live' | 'blank';
    revealed: boolean;
}

export interface GameAction {
    gameState: GameState;
    taunt?: string;
    damage?: number;
}

export type TauntType = 'trash_talk' | 'victory' | 'pain' | 'confidence';