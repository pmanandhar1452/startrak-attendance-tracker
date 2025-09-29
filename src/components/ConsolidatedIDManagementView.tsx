import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import IDManagementView from './IDManagementView';

export default function ConsolidatedIDManagementView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ID Management</h1>
          <p className="text-gray-600">View and manage all generated student identifiers and QR codes</p>
        </div>
      </div>

      {/* ID Management Content */}
      <div className="min-h-[600px]">
        <IDManagementView />
      </div>
    </div>
  );
}