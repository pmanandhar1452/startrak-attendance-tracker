import React, { useState } from 'react';
import { CreditCard, QrCode, Download, Printer, Users, CheckSquare, Square, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Student, IDCardTemplate } from '../types';
import { useStudents } from '../hooks/useStudents';
import { useIDCards } from '../hooks/useIDCards';

export default function IDCardView() {
  const { students } = useStudents();
  const { qrCodes, generateIDCard, batchGenerateIDCards, generateQRCode, deleteQRCode } = useIDCards();
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [generatedCards, setGeneratedCards] = useState<IDCardTemplate[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleGenerateSingle = async (student: Student) => {
    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Initialize storage before generating
      await import('../services/idCardService').then(module => 
        module.IDCardService.initializeStorage()
      );
      
      const template = await generateIDCard(student);
      setGeneratedCards(prev => [...prev.filter(c => c.studentId !== student.id), template]);
      setSuccessMessage(`ID card generated for ${student.name}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate ID card';
      setError(`ID Card Generation Error: ${errorMessage}`);
      console.error('ID card generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Initialize storage before batch generation
      await import('../services/idCardService').then(module => 
        module.IDCardService.initializeStorage()
      );
      
      const selectedStudentObjects = students.filter(s => selectedStudents.includes(s.id));
      const templates = await batchGenerateIDCards(selectedStudentObjects);
      
      // Update generated cards
      const updatedCards = [...generatedCards];
      templates.forEach(template => {
        const existingIndex = updatedCards.findIndex(c => c.studentId === template.studentId);
        if (existingIndex >= 0) {
          updatedCards[existingIndex] = template;
        } else {
          updatedCards.push(template);
        }
      });
      setGeneratedCards(updatedCards);
      
      setSuccessMessage(`Generated ${templates.length} ID cards successfully`);
      setSelectedStudents([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate ID cards';
      setError(`Batch Generation Error: ${errorMessage}`);
      console.error('Batch generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCard = (template: IDCardTemplate) => {
    if (template.cardUrl) {
      const link = document.createElement('a');
      link.href = template.cardUrl;
      link.download = `id-card-${template.studentId}.png`;
      link.click();
    }
  };

  const handlePrintCards = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardsHtml = generatedCards.map(card => `
      <div style="page-break-after: always; text-align: center; padding: 20px;">
        <img src="${card.cardUrl}" alt="ID Card for ${card.studentName}" style="max-width: 100%; height: auto;" />
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Student ID Cards</title>
          <style>
            body { margin: 0; padding: 0; }
            @media print {
              body { margin: 0; }
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          ${cardsHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getStudentQRCode = (studentId: string) => {
    return qrCodes.find(qr => qr.studentId === studentId);
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800 font-medium">Success</p>
          </div>
          <p className="text-green-700 mt-1">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">Error</p>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Student ID Cards</h1>
            <p className="text-gray-600">Generate ID cards with QR codes for student attendance tracking</p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleSelectAll}
              className="bg-gray-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              {selectedStudents.length === students.length ? <Square className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
              <span>{selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}</span>
            </button>

            <button
              onClick={handleBatchGenerate}
              disabled={selectedStudents.length === 0 || isGenerating}
              className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              <span>Generate Selected ({selectedStudents.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Cards Summary */}
      {generatedCards.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Generated ID Cards ({generatedCards.length})</h2>
            <div className="flex space-x-2">
              <button
                onClick={handlePrintCards}
                className="bg-green-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Printer className="h-4 w-4" />
                <span>Print All</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {generatedCards.map((card) => (
              <div key={card.studentId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-center mb-3">
                  {card.cardUrl ? (
                    <img
                      src={card.cardUrl}
                      alt={`ID Card for ${card.studentName}`}
                      className="w-full h-auto rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-1">{card.studentName}</h3>
                  <p className="text-sm text-gray-500 mb-3">{card.studentId}</p>
                  
                  <button
                    onClick={() => handleDownloadCard(card)}
                    disabled={!card.cardUrl}
                    className="w-full bg-blue-500 text-white font-medium py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Students</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {students.map((student) => {
            const isSelected = selectedStudents.includes(student.id);
            const hasQRCode = getStudentQRCode(student.id);
            const hasGeneratedCard = generatedCards.some(c => c.studentId === student.id);

            return (
              <div key={student.id} className={`border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleSelectStudent(student.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <CheckSquare className="h-3 w-3 text-white" />}
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      {student.avatar ? (
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {student.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-1">
                    {hasQRCode && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" title="Has QR Code" />
                    )}
                    {hasGeneratedCard && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" title="Card Generated" />
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">{student.name}</h3>
                  <p className="text-xs text-gray-500">{student.studentId}</p>
                  <p className="text-xs text-gray-500">{student.subject}</p>
                </div>

                <div className="space-y-2">
                  {hasQRCode && (
                    <div className="flex items-center space-x-2 text-xs text-green-600">
                      <QrCode className="h-3 w-3" />
                      <span>QR Code Active</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleGenerateSingle(student)}
                    disabled={isGenerating}
                    className="w-full bg-amber-500 text-white font-medium py-2 px-3 rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? <Loader className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
                    <span>Generate Card</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {students.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-500">Add students to generate ID cards</p>
          </div>
        )}
      </div>
    </div>
  );
}