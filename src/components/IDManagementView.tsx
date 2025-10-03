import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, Download, Trash2, Plus, Search, RefreshCw, Users, Filter, CheckCircle, AlertCircle, Printer } from 'lucide-react';
import { useStudents } from '../hooks/useStudents';
import { useIDCards } from '../hooks/useIDCards';
import { Student, StudentQRCode, IDCardTemplate } from '../types';

export default function IDManagementView() {
  const { students, loading: studentsLoading } = useStudents();
  const { qrCodes, loading: qrCodesLoading, error, generateQRCode, generateIDCard, batchGenerateIDCards, deleteQRCode } = useIDCards();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedCards, setGeneratedCards] = useState<IDCardTemplate[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'with-qr' | 'without-qr'>('all');

  // Auto-clear messages
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // Get students with QR code status
  const studentsWithQRStatus = students.map(student => {
    const hasQR = qrCodes.some(qr => qr.studentId === student.id);
    return { ...student, hasQR };
  });

  // Filter students
  const filteredStudents = studentsWithQRStatus.filter(student => {
    const matchesSearch = searchTerm === '' ||
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'with-qr' && student.hasQR) ||
      (filterStatus === 'without-qr' && !student.hasQR);

    return matchesSearch && matchesFilter;
  });

  // Handle select all
  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  // Handle individual selection
  const handleSelectStudent = (studentId: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  // Generate QR code for single student
  const handleGenerateQRCode = async (student: Student) => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      await generateQRCode(student.id);
      setSuccessMessage(`QR code generated for ${student.name}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate ID card for single student
  const handleGenerateIDCard = async (student: Student) => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const card = await generateIDCard(student);
      setGeneratedCards(prev => [...prev, card]);
      setSuccessMessage(`ID card generated for ${student.name}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate ID card');
    } finally {
      setIsGenerating(false);
    }
  };

  // Batch generate ID cards
  const handleBatchGenerate = async () => {
    if (selectedStudents.size === 0) {
      setErrorMessage('Please select at least one student');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const studentsToGenerate = students.filter(s => selectedStudents.has(s.id));
      const cards = await batchGenerateIDCards(studentsToGenerate);
      setGeneratedCards(cards);
      setSuccessMessage(`Generated ${cards.length} ID cards successfully`);
      setSelectedStudents(new Set());
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate ID cards');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download ID card
  const handleDownloadCard = (card: IDCardTemplate) => {
    if (!card.cardUrl) return;

    const link = document.createElement('a');
    link.href = card.cardUrl;
    link.download = `id-card-${card.studentIdNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print ID card
  const handlePrintCard = (card: IDCardTemplate) => {
    if (!card.cardUrl) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print ID Card - ${card.studentName}</title>
            <style>
              body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 100%; height: auto; }
              @media print {
                body { padding: 0; }
                img { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <img src="${card.cardUrl}" alt="ID Card for ${card.studentName}" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  // Delete QR code
  const handleDeleteQRCode = async (qrCodeId: string) => {
    if (!confirm('Are you sure you want to delete this QR code? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteQRCode(qrCodeId);
      setSuccessMessage('QR code deleted successfully');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete QR code');
    }
  };

  const loading = studentsLoading || qrCodesLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ID management...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: students.length,
    withQR: qrCodes.length,
    withoutQR: students.length - qrCodes.length,
    selected: selectedStudents.size
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {(error || errorMessage) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">{error || errorMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ID Management</h1>
            <p className="text-gray-600">Generate and manage student ID cards and QR codes</p>
          </div>

          <div className="flex items-center space-x-3">
            {selectedStudents.size > 0 && (
              <button
                onClick={handleBatchGenerate}
                disabled={isGenerating}
                className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Generate ID Cards ({selectedStudents.size})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Students</p>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">With QR Code</p>
              <p className="text-3xl font-bold text-green-600">{stats.withQR}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <QrCode className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Without QR Code</p>
              <p className="text-3xl font-bold text-amber-600">{stats.withoutQR}</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Selected</p>
              <p className="text-3xl font-bold text-teal-600">{stats.selected}</p>
            </div>
            <div className="bg-teal-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Students</option>
              <option value="with-qr">With QR Code</option>
              <option value="without-qr">Without QR Code</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QR Code Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                const studentQR = qrCodes.find(qr => qr.studentId === student.id);
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {student.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.subject}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">{student.studentId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{student.email}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {studentQR ? (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            Active
                          </span>
                          {studentQR.qrCodeUrl && (
                            <a
                              href={studentQR.qrCodeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              title="View QR Code"
                            >
                              <QrCode className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          No QR Code
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {!studentQR && (
                          <button
                            onClick={() => handleGenerateQRCode(student)}
                            disabled={isGenerating}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Generate QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleGenerateIDCard(student)}
                          disabled={isGenerating}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Generate ID Card"
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>
                        {studentQR && (
                          <button
                            onClick={() => handleDeleteQRCode(studentQR.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete QR Code"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search and filter criteria'
                : 'Start by adding students to generate ID cards'}
            </p>
          </div>
        )}
      </div>

      {/* Generated Cards Preview */}
      {generatedCards.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated ID Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedCards.map((card) => (
              <div key={card.studentId} className="border border-gray-200 rounded-lg p-4">
                {card.cardUrl && (
                  <img
                    src={card.cardUrl}
                    alt={`ID Card for ${card.studentName}`}
                    className="w-full h-auto rounded-lg mb-4 shadow-md"
                  />
                )}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">{card.studentName}</h3>
                  <p className="text-sm text-gray-600">ID: {card.studentIdNumber}</p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownloadCard(card)}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handlePrintCard(card)}
                      className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
