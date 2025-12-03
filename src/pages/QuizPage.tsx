import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Flashcard } from '../types';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X } from 'lucide-react';
import { loadCards } from '../lib/csvLoader';

interface Question {
  card: Flashcard;
  sentence: string;
  options: Flashcard[];
  correctOptionIndex: number;
}

export default function QuizPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!topicId) return;

    const cards = loadCards(topicId);
    // Filter cards that have example sentences
    const validCards = cards.filter(c => c.exampleSentences && c.exampleSentences.length > 0);

    if (validCards.length < 4) {
      setLoading(false);
      return;
    }

    // Generate questions
    const generatedQuestions: Question[] = validCards.map(card => {
      // Pick a random sentence
      const sentence = card.exampleSentences[Math.floor(Math.random() * card.exampleSentences.length)];
      
      // Create cloze sentence (replace kanji with blanks)
      // Simple replacement for now, might need more robust matching if kanji is conjugated
      // For N1 vocabulary, usually the word is distinct. 
      // We will try to replace the kanji. If not found (e.g. conjugation), we might just show the sentence as is?
      // Or better, we assume the sentence contains the word. 
      // Let's try to replace the word.
      const clozeSentence = sentence.replace(card.kanji, '______');

      // Select 3 distractors
      const otherCards = cards.filter(c => c.id !== card.id);
      const distractors = [];
      const usedIndices = new Set<number>();
      
      while (distractors.length < 3) {
        const idx = Math.floor(Math.random() * otherCards.length);
        if (!usedIndices.has(idx)) {
          usedIndices.add(idx);
          distractors.push(otherCards[idx]);
        }
      }

      // Combine and shuffle options
      const options = [card, ...distractors];
      // Fisher-Yates shuffle
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      return {
        card,
        sentence: clozeSentence,
        options,
        correctOptionIndex: options.findIndex(o => o.id === card.id)
      };
    });

    // Shuffle questions
    const shuffledQuestions = generatedQuestions.sort(() => Math.random() - 0.5);
    
    setQuestions(shuffledQuestions);
    setLoading(false);
  }, [topicId]);

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;
    
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === questions[currentIndex].correctOptionIndex) {
      setScore(prev => prev + 1);
    }

    // Auto advance after delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        finishQuiz();
      }
    }, 1500);
  };

  const finishQuiz = async () => {
    // Reuse session logic or create new quiz collection?
    // For now, let's just navigate to summary with a flag
    const duration = (Date.now() - startTime) / 1000;
    
    // Optional: Save to firebase
    try {
        await addDoc(collection(db, 'users', 'guest', 'quiz_sessions'), {
            topicId,
            date: serverTimestamp(),
            totalQuestions: questions.length,
            score,
            durationSeconds: duration
        });
    } catch (e) {
        console.error("Error saving quiz result", e);
    }

    navigate('/summary', { state: { 
      total: questions.length, 
      correct: score + (selectedOption === questions[currentIndex].correctOptionIndex ? 1 : 0), // Add last point if correct
      topicId,
      mode: 'quiz'
    }});
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl mb-4">Not enough cards with example sentences.</h2>
        <p className="text-[var(--color-text-dim)] mb-8">Need at least 4 cards with examples to generate a quiz.</p>
        <button onClick={() => navigate('/')} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center min-h-[80vh] justify-center relative px-4">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[var(--glass-border)] rounded-full overflow-hidden mb-8">
        <motion.div 
          className="h-full bg-[var(--color-primary)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <div className="w-full flex justify-between items-center mb-8">
        <button onClick={() => navigate('/')} className="text-[var(--color-text-dim)] hover:text-white transition-colors">
          <ArrowLeft />
        </button>
        <span className="font-mono text-[var(--color-text-dim)]">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Question Card */}
      <div className="w-full glass-panel p-8 mb-8 flex flex-col items-center text-center">
        <h3 className="text-[var(--color-text-dim)] uppercase tracking-wider text-sm mb-4">Fill in the blank</h3>
        <p className="text-xl md:text-2xl font-jp leading-relaxed mb-6">
          {currentQuestion.sentence}
        </p>
        <div className="w-16 h-1 bg-[var(--glass-border)] rounded-full mb-6" />
        <p className="text-lg text-[var(--color-accent)]">
          {currentQuestion.card.meaning}
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {currentQuestion.options.map((option, idx) => {
          let stateClass = "hover:bg-[var(--glass-surface)] border-transparent";
          
          if (isAnswered) {
            if (idx === currentQuestion.correctOptionIndex) {
              stateClass = "bg-green-500/20 border-green-500 text-green-200";
            } else if (idx === selectedOption) {
              stateClass = "bg-red-500/20 border-red-500 text-red-200";
            } else {
              stateClass = "opacity-50 border-transparent";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionClick(idx)}
              disabled={isAnswered}
              className={`
                p-6 rounded-xl border-2 glass-panel transition-all duration-200
                flex items-center justify-center text-2xl font-bold font-jp
                ${stateClass}
              `}
            >
              {option.kanji}
              {isAnswered && idx === currentQuestion.correctOptionIndex && (
                <Check className="ml-2 w-5 h-5" />
              )}
              {isAnswered && idx === selectedOption && idx !== currentQuestion.correctOptionIndex && (
                <X className="ml-2 w-5 h-5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
