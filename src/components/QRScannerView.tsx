import React, { useState, useRef, useEffect } from 'react';
import { Camera, QrCode, CheckCircle, XCircle, AlertCircle, User, Clock, RefreshCw } from 'lucide-react';
import jsQR from 'jsqr';
import { CheckInService } from '../services/checkInService';

interface QRScannerViewProps {
  onScanSuccess?: (studentId: string) => void;
}

interface ScanResult {
  studentName: string;
  studentId: string;
  checkInTime: string;
  status: 'success' | 'error' | 'already-checked-in';
  message: string;
}

export default function QRScannerView({ onScanSuccess }: QRScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setHasPermission(true);
        setIsScanning(true);
        startScanning();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setHasPermission(false);
      setError('Camera access denied. Please allow camera permissions and try again.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  };

  // Start scanning for QR codes
  const startScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && !isProcessing) {
        scanQRCode();
      }
    }, 500); // Scan every 500ms
  };

  // Scan QR code from video feed
  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Get image data from canvas
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Detect QR code using jsQR
      const qrCodeData = await detectQRCode(imageData);
      
      if (qrCodeData) {
        await processQRCode(qrCodeData);
      }
    } catch (err) {
      console.error('QR scanning error:', err);
    }
  };

  // Detect QR code using jsQR library
  const detectQRCode = async (imageData: ImageData): Promise<string | null> => {
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      return code ? code.data : null;
    } catch (error) {
      console.error('QR detection error:', error);
      return null;
    }
  };

  // Process detected QR code
  const processQRCode = async (qrData: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      // Call check-in API with full QR data
      const apiResult = await CheckInService.processQRCheckIn(qrData);
      
      const result: ScanResult = {
        studentName: apiResult.studentName,
        studentId: apiResult.studentId,
        checkInTime: apiResult.checkInTime,
        status: apiResult.status,
        message: apiResult.message
      };
      
      setScanResult(result);
      
      if (result.status === 'success') {
        const studentId = CheckInService.extractStudentIdFromQR(qrData);
        if (studentId) {
          onScanSuccess?.(studentId);
        }
        // Stop scanning after successful check-in
        stopCamera();
        
        // Auto-clear result after 5 seconds
        setTimeout(() => {
          setScanResult(null);
        }, 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process QR code');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset scanner
  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    setIsProcessing(false);
    if (!isScanning) {
      startCamera();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const getResultIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-600" />;
      case 'already-checked-in':
        return <Clock className="h-16 w-16 text-amber-600" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-red-600" />;
      default:
        return <AlertCircle className="h-16 w-16 text-gray-600" />;
    }
  };

  const getResultColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'already-checked-in':
        return 'bg-amber-50 border-amber-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg">
              <QrCode className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Check-In</h1>
          <p className="text-gray-600">Scan your student ID QR code to check in</p>
        </div>

        {/* Scanner Result */}
        {scanResult && (
          <div className={`rounded-2xl shadow-xl border p-8 mb-6 text-center ${getResultColor(scanResult.status)}`}>
            <div className="flex justify-center mb-4">
              {getResultIcon(scanResult.status)}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {scanResult.status === 'success' ? 'Welcome!' : 
               scanResult.status === 'already-checked-in' ? 'Already Checked In' : 'Error'}
            </h2>
            
            {scanResult.studentName && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-lg font-medium text-gray-900">{scanResult.studentName}</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-sm text-gray-600">Student ID: {scanResult.studentId}</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Time: {scanResult.checkInTime}</span>
                </div>
              </div>
            )}
            
            <p className="text-gray-700 mb-6">{scanResult.message}</p>
            
            <button
              onClick={resetScanner}
              className="bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Scan Another</span>
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">Error</p>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={resetScanner}
              className="mt-3 bg-red-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Camera Permission Request */}
        {hasPermission === null && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Camera Access Required</h2>
            <p className="text-gray-600 mb-6">We need access to your camera to scan QR codes</p>
            <button
              onClick={startCamera}
              className="bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Camera className="h-4 w-4" />
              <span>Enable Camera</span>
            </button>
          </div>
        )}

        {/* Camera Permission Denied */}
        {hasPermission === false && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Camera Access Denied</h2>
            <p className="text-gray-600 mb-6">Please allow camera access in your browser settings and refresh the page</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        )}

        {/* Scanner Interface */}
        {isScanning && !scanResult && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-80 object-cover bg-black"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {/* Scanning Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-blue-500 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                  
                  {/* Scanning Line Animation */}
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <div className="w-full h-1 bg-blue-500 animate-pulse" style={{
                      animation: 'scan 2s linear infinite',
                      transformOrigin: 'center'
                    }}></div>
                  </div>
                </div>
              </div>

              {/* Processing Indicator */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-900 font-medium">Processing QR Code...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Position QR Code in Frame</h3>
              <p className="text-gray-600 mb-4">Hold your student ID card steady within the scanning area</p>
              
              <button
                onClick={stopCamera}
                className="bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Stop Scanner
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Check In</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Allow camera access when prompted</li>
            <li>Hold your student ID card with QR code facing the camera</li>
            <li>Position the QR code within the scanning frame</li>
            <li>Wait for automatic detection and check-in confirmation</li>
          </ol>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(256px); }
        }
      `}</style>
    </div>
  );
}