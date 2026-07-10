import { useState } from 'react';

export default function MobileNav({ activeSection, onNavigate }) {
  const sections = [
    { id: 'search', label: '🔍', name: 'Search' },
    { id: 'feed', label: '📰', name: 'Feed' },
    { id: 'map', label: '🗺️', name: 'Map' },
    { id: 'community', label: '🤝', name: 'Community' },
    { id: 'profile', label: '👤', name: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 sm:hidden">
      <div className="flex items-center justify-around py-2">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onNavigate(section.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition ${
              activeSection === section.id
                ? 'text-emerald-600 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-lg">{section.label}</span>
            <span className="text-[10px]">{section.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
