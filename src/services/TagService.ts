import { initDatabase } from '../database';
import { TagRepository } from '../database/repositories/TagRepository';
import { CreateTagInput, Tag } from '../model/tag';

class TagService {
    async getAll(): Promise<Tag[]> {
        const db = await initDatabase();
        const repository = new TagRepository(db);
        return repository.getTags();
    }

    async create(input: CreateTagInput): Promise<number> {
        const db = await initDatabase();
        const repository = new TagRepository(db);
        return repository.createTag(input);
    }
}

export const tagService = new TagService();
