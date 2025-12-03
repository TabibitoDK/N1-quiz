import { useEffect, useState } from 'react';
import type { Topic } from '../types';
import { Link } from 'react-router-dom';
import { Book, Type, Play } from 'lucide-react';
import { loadTopics } from '../lib/csvLoader';
import { motion } from 'framer-motion';

export default function TopicSelectionPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load topics from local CSV files
    const fetchedTopics = loadTopics();
    setTopics(fetchedTopics);
    setLoading(false);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-20">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Select Deck
        </h2>
        <p className="text-[var(--color-text-dim)] text-sm">Choose a topic to start practicing.</p>
      </div>

      {topics.length === 0 ? (
        <div className="glass-panel p-8 text-center mx-4">
          <p className="text-lg text-[var(--color-text-dim)] mb-2">No decks found.</p>
          <p className="text-xs text-[var(--color-text-dim)] opacity-60">Add .csv files to the 'csvs' folder.</p>
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 px-2"
        >
          {topics.map(topic => (
            <motion.div key={topic.id} variants={item}>
                <div 
                  className="block group relative overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1 transition-all hover:border-[var(--color-primary)] hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative flex flex-col gap-4 p-4 rounded-[20px] bg-[rgba(15,23,42,0.6)] backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      {/* Icon Box */}
                      <div className={`shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${
                        topic.category === 'kanji' 
                          ? 'bg-gradient-to-br from-pink-500/20 to-rose-600/20 text-pink-400 border border-pink-500/30' 
                          : 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {topic.category === 'kanji' ? <Type size={32} /> : <Book size={32} />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                             topic.category === 'kanji' ? 'bg-pink-500/10 text-pink-400' : 'bg-cyan-500/10 text-cyan-400'
                          }`}>
                            {topic.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white truncate leading-tight mb-1">
                          {topic.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-[var(--color-text-dim)]">
                          <span className="flex items-center gap-1">
                            <Book size={12} />
                            {topic.cardCount} Cards
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Link 
                        to={`/game/${topic.id}`}
                        className="flex items-center justify-center gap-2 py-2 rounded-xl bg-[var(--glass-surface)] hover:bg-[var(--color-primary)] hover:text-white transition-colors text-sm font-medium text-[var(--color-text-dim)]"
                      >
                        <Play size={16} /> Flashcards
                      </Link>
                      <Link 
                        to={`/quiz/${topic.id}`}
                        className="flex items-center justify-center gap-2 py-2 rounded-xl bg-[var(--glass-surface)] hover:bg-[var(--color-accent)] hover:text-white transition-colors text-sm font-medium text-[var(--color-text-dim)]"
                      >
                        <Type size={16} /> Quiz
                      </Link>
                    </div>
                  </div>
                </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
