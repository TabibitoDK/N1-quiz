import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Trophy, RotateCcw, Home, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { StudySession } from '../types';

export default function SummaryPage() {
  const location = useLocation();
  const state = location.state as { total: number; correct: number; topicId: string } | null;
  const [history, setHistory] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(!state);

  useEffect(() => {
    if (!state) {
      const fetchHistory = async () => {
        try {
          const q = query(
            collection(db, 'users', 'guest', 'sessions'),
            orderBy('date', 'desc'),
            limit(10)
          );
          const snapshot = await getDocs(q);
          const sessions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as StudySession[];
          setHistory(sessions);
        } catch (err) {
          console.error("Error fetching history:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [state]);

  // View: Session Result (Immediate)
  if (state) {
    const percentage = Math.round((state.correct / state.total) * 100);
    let message = "Keep practicing!";
    if (percentage >= 90) message = "Outstanding!";
    else if (percentage >= 70) message = "Great job!";
    else if (percentage >= 50) message = "Good effort!";

    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[80vh]">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-panel p-8 w-full text-center relative overflow-hidden"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[var(--color-primary)] rounded-full blur-[80px] opacity-20" />
          <div className="relative z-10">
            <motion.div 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="inline-block p-4 rounded-full bg-yellow-500/20 text-yellow-400 mb-6"
            >
              <Trophy size={48} />
            </motion.div>
            <h2 className="text-3xl font-bold mb-2">{message}</h2>
            <p className="text-[var(--color-text-dim)] mb-8">Session Complete</p>
            <div className="flex justify-center items-end gap-2 mb-8">
              <span className="text-6xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
                {percentage}%
              </span>
              <span className="text-xl text-[var(--color-text-dim)] mb-2">
                ({state.correct}/{state.total})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Link to={`/game/${state.topicId}`} className="btn-primary flex items-center justify-center gap-2">
                <RotateCcw size={20} /> Retry
              </Link>
              <Link to="/" className="btn-secondary flex items-center justify-center gap-2">
                <Home size={20} /> Home
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // View: History List
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
        Challenge History
      </h2>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <p className="text-xl text-[var(--color-text-dim)] mb-4">No history found.</p>
          <Link to="/" className="btn-primary inline-block">Start Playing</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((session) => {
            const percentage = Math.round((session.correctCount / session.totalCards) * 100);
            const date = session.date ? new Date((session.date as any).seconds * 1000).toLocaleDateString() : 'Unknown';
            
            return (
              <div key={session.id} className="glass-panel p-6 flex items-center justify-between hover:bg-[var(--color-surface-hover)] transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${percentage >= 80 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    <Trophy size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{percentage}%</span>
                      <span className="text-sm text-[var(--color-text-dim)]">({session.correctCount}/{session.totalCards})</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-dim)]">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {date}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {Math.round(session.durationSeconds)}s</span>
                    </div>
                  </div>
                </div>
                
                <Link to={`/game/${session.topicId}`} className="btn-secondary text-sm">
                  Retry
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
