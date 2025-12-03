import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Flashcard } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCw, Check, X } from 'lucide-react';
import { loadCards } from '../lib/csvLoader';

export default function GamePage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState<{cardId: string, rating: number}[]>([]);
  const [startTime] = useState(Date.now());

  const location = useLocation();
  const state = location.state as { customCards?: Flashcard[] } | null;

  useEffect(() => {
    if (!topicId) return;

    if (state?.customCards) {
      setCards(state.customCards);
      setLoading(false);
      return;
    }

    // Load cards from local CSV
    const fetchedCards = loadCards(topicId);
    
    // Shuffle cards
    const shuffled = fetchedCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setLoading(false);
  }, [topicId, state]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRate = async (rating: number) => {
    const currentCard = cards[currentIndex];
    const newResults = [...sessionResults, { cardId: currentCard.id, rating }];
    setSessionResults(newResults);

    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200); // Slight delay for animation
    } else {
      await finishSession(newResults);
    }
  };

  const finishSession = async (results: {cardId: string, rating: number}[]) => {
    if (!topicId) return;

    const correctCount = results.filter(r => r.rating >= 3).length;
    const duration = (Date.now() - startTime) / 1000;

    try {
      // Save session
      await addDoc(collection(db, 'users', 'guest', 'sessions'), {
        topicId,
        date: serverTimestamp(),
        totalCards: cards.length,
        correctCount,
        durationSeconds: duration,
        results
      });

      // Navigate to summary
      // Navigate to summary
      const missedCards = cards.filter(c => {
          const result = results.find(r => r.cardId === c.id);
          return result && result.rating < 3;
      });

      navigate('/summary', { state: { 
        total: cards.length, 
        correct: correctCount, 
        topicId,
        missedCards 
      }});
    } catch (err) {
      console.error("Error saving session:", err);
      // Navigate anyway
      navigate('/summary', { state: { total: cards.length, correct: correctCount, topicId } });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl mb-4">No cards found in this deck.</h2>
        <button onClick={() => navigate('/')} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex) / cards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center min-h-[80vh] justify-center relative">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[var(--glass-border)] rounded-full overflow-hidden mb-8">
        <motion.div 
          className="h-full bg-[var(--color-primary)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <div className="w-full flex justify-between items-center mb-8 px-4">
        <button onClick={() => navigate('/')} className="text-[var(--color-text-dim)] hover:text-white transition-colors">
          <ArrowLeft />
        </button>
        <span className="font-mono text-[var(--color-text-dim)]">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Card Container */}
      <div className="perspective-1000 w-full aspect-[4/3] relative cursor-pointer group" onClick={handleFlip}>
        <motion.div
          className="w-full h-full relative preserve-3d transition-all duration-500"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden glass-panel flex flex-col items-center justify-center p-8 border-2 border-transparent group-hover:border-[var(--color-primary-glow)] transition-colors">
            <span className="text-6xl md:text-8xl font-bold font-jp text-center mb-4">
              {currentCard.kanji}
            </span>
            <p className="text-[var(--color-text-dim)] text-sm mt-8 flex items-center gap-2">
              <RotateCw size={16} /> Click to flip
            </p>
          </div>

          {/* Back */}
          <div 
            className="absolute inset-0 backface-hidden glass-panel flex flex-col items-center justify-center p-8 rotate-y-180 border-2 border-[var(--color-primary)]"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <div className="text-center space-y-6">
              <div>
                <p className="text-sm text-[var(--color-text-dim)] uppercase tracking-wider mb-1">Reading</p>
                <p className="text-3xl md:text-4xl font-jp text-[var(--color-accent)]">{currentCard.reading}</p>
              </div>
              
              <div className="w-16 h-1 bg-[var(--glass-border)] mx-auto rounded-full" />
              
              <div>
                <p className="text-sm text-[var(--color-text-dim)] uppercase tracking-wider mb-1">Meaning</p>
                <p className="text-xl md:text-2xl">{currentCard.meaning}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="mt-8 w-full h-24 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!isFlipped ? (
            <motion.button
              key="show-answer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={handleFlip}
              className="btn-primary w-full max-w-xs text-lg"
            >
              Show Answer
            </motion.button>
          ) : (
            <motion.div
              key="ratings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            <motion.div
              key="ratings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-4 w-full max-w-md px-4"
            >
              <button
                onClick={(e) => { e.stopPropagation(); handleRate(1); }}
                className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 transition-all"
              >
                <X size={32} className="mb-1" />
                <span className="font-bold">Don't Know</span>
              </button>
              
              <button
                onClick={(e) => { e.stopPropagation(); handleRate(5); }}
                className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-200 border border-green-500/30 transition-all"
              >
                <Check size={32} className="mb-1" />
                <span className="font-bold">Know</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
