import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import QRScannerView from './QRScannerView';
import { CheckInService, CheckInResult } from '../services/checkInService';

interface QRScannerPageProps {
  onBack?: () => void;
}

export default function QRScannerPage({ onBack }: QRScannerPageProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckInResult[]>([]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to real-time attendance updates
  useEffect(() => {
    const subscription = CheckInService.subscribeToAttendanceUpdates((payload) => {
      console.log('Real-time attendance update:', payload);
      // Handle real-time updates here if needed
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleScanSuccess = async (qrCode: string) => {
    try {
      const result = await CheckInService.processQRCheckIn(qrCode);
      
      // Add to recent check-ins
      setRecentCheckIns(prev => [result, ...prev.slice(0, 4)]); // Keep last 5
      
      return result;
    } catch (error) {
      console.error('Check-in processing error:', error);
      return {
        success: false,
        studentName: '',
        studentId: '',
        checkInTime: '',
        status: 'error' as const,
        message: 'Failed to process check-in'
      };
    }
  };

  const handleQRScannerSuccess = (studentId: string) => {
    // This is called when QR scanner successfully processes a code
    console.log('QR Scanner success for student:', studentId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Student Check-In</h1>
                <p className="text-sm text-gray-500">Scan QR code to check in</p>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm font-medium">Online</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-red-600">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm font-medium">Offline</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR Scanner */}
          <div className="lg:col-span-2">
            <QRScannerView onScanSuccess={handleQRScannerSuccess} />
          </div>

          {/* Recent Check-ins Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Check-ins</h2>
              
              {recentCheckIns.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent check-ins</p>
              ) : (
                <div className="space-y-3">
                  {recentCheckIns.map((checkIn, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        checkIn.status === 'success' 
                          ? 'bg-green-50 border-green-200' 
                          : checkIn.status === 'already-checked-in'
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {checkIn.studentName || 'Unknown'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          checkIn.status === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : checkIn.status === 'already-checked-in'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {checkIn.status === 'success' ? 'Checked In' : 
                           checkIn.status === 'already-checked-in' ? 'Already In' : 'Error'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{checkIn.studentId}</p>
                      {checkIn.checkInTime && (
                        <p className="text-xs text-gray-500 mt-1">{checkIn.checkInTime}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Quick Tips</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Ensure good lighting for scanning</li>
                <li>• Hold QR code steady in frame</li>
                <li>• Check-in is automatic once detected</li>
                <li>• Status updates in real-time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}