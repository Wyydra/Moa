import { Tag } from "./tag";

export interface Card {
    id: number;
    front: string;
    back: string;
    deckId: number;
    createdAt: string;
    tags?: Tag[];
}

export interface CreateCardInput {
    front: string;
    back: string;
    deckId: number;
    tagIds?: number[];
}
