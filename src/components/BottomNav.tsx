import React from 'react';
import { Home, PieChart, Calendar } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

const tabs: { id: ActiveTab; label: string; Icon: React.FC<{ size?: number; strokeWidth?: number }> }[] = [
  { id: 'home',     label: 'Главная',   Icon: Home },
  { id: 'analysis', label: 'Анализ',    Icon: PieChart },
  { id: 'calendar', label: 'Календарь', Icon: Calendar },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const triggerHaptic = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } catch {
      // ignore
    }
  };

  const handleSelect = (tab: ActiveTab) => {
    triggerHaptic();
    onChangeTab(tab);
  };

  return (
    <nav
      id="bottom-navigation-bar"
      className="nav-bar"
      aria-label="Основная навигация"
    >
      <div className="flex items-center justify-around px-2 pt-3 pb-2">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              id={`nav-tab-${id}`}
              type="button"
              onClick={() => handleSelect(id)}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                /* fixed-size square tap zone */
                width: '3.5rem',
                height: '3.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                borderRadius: '14px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'opacity 0.15s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Active accent dot above icon */}
              <span
                style={{
                  display: 'block',
                  width: '4px',
                  height: '4px',
                  borderRadius: '999px',
                  backgroundColor: isActive ? 'var(--text-primary)' : 'transparent',
                  transition: 'background-color 0.15s',
                  flexShrink: 0,
                }}
              />

              {/* Icon */}
              <Icon
                size={22}
                strokeWidth={isActive ? 2 : 1.75}
                style={{
                  color: isActive ? 'var(--nav-active-color)' : 'var(--nav-inactive-color)',
                  transition: 'color 0.15s',
                  flexShrink: 0,
                }}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
};
