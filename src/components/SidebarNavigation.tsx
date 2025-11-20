import React, { useState } from 'react';
import {
  BarChart3,
  Users,
  Target,
  TrendingUp,
  CheckCircle2,
  Inbox,
  Clock,
  Package,
  AlertTriangle,
  Settings,
  PlayCircle,
  Menu,
  X,
  Activity,
  Layers,
} from 'lucide-react';

type ViewMode = 'sprint' | 'multiSprint' | 'performance' | 'evolution' | 'quality' | 'inconsistencies' | 'backlog' | 'backlogFlow' | 'worklog' | 'delivery';

interface SidebarNavigationProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onSettingsClick: () => void;
  onPresentationClick: () => void;
  presentationIsPlaying: boolean;
  onSidebarToggle?: (isOpen: boolean) => void;
}

interface NavItem {
  id: ViewMode | 'settings' | 'presentation';
  label: string;
  icon: React.ElementType;
  gradient: string;
  hoverGradient: string;
}

const navItems: NavItem[] = [
  {
    id: 'sprint',
    label: 'Sprint Ativo',
    icon: BarChart3,
    gradient: 'from-blue-600 to-blue-500',
    hoverGradient: 'hover:from-blue-700 hover:to-blue-600',
  },
  {
    id: 'multiSprint',
    label: 'Multi-Sprint',
    icon: Layers,
    gradient: 'from-purple-600 to-purple-500',
    hoverGradient: 'hover:from-purple-700 hover:to-purple-600',
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: Target,
    gradient: 'from-green-600 to-green-500',
    hoverGradient: 'hover:from-green-700 hover:to-green-600',
  },
  {
    id: 'evolution',
    label: 'Evolução Temporal',
    icon: TrendingUp,
    gradient: 'from-purple-600 to-indigo-500',
    hoverGradient: 'hover:from-purple-700 hover:to-indigo-600',
  },
  {
    id: 'quality',
    label: 'Qualidade dos Chamados',
    icon: CheckCircle2,
    gradient: 'from-green-600 to-emerald-500',
    hoverGradient: 'hover:from-green-700 hover:to-emerald-600',
  },
  {
    id: 'backlog',
    label: 'Backlog',
    icon: Inbox,
    gradient: 'from-gray-600 to-gray-500',
    hoverGradient: 'hover:from-gray-700 hover:to-gray-600',
  },
  {
    id: 'backlogFlow',
    label: 'Fluxo & Capacidade',
    icon: Activity,
    gradient: 'from-slate-600 to-slate-500',
    hoverGradient: 'hover:from-slate-700 hover:to-slate-600',
  },
  {
    id: 'worklog',
    label: 'Worklogs',
    icon: Clock,
    gradient: 'from-indigo-600 to-indigo-500',
    hoverGradient: 'hover:from-indigo-700 hover:to-indigo-600',
  },
  {
    id: 'delivery',
    label: 'Gestão de Entregas',
    icon: Package,
    gradient: 'from-orange-600 to-orange-500',
    hoverGradient: 'hover:from-orange-700 hover:to-orange-600',
  },
  {
    id: 'inconsistencies',
    label: 'Inconsistências',
    icon: AlertTriangle,
    gradient: 'from-red-600 to-orange-500',
    hoverGradient: 'hover:from-red-700 hover:to-orange-600',
  },
];

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  viewMode,
  onViewModeChange,
  onSettingsClick,
  onPresentationClick,
  presentationIsPlaying,
  onSidebarToggle,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  const handleDesktopToggle = () => {
    const newState = !isDesktopOpen;
    setIsDesktopOpen(newState);
    if (onSidebarToggle) {
      onSidebarToggle(newState);
    }
  };

  const handleNavClick = (item: NavItem) => {
    if (item.id === 'settings') {
      onSettingsClick();
    } else if (item.id === 'presentation') {
      onPresentationClick();
    } else {
      onViewModeChange(item.id as ViewMode);
    }
    setIsMobileOpen(false);
  };

  const SidebarContent = ({ showToggle = false }: { showToggle?: boolean }) => (
    <div className="h-full flex flex-col">
      {/* Logo/Header */}
      <div className={`border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 ${isDesktopOpen ? 'px-6 py-6' : 'px-3 py-4'}`}>
        {isDesktopOpen ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-lg ring-2 ring-blue-500/20 flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Navegação</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Análises e Dashboards</p>
              </div>
            </div>
            {showToggle && (
              <button
                onClick={handleDesktopToggle}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300 flex-shrink-0"
                aria-label="Ocultar menu"
                title="Ocultar menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {showToggle && (
              <button
                onClick={handleDesktopToggle}
                className="w-full p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300 flex items-center justify-center"
                aria-label="Mostrar menu"
                title="Mostrar menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = viewMode === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              title={!isDesktopOpen ? item.label : undefined}
                className={`
                w-full flex items-center rounded-xl
                transition-all duration-300 ease-in-out
                group relative overflow-hidden
                ${
                  isDesktopOpen 
                    ? 'gap-3 px-4 py-3' 
                    : 'justify-center px-3 py-3'
                }
                ${
                  isActive
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                    : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/70 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                }
              `}
              style={isActive ? { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' } : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full shadow-lg" />
              )}
              
              {/* Active glow effect */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl" />
              )}
              
              {/* Icon */}
              <div
                className={`
                  flex-shrink-0 p-1.5 rounded-lg transition-all duration-300
                  ${
                    isActive
                      ? 'bg-white/20'
                      : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                  }
                `}
              >
                <Icon
                  className={`
                    w-4 h-4 transition-all duration-300
                    ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}
                  `}
                />
              </div>
              
              {/* Label */}
              {isDesktopOpen && (
                <span
                  className={`
                    flex-1 text-left font-medium text-sm transition-all duration-300
                    ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}
                  `}
                >
                  {item.label}
                </span>
              )}

              {/* Hover effect */}
              {!isActive && (
                <div
                  className={`
                    absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5
                    transition-opacity duration-300 rounded-xl
                  `}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
        <button
          onClick={() => handleNavClick({ id: 'settings', label: 'Configurações', icon: Settings, gradient: '', hoverGradient: '' })}
          title={!isDesktopOpen ? 'Configurações' : undefined}
          className={`
            w-full flex items-center rounded-xl bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/70 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300 group
            ${isDesktopOpen ? 'gap-3 px-4 py-3' : 'justify-center px-3 py-3'}
          `}
        >
          <div className="flex-shrink-0 p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-all duration-300">
            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-all duration-300" />
          </div>
          {isDesktopOpen && (
            <span className="flex-1 text-left font-medium text-sm">Configurações</span>
          )}
        </button>

        <button
          onClick={() => handleNavClick({ id: 'presentation', label: 'Apresentação', icon: PlayCircle, gradient: '', hoverGradient: '' })}
          title={!isDesktopOpen ? 'Apresentação' : undefined}
          className={`
            w-full flex items-center rounded-xl transition-all duration-300 group
            ${isDesktopOpen ? 'gap-3 px-4 py-3' : 'justify-center px-3 py-3'}
            ${
              presentationIsPlaying
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/70 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
            }
          `}
        >
          <div
            className={`
              flex-shrink-0 p-1.5 rounded-lg transition-all duration-300
              ${
                presentationIsPlaying
                  ? 'bg-white/20'
                  : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
              }
            `}
          >
            <PlayCircle
              className={`
                w-4 h-4 transition-all duration-300
                ${presentationIsPlaying ? 'text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}
              `}
            />
          </div>
          {isDesktopOpen && (
            <span
              className={`
                flex-1 text-left font-medium text-sm transition-all duration-300
                ${presentationIsPlaying ? 'text-white' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}
              `}
            >
              Apresentação
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-shrink-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-r border-gray-200 dark:border-gray-700 shadow-xl
          transition-all duration-300 ease-in-out overflow-hidden
          ${isDesktopOpen ? 'w-72' : 'w-20'}
        `}
      >
        <SidebarContent showToggle={true} />
      </aside>

      {/* Floating Toggle Button - Only visible when sidebar is collapsed */}
      {!isDesktopOpen && (
        <button
          onClick={handleDesktopToggle}
          className="hidden lg:flex fixed left-4 top-4 z-40 p-3 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Abrir menu"
          title="Abrir menu de navegação"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 active:scale-95"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 animate-fade-in"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl border-r border-gray-200 dark:border-gray-700 animate-slide-in-left">
            <SidebarContent showToggle={false} />
          </aside>
        </>
      )}
    </>
  );
};

