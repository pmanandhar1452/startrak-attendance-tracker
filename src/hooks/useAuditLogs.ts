import { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { UserService } from '../services/userService';

export function useAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  const fetchAuditLogs = async (page = 1, limit = 50) => {
    try {
      setLoading(true);
      setError(null);
      
      const offset = (page - 1) * limit;
      const { data, count } = await UserService.getAuditLogs(limit, offset);
      
      setAuditLogs(data);
      setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchAuditLogs(page, pageSize);
  };

  const refetch = () => {
    fetchAuditLogs(currentPage, pageSize);
  };

  // Initial load
  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentPage]);

  return {
    auditLogs,
    loading,
    error,
    totalCount,
    currentPage,
    pageSize,
    handlePageChange,
    refetch
  };
}