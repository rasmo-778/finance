import React from 'react';
import { Home, PieChart, Calendar } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

const tabs: { id: ActiveTab; label: string; Icon: React.FC<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }> }[] = [
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
      <div className="flex items-center justify-around px-2 pt-2 pb-2">
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
              className="nav-tab-button"
              style={{
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
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Active accent dot above icon with smooth transition */}
              <span
                style={{
                  display: 'block',
                  width: isActive ? '5px' : '0px',
                  height: isActive ? '5px' : '0px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--text-primary)',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: isActive ? 1 : 0,
                  flexShrink: 0,
                }}
              />

              {/* Icon with smooth scale & color fade transition */}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.25 : 1.75}
                style={{
                  color: isActive ? 'var(--nav-active-color)' : 'var(--nav-inactive-color)',
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  transition: 'color 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
