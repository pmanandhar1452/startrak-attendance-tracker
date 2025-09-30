import React, { useEffect } from 'react';
import { supabase } from './supabase'; // path to your supabase.ts

export default function TestAttendance() {
  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*'); // fetch all rows

      if (error) {
        console.error('Error fetching attendance_records:', error);
      } else {
        console.log('Attendance Records:', data);
      }
    }

    fetchData();
  }, []);

  return <div>Check console for attendance_records results</div>;
}