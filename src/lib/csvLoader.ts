import Papa from 'papaparse';
import type { Topic, Flashcard } from '../types';

// Import all CSV files from the csvs directory in the project root
// Note: In Vite, we can import from outside src if configured, or we can move csvs to src/assets
// For now, let's assume we can use a relative path or the user moves them. 
// Actually, the most robust way in Vite without config changes is to put them in src or public.
// However, if we use ?raw, we can import them.
// Let's try to import from the root 'csvs' folder using a relative path from here (src/lib) -> ../../csvs
// If this fails, we might need to ask user to move folder to src.
const csvFiles = import.meta.glob('../../csvs/*.csv', { as: 'raw', eager: true });

export const loadTopics = (): Topic[] => {
    const topics: Topic[] = [];

    for (const path in csvFiles) {
        const content = csvFiles[path] as string;
        const filename = path.split('/').pop()?.replace('.csv', '') || 'Unknown';

        // Parse to get count
        const result = Papa.parse(content, { header: true, skipEmptyLines: true });
        const count = result.data.length;

        // Determine category based on filename or content? 
        // For now, default to 'vocabulary' unless 'kanji' is in name
        const category = filename.toLowerCase().includes('kanji') ? 'kanji' : 'vocabulary';

        topics.push({
            id: filename, // Use filename as ID
            name: filename,
            category,
            cardCount: count,
            createdAt: Date.now() // Mock date
        });
    }

    return topics;
};

export const loadCards = (topicId: string): Flashcard[] => {
    // Find the file that matches the topicId (filename)
    const path = Object.keys(csvFiles).find(p => p.includes(`/${topicId}.csv`));

    if (!path) return [];

    const content = csvFiles[path] as string;
    const result = Papa.parse(content, { header: true, skipEmptyLines: true });

    return result.data.map((row: any, index) => {
        // Auto-detect columns similar to UploadPage logic
        const keys = Object.keys(row);
        const kanjiKey = keys.find(k => k.toLowerCase().includes('kanji') || k.toLowerCase().includes('word')) || keys[0];
        const readingKey = keys.find(k => k.toLowerCase().includes('reading') || k.toLowerCase().includes('kana')) || keys[1];
        const meaningKey = keys.find(k => k.toLowerCase().includes('meaning') || k.toLowerCase().includes('english')) || keys[2];

        return {
            id: `${topicId}-${index}`,
            kanji: row[kanjiKey] || '?',
            reading: row[readingKey] || '',
            meaning: row[meaningKey] || '?',
            exampleSentences: keys
                .filter(k => k.toLowerCase().includes('example') || k.toLowerCase().includes('question'))
                .map(k => row[k])
                .filter(s => s && s.trim().length > 0)
        };
    }) as Flashcard[];
};
