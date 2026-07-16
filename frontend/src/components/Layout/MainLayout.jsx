import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import { ChevronRight } from 'lucide-react';

export default function MainLayout({ title, subtitle, children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const toggleSidebar = () => {
    const nextState = !sidebarCollapsed;
    setSidebarCollapsed(nextState);
    localStorage.setItem('sidebarCollapsed', String(nextState));
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex relative">
      <Sidebar collapsed={sidebarCollapsed} />
      
      {/* Floating Pull-tab handle sticker for collapsible sidebar */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="fixed left-0 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-500 text-white py-3 px-1 rounded-r-xl border border-l-0 border-purple-500/20 shadow-theme-glow transition-all hover:pr-2.5 z-[9999] flex items-center justify-center"
          title="Expand Sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          title={title} 
          subtitle={subtitle} 
          sidebarCollapsed={sidebarCollapsed} 
          toggleSidebar={toggleSidebar} 
        />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
