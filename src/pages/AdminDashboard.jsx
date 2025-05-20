import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

export default function AdminDashboard() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [studentName, setStudentName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [grade, setGrade] = useState('');
  const [gradeTeacherOptions, setGradeTeacherOptions] = useState([]);
  const [selectedGradeTeacher, setSelectedGradeTeacher] = useState('');
  const [status, setStatus] = useState('');

  // Fetch unique Grade - Teacher options from authorized_users
  useEffect(() => {
    const fetchGradeTeacherOptions = async () => {
      const { data, error } = await supabase
        .from('authorized_users')
        .select('grade, teacher');

      if (error) {
        console.error('Error fetching grade/teacher:', error.message);
        return;
      }

      const uniqueOptions = Array.from(
        new Set(
          data.map(row =>
            row.teacher
              ? `${row.grade} - ${row.teacher}`
              : row.grade
          )
        )
      );

      setGradeTeacherOptions(uniqueOptions.sort());
    };

    fetchGradeTeacherOptions();
  }, []);

  // Render logic
  const renderRoleFields = () => {
    if (role === 'parent') {
      return (
        <>
          <input
            type="text"
            placeholder="Student Name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            required
          />
          <select
            value={selectedGradeTeacher}
            onChange={(e) => setSelectedGradeTeacher(e.target.value)}
            required
          >
            <option value="">Select Grade - Teacher</option>
            {gradeTeacherOptions.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        </>
      );
    }

    if (role === 'teacher') {
      return (
        <>
          <input
            type="text"
            placeholder="Grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            required
          />
        </>
      );
    }

    if (role === 'specialized') {
      return (
        <>
          <input
            type="text"
            placeholder="Grades (comma-separated, e.g. 6th,7th,8th)"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            required
          />
        </>
      );
    }

    return null; // Admin needs no extra fields
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setStatus('🔧 Feature: User creation logic not yet wired up.');
        }}
      >
        <input
          type="email"
          placeholder="User Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setStudentName('');
            setTeacherName('');
            setGrade('');
          }}
          required
        >
          <option value="">Select Role</option>
          <option value="admin">Admin</option>
          <option value="parent">Parent</option>
          <option value="teacher">Teacher</option>
          <option value="specialized">Specialized Faculty</option>
        </select>

        {renderRoleFields()}

        <button type="submit">Create User</button>
      </form>

      {status && <p style={{ marginTop: '1rem' }}>{status}</p>}
    </div>
  );
}
