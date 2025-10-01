import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext"; // ✅ import your provider

function App() {
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: studentData } = await supabase
          .from("students")
          .select(`
            id,
            level,
            qr_code,
            created_at,
            user_profiles (full_name, role_id)
          `)
          .order("created_at", { ascending: false });
        setStudents(studentData || []);

        const { data: sessionData } = await supabase
          .from("sessions")
          .select("id, name, instructor, start_time, end_time, status, created_at")
          .order("created_at", { ascending: false });
        setSessions(sessionData || []);

        const { data: attendanceData } = await supabase
          .from("attendance")
          .select(`
            id,
            check_in,
            learning_start,
            check_out,
            created_at,
            students (
              id,
              user_profiles (full_name)
            )
          `)
          .order("created_at", { ascending: false });
        setAttendance(attendanceData || []);
      } catch (err) {
        console.error("Unexpected fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100">
          <Header />
          <main className="p-6">
            <h1 className="text-2xl font-bold mb-4">Supabase Debug Panel</h1>

            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                <section className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Students</h2>
                  <pre className="bg-white p-3 rounded shadow text-sm overflow-x-auto">
                    {JSON.stringify(students, null, 2)}
                  </pre>
                </section>

                <section className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Sessions</h2>
                  <pre className="bg-white p-3 rounded shadow text-sm overflow-x-auto">
                    {JSON.stringify(sessions, null, 2)}
                  </pre>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-2">Attendance</h2>
                  <pre className="bg-white p-3 rounded shadow text-sm overflow-x-auto">
                    {JSON.stringify(attendance, null, 2)}
                  </pre>
                </section>
              </>
            )}
          </main>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
