import { Link, useLocation } from 'react-router-dom';
import { Boxes, Search, BarChart3, FileUp, Home, X } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const items = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/wizard', label: 'Builder', icon: Boxes },
  { path: '/analysis', label: 'Analysis', icon: BarChart3 },
  { path: '/browser', label: 'Browse', icon: Search },
  { path: '/import', label: 'Import', icon: FileUp },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-50 h-full w-64 glass border-r border-border/50 transform transition-transform duration-200 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <span className="text-primary font-bold">Menu</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-hover">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-2 flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path
              || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-text-secondary hover:text-text hover:bg-hover',
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
