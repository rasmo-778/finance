import React from 'react';
import { Home, PieChart, Calendar } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const triggerHaptic = () => {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    } catch {
      // ignore
    }
  };

  const handleSelect = (tab: ActiveTab) => {
    triggerHaptic();
    onChangeTab(tab);
  };

  const tabs: { id: ActiveTab; label: string; icon: React.FC<{ size?: number; strokeWidth?: number }> }[] = [
    { id: 'home', label: 'Главная', icon: Home },
    { id: 'analysis', label: 'Анализ', icon: PieChart },
    { id: 'calendar', label: 'Календарь', icon: Calendar },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center pointer-events-none px-4 pb-[env(safe-area-inset-bottom,0px)]">
      <nav
        id="bottom-navigation-bar"
        className="pointer-events-auto relative flex items-center justify-around p-1.5 rounded-full border nav-dock-glow transition-all"
        style={{
          background: 'rgba(22, 26, 35, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          width: 'calc(100% - 32px)',
          maxWidth: '360px',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              type="button"
              onClick={() => handleSelect(tab.id)}
              className={`relative flex items-center justify-center py-3 px-6 rounded-full transition-all duration-200 cursor-pointer ${
                isActive ? 'scale-100 shadow-md font-bold' : 'hover:opacity-100 opacity-60 active:scale-95'
              }`}
              style={{
                backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                color: isActive ? '#0E1117' : '#8A94A6',
              }}
              aria-label={tab.label}
            >
              <div className="flex items-center gap-2">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <span className="text-xs font-bold font-display tracking-tight whitespace-nowrap">
                    {tab.label}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
