import React from 'react';
import { LayoutDashboard, BarChart3, Bot, History, User, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, setIsAnalyzeModalOpen, setSelectedTestId } = useApp();

  const navItems = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'analysis', label: 'Analysis', icon: BarChart3 },
    { id: 'coach', label: 'AI Coach', icon: Bot },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ] as const;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2EAE4] px-2 py-2 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id || (item.id === 'analysis' && currentTab === 'analytics');
          return (
            <button
              key={item.id}
              onClick={() => {
                setSelectedTestId(null);
                setCurrentTab(item.id);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isActive ? 'text-[#14281D] scale-105 font-bold' : 'text-gray-400 hover:text-gray-600 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-colors ${
                  isActive ? 'bg-[#B4F04C] text-[#14281D]' : ''
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* Floating Quick Action for Mobile */}
        <button
          onClick={() => setIsAnalyzeModalOpen(true)}
          className="absolute -top-6 right-4 w-11 h-11 rounded-full bg-[#14281D] text-[#B4F04C] border-2 border-[#B4F04C] flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
          aria-label="Analyze new test"
        >
          <Plus className="w-5 h-5 stroke-[2.75]" />
        </button>
      </div>
    </div>
  );
};
