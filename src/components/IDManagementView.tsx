import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Trash2, 
  Eye, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle,
  BarChart3,
  CreditCard,
  QrCode,
  Key,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader
} from 'lucide-react';
import { GeneratedID } from '../types';
import { useIDManagement } from '../hooks/useIDManagement';

export default function IDManagementView() {
  const {
    generatedIDs,
    statistics,
    loading,
    error,
    totalCount,
    currentPage,
    pageSize,
    searchTerm,
    typeFilter,
    statusFilter,
    updateIDStatus,
    deleteID,
    cleanupExpiredIDs,
    handleSearch,
    handleTypeFilter,
    handleStatusFilter,
    handlePageChange,
    refetch
  } = useIDManagement();

  const [selectedID, setSelectedID] = useState<GeneratedID | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <Clock className="h-4 w-4 text-gray-600" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'revoked':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'revoked':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'student_card':
        return <CreditCard className="h-4 w-4" />;
      case 'qr_code':
        return <QrCode className="h-4 w-4" />;
      case 'access_card':
        return <Key className="h-4 w-4" />;
      case 'library_card':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: GeneratedID['status']) => {
    setIsUpdating(id);
    try {
      await updateIDStatus(id, newStatus);
      setSuccessMessage(`ID status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ID? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteID(id);
      setSuccessMessage('ID deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to delete ID:', err);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Are you sure you want to cleanup all expired IDs?')) {
      return;
    }

    try {
      const cleanedCount = await cleanupExpiredIDs();
      setSuccessMessage(`Cleaned up ${cleanedCount} expired IDs`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to cleanup expired IDs:', err);
    }
  };

  const handleDownload = (generatedID: GeneratedID) => {
    const cardUrl = generatedID.metadata.card_url;
    const qrUrl = generatedID.metadata.qr_code_url;
    
    if (cardUrl) {
      const link = document.createElement('a');
      link.href = cardUrl;
      link.download = `${generatedID.idType}-${generatedID.studentIdNumber || generatedID.studentId}.png`;
      link.click();
    } else if (qrUrl) {
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = `qr-code-${generatedID.studentIdNumber || generatedID.studentId}.png`;
      link.click();
    }
  };

  if (loading && generatedIDs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ID management...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ID Management</h1>
            <p className="text-3xl font-bold text-purple-600">{statistics?.byType?.qr_code || 0}</p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={refetch}
              disabled={loading}
              className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleCleanup}
              className="bg-orange-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Cleanup Expired</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total IDs</p>
                <p className="text-3xl font-bold text-blue-600">{statistics.totalIds}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active IDs</p>
                <p className="text-3xl font-bold text-green-600">{statistics.activeIds}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Expired IDs</p>
                <p className="text-3xl font-bold text-red-600">{statistics.expiredIds}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">QR Codes</p>
                <p className="text-3xl font-bold text-purple-600">{statistics.byType.qr_code || 0}</p>
              </div>
              <QrCode className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search IDs, students..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => handleTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="student_card">Student Cards</option>
            <option value="qr_code">QR Codes</option>
            <option value="access_card">Access Cards</option>
            <option value="library_card">Library Cards</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>Showing {generatedIDs.length} of {totalCount} IDs</span>
          </div>
        </div>
      </div>

      {/* IDs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {generatedIDs.map((generatedID) => (
                <tr key={generatedID.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {generatedID.studentName || 'Unknown Student'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {generatedID.studentIdNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(generatedID.idType)}
                      <span className="text-sm text-gray-900 capitalize">
                        {generatedID.idType.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-gray-900">
                      {generatedID.idValue}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(generatedID.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border capitalize ${getStatusColor(generatedID.status)}`}>
                        {generatedID.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(generatedID.generatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedID(generatedID)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {(generatedID.metadata.card_url || generatedID.metadata.qr_code_url) && (
                        <button
                          onClick={() => handleDownload(generatedID)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}

                      {generatedID.status === 'active' && (
                        <button
                          onClick={() => handleStatusUpdate(generatedID.id, 'inactive')}
                          disabled={isUpdating === generatedID.id}
                          className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                        >
                          {isUpdating === generatedID.id ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(generatedID.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {generatedIDs.length === 0 && !loading && (
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No IDs Found</h3>
            <p className="text-gray-500">
              {searchTerm || typeFilter || statusFilter 
                ? 'Try adjusting your search and filter criteria' 
                : 'Generated IDs will appear here'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="px-4 py-2 text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ID Details Modal */}
      {selectedID && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">ID Details</h2>
                <button
                  onClick={() => setSelectedID(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student Name</label>
                    <p className="text-sm text-gray-900">{selectedID.studentName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student ID</label>
                    <p className="text-sm text-gray-900">{selectedID.studentIdNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID Type</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedID.idType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border capitalize ${getStatusColor(selectedID.status)}`}>
                      {selectedID.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID Value</label>
                    <p className="text-sm font-mono text-gray-900">{selectedID.idValue}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Generated</label>
                    <p className="text-sm text-gray-900">{new Date(selectedID.generatedAt).toLocaleString()}</p>
                  </div>
                </div>

                {selectedID.metadata.qr_code_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">QR Code</label>
                    <img
                      src={selectedID.metadata.qr_code_url}
                      alt="QR Code"
                      className="w-32 h-32 border border-gray-200 rounded-lg"
                    />
                  </div>
                )}

                {selectedID.metadata.card_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID Card</label>
                    <img
                      src={selectedID.metadata.card_url}
                      alt="ID Card"
                      className="max-w-full h-auto border border-gray-200 rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}