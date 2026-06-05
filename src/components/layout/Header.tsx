import { Link, useLocation } from 'react-router-dom';
import { Boxes, Search, BarChart3, FileUp, HelpCircle, Home } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useCubeStore } from '../../stores/cubeStore';
import { clsx } from 'clsx';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/wizard', label: 'Builder', icon: Boxes },
  { path: '/analysis', label: 'Analysis', icon: BarChart3 },
  { path: '/browser', label: 'Browse', icon: Search },
  { path: '/import', label: 'Import', icon: FileUp },
];

export default function Header() {
  const location = useLocation();
  const setShowHelp = useUIStore((s) => s.setShowHelp);
  const isBuilding = useCubeStore((s) => s.isBuilding);
  const cancel = useCubeStore((s) => s.cancel);

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50">
      <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-lg">
            <Boxes className="w-5 h-5" />
            <span className="hidden sm:inline">Rabid Cube Builder</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path
                || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'text-text-secondary hover:text-text hover:bg-hover',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {isBuilding && (
            <button
              onClick={cancel}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-danger/15 text-danger hover:bg-danger/25 transition-colors"
            >
              Cancel Build
            </button>
          )}
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-md text-text-muted hover:text-text hover:bg-hover transition-colors"
            title="How to use"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
