import { useState, useEffect } from 'react';
import { Student } from '../types';
import { StudentService } from '../services/studentService';

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await StudentService.getAllStudents();
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (student: Omit<Student, 'id'>) => {
    try {
      setError(null);
      const newStudent = await StudentService.createStudent(student);
      setStudents(prev => [...prev, newStudent]);
      return newStudent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add student';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      setError(null);
      const updatedStudent = await StudentService.updateStudent(id, updates);
      setStudents(prev => prev.map(student => 
        student.id === id ? updatedStudent : student
      ));
      return updatedStudent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update student';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      setError(null);
      await StudentService.deleteStudent(id);
      setStudents(prev => prev.filter(student => student.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete student';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return {
    students,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    refetch: fetchStudents
  };
}