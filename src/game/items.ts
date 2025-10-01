import { FightItem } from '../types/game';

export const BISAYA_ITEMS: FightItem[] = [
    {
        id: 'tubâ',
        name: 'Tubâ (Coconut Wine)',
        nameLocal: 'Tubâ',
        description: 'Restores 2 health',
        descriptionLocal: 'Balik 2 ka health',
        uses: 1,
        maxUses: 1,
        effect: 'heal'
    },
    {
        id: 'anting_anting',
        name: 'Anting-Anting Amulet',
        nameLocal: 'Anting-Anting',
        description: 'Block next damage',
        descriptionLocal: 'Panalipod sa sunod nga away',
        uses: 1,
        maxUses: 1,
        effect: 'shield'
    },
    {
        id: 'espiritista',
        name: 'Espiritista Vision',
        nameLocal: 'Espiritista',
        description: 'See next shot',
        descriptionLocal: 'Makita ang sunod nga bala',
        uses: 1,
        maxUses: 1,
        effect: 'peek'
    },
    {
        id: 'bunal',
        name: 'Power Bunal',
        nameLocal: 'Kusog nga Bunal',
        description: 'Double damage on next shot',
        descriptionLocal: 'Doble ang damage sa sunod',
        uses: 1,
        maxUses: 1,
        effect: 'double_damage'
    }
];

export const TAGALOG_ITEMS: FightItem[] = [
    {
        id: 'lambanog',
        name: 'Lambanog (Coconut Vodka)',
        nameLocal: 'Lambanog',
        description: 'Restores 2 health',
        descriptionLocal: 'Bumalik ang 2 buhay',
        uses: 1,
        maxUses: 1,
        effect: 'heal'
    },
    {
        id: 'habas',
        name: 'Habas Amulet',
        nameLocal: 'Anting-Habas',
        description: 'Block next damage',
        descriptionLocal: 'Hadlang sa susunod na pinsala',
        uses: 1,
        maxUses: 1,
        effect: 'shield'
    },
    {
        id: 'manghuhula',
        name: 'Fortune Teller',
        nameLocal: 'Manghuhula',
        description: 'See next shot',
        descriptionLocal: 'Makita ang susunod na bala',
        uses: 1,
        maxUses: 1,
        effect: 'peek'
    },
    {
        id: 'suntok',
        name: 'Power Suntok',
        nameLocal: 'Malakas na Suntok',
        description: 'Double damage on next shot',
        descriptionLocal: 'Doble ang damage sa susunod',
        uses: 1,
        maxUses: 1,
        effect: 'double_damage'
    }
];

export function getRandomItems(region: 'bisaya' | 'tagalog', count: number): FightItem[] {
    const items = region === 'bisaya' ? BISAYA_ITEMS : TAGALOG_ITEMS;
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(item => ({ ...item }));
}