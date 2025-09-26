import React, { useState } from 'react';
import { CreditCard, BarChart3, Settings } from 'lucide-react';
import IDCardView from './IDCardView';
import IDManagementView from './IDManagementView';

export default function ConsolidatedIDManagementView() {
  const [activeTab, setActiveTab] = useState<'cards' | 'management'>('cards');

  const tabs = [
    {
      id: 'cards' as const,
      label: 'ID Cards',
      icon: CreditCard,
      description: 'Generate and manage student ID cards'
    },
    {
      id: 'management' as const,
      label: 'ID Management',
      icon: BarChart3,
      description: 'View and manage all generated IDs'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ID Management</h1>
          <p className="text-gray-600">Manage student ID cards and track all generated identifiers</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`mr-2 h-5 w-5 ${
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Descriptions */}
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'cards' && <IDCardView />}
        {activeTab === 'management' && <IDManagementView />}
      </div>
    </div>
  );
}