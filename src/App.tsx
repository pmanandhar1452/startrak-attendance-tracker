import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase"; // make sure this points to your supabase client
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ Fetch students with linked profile names
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select(`
            id,
            level,
            qr_code,
            created_at,
            user_profiles (full_name, role_id)
          `)
          .order("created_at", { ascending: false });

        if (studentError) console.error("Students fetch error:", studentError);
        else setStudents(studentData || []);

        // ✅ Fetch sessions
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .select("id, name, instructor, start_time, end_time, status, created_at")
          .order("created_at", { ascending: false });

        if (sessionError) console.error("Sessions fetch error:", sessionError);
        else setSessions(sessionData || []);

        // ✅ Fetch attendance linked to students + user_profiles
        const { data: attendanceData, error: attendanceError } = await supabase
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

        if (attendanceError) console.error("Attendance fetch error:", attendanceError);
        else setAttendance(attendanceData || []);
      } catch (err) {
        console.error("Unexpected fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="p-6">
          <h1 className="text-2xl font-bold mb-4">Supabase Debug Panel</h1>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              {/* Students */}
              <section className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Students</h2>
                <pre className="bg-white p-3 rounded shadow text-sm overflow-x-auto">
                  {JSON.stringify(students, null, 2)}
                </pre>
              </section>

              {/* Sessions */}
              <section className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Sessions</h2>
                <pre className="bg-white p-3 rounded shadow text-sm overflow-x-auto">
                  {JSON.stringify(sessions, null, 2)}
                </pre>
              </section>

              {/* Attendance */}
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
  );
}

export default App;