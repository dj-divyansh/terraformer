import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Folder, ClipboardList, Wrench, Settings, Bell, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Header() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-[#0f172a] text-white shadow-md">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold tracking-tight text-white">fresh</span>
              <span className="text-xl font-bold tracking-tight text-sky-400">gravity</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link 
              to="/" 
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive('/') 
                  ? "bg-slate-800 text-white border border-slate-700 shadow-sm" 
                  : "text-gray-300 hover:text-white hover:bg-slate-800"
              )}
            >
              <LayoutDashboard size={16} className={isActive('/') ? "text-sky-400" : "text-gray-400"} />
              <span>API Dashboard</span>
            </Link>
            
            <Link 
              to="/resources" 
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive('/resources') 
                  ? "bg-slate-800 text-white border border-slate-700 shadow-sm" 
                  : "text-gray-300 hover:text-white hover:bg-slate-800"
              )}
            >
              <Folder size={16} className={isActive('/resources') ? "text-sky-400" : "text-gray-400"} />
              <span>Resource Browser</span>
            </Link>

            <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-800 opacity-50 cursor-not-allowed">
              <ClipboardList size={16} className="text-gray-400" />
              <span>Requirements</span>
            </a>
            <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-800 opacity-50 cursor-not-allowed">
              <Wrench size={16} className="text-gray-400" />
              <span>AIDE</span>
            </a>
            <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-800 opacity-50 cursor-not-allowed">
              <Settings size={16} className="text-gray-400" />
              <span>Admin</span>
            </a>
          </nav>

          {/* Right Section: Notifications & Profile */}
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-3 text-right">
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">Divyansh Jain</p>
                <p className="text-xs text-gray-400">divyansh.jain@freshgravity.com</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center border border-gray-500">
                <User size={18} className="text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
