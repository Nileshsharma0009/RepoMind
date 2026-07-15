import React from 'react';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';

export default function MainLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-neutral-950 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={title} subtitle={subtitle} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
