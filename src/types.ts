export interface Flashcard {
    id: string;
    kanji: string;
    reading: string;
    meaning: string;
    exampleSentence?: string;
}

export interface Topic {
    id: string;
    name: string;
    category: 'vocabulary' | 'kanji';
    cardCount: number;
    createdAt: number;
}

export interface StudySession {
    id: string;
    topicId: string;
    date: number;
    totalCards: number;
    correctCount: number; // Cards rated > 3
    durationSeconds: number;
}

export interface UserProgress {
    topicId: string;
    cardsLearned: number;
    lastStudied: number;
}
