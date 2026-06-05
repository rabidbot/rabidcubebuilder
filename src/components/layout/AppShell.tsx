import { Outlet } from 'react-router-dom';
import Header from './Header';
import OnboardingModal from './OnboardingModal';
import { useToastStore } from '../../stores/toastStore';
import { useUIStore } from '../../stores/uiStore';

export default function AppShell() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);
  const showHelp = useUIStore((s) => s.showHelp);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      {showHelp && <OnboardingModal />}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-enter px-4 py-2 rounded-lg text-sm font-medium shadow-lg cursor-pointer ${
              t.type === 'error' ? 'bg-danger/20 text-danger border border-danger/30'
              : t.type === 'success' ? 'bg-success/20 text-success border border-success/30'
              : 'bg-info/20 text-info border border-info/30'
            }`}
            onClick={() => removeToast(t.id)}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
