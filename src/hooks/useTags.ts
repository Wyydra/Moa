import { useState, useEffect, useCallback } from 'react';
import { Tag, CreateTagInput } from '../model/tag';
import { tagService } from '../services/TagService';

export function useTags() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTags = useCallback(async () => {
        try {
            setLoading(true);
            const data = await tagService.getAll();
            setTags(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    return { tags, loading, refresh: fetchTags };
}

export function useCreateTag() {
    const [loading, setLoading] = useState(false);

    const createTag = async (input: CreateTagInput) => {
        try {
            setLoading(true);
            const id = await tagService.create(input);
            return id;
        } finally {
            setLoading(false);
        }
    };
    return { createTag, loading };
}
