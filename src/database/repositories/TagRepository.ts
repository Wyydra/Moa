import { SQLiteDatabase } from 'expo-sqlite';
import { CreateTagInput, Tag } from '../../model/tag';

export class TagRepository {
  constructor(private db: SQLiteDatabase) { }

  async createTag(input: CreateTagInput): Promise<number> {
    const result = await this.db.runAsync(
      'INSERT INTO tag (name, color) VALUES (?, ?)',
      input.name,
      input.color
    );
    return result.lastInsertRowId;
  }

  async getTags(): Promise<Tag[]> {
    const rows = await this.db.getAllAsync<Tag>(
      'SELECT * FROM tag ORDER BY name ASC'
    );
    return rows;
  }
}
