import { Link, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, Home } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-full min-h-screen relative overflow-hidden">
      {/* Top Header Area */}
      <header className="px-6 pt-8 pb-4 z-10 bg-gradient-to-b from-[var(--color-bg)] to-transparent">
        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-white via-purple-200 to-slate-400 bg-clip-text text-transparent drop-shadow-sm">
            JLPT MASTER
          </h1>
          <p className="text-[10px] font-bold text-[var(--color-primary)] tracking-[0.3em] uppercase opacity-80">
            Flashcard Game
          </p>
        </div>

        {/* Tab Navigation */}
        <nav className="flex p-1 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-2xl">
          <Link 
            to="/" 
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-300 text-sm font-bold ${isActive('/') ? 'bg-[var(--color-surface-hover)] text-white shadow-md' : 'text-[var(--color-text-dim)] hover:text-white'}`}
          >
            <Home size={16} />
            <span>Home</span>
          </Link>
          
          <Link 
            to="/summary" 
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-300 text-sm font-bold ${isActive('/summary') ? 'bg-[var(--color-surface-hover)] text-white shadow-md' : 'text-[var(--color-text-dim)] hover:text-white'}`}
          >
            <BarChart3 size={16} />
            <span>Stats</span>
          </Link>
        </nav>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto px-4 pb-8 scrollbar-hide">
        <Outlet />
      </main>
      
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none max-w-[480px] mx-auto">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-10%] w-[60%] h-[40%] bg-cyan-600/20 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
