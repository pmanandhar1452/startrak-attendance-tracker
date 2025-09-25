import { useState, useEffect, useCallback } from 'react';
import { GeneratedID, IDStatistics } from '../types';
import { IDManagementService } from '../services/idManagementService';

export function useIDManagement() {
  const [generatedIDs, setGeneratedIDs] = useState<GeneratedID[]>([]);
  const [statistics, setStatistics] = useState<IDStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchGeneratedIDs = useCallback(async (
    page = 1,
    search = '',
    type = '',
    status = ''
  ) => {
    try {
      setLoading(true);
      setError(null);

      const offset = (page - 1) * pageSize;
      const { data, count } = await IDManagementService.getAllGeneratedIDs(
        pageSize,
        offset,
        search,
        type,
        status
      );

      setGeneratedIDs(data);
      setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch generated IDs');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await IDManagementService.getIDStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  }, []);

  const updateIDStatus = async (id: string, status: GeneratedID['status']) => {
    try {
      setError(null);
      const updatedID = await IDManagementService.updateGeneratedID(id, { status });
      
      setGeneratedIDs(prev => prev.map(item => 
        item.id === id ? updatedID : item
      ));
      
      // Refresh statistics
      await fetchStatistics();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update ID status';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteID = async (id: string) => {
    try {
      setError(null);
      await IDManagementService.deleteGeneratedID(id);
      
      setGeneratedIDs(prev => prev.filter(item => item.id !== id));
      setTotalCount(prev => prev - 1);
      
      // Refresh statistics
      await fetchStatistics();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete ID';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const cleanupExpiredIDs = async (): Promise<number> => {
    try {
      setError(null);
      const cleanedCount = await IDManagementService.cleanupExpiredIDs();
      
      // Refresh data
      await fetchGeneratedIDs(currentPage, searchTerm, typeFilter, statusFilter);
      await fetchStatistics();
      
      return cleanedCount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup expired IDs';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    fetchGeneratedIDs(1, term, typeFilter, statusFilter);
  };

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type);
    setCurrentPage(1);
    fetchGeneratedIDs(1, searchTerm, type, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchGeneratedIDs(1, searchTerm, typeFilter, status);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchGeneratedIDs(page, searchTerm, typeFilter, statusFilter);
  };

  const refetch = () => {
    fetchGeneratedIDs(currentPage, searchTerm, typeFilter, statusFilter);
    fetchStatistics();
  };

  // Initial load
  useEffect(() => {
    fetchGeneratedIDs();
    fetchStatistics();
  }, [fetchGeneratedIDs, fetchStatistics]);

  // Real-time subscription
  useEffect(() => {
    const subscription = IDManagementService.subscribeToChanges((payload) => {
      console.log('Real-time update:', payload);
      
      // Refresh data on any change
      refetch();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
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
  };
}