import React from 'react';
import { GraduationCap, Users, Clock, BarChart3, UserPlus, CreditCard, QrCode } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Header({ activeView, onViewChange }: HeaderProps) {
  const { user, signOut } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'sessions', label: 'Sessions', icon: GraduationCap },
    { id: 'id-cards', label: 'ID Cards', icon: CreditCard },
    { id: 'id-management', label: 'ID Management', icon: BarChart3 },
    { id: 'qr-scanner', label: 'QR Check-In', icon: QrCode },
    { id: 'users', label: 'Users', icon: UserPlus },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">StarTrak</h1>
              <p className="text-xs text-gray-500">Attendance Tracker</p>
            </div>
          </div>

          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeView === item.id
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Administrator'}
              </p>
              <p className="text-xs text-gray-500">Live Session</p>
            </div>
            <div className="relative group">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-amber-600 transition-colors">
                <span className="text-white text-sm font-semibold">
                  {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.user_metadata?.full_name || 'Administrator'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={signOut}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="grid grid-cols-4 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex flex-col items-center space-y-1 p-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                    activeView === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}