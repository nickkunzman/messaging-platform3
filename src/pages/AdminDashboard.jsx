import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

export default function AdminDashboard() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [studentName, setStudentName] = useState('');
  const [grade, setGrade] = useState('');
  const [selectedGradeTeacher, setSelectedGradeTeacher] = useState('');
  const [gradeTeacherOptions, setGradeTeacherOptions] = useState([]);
  const [status, setStatus] = useState('');

  // Fetch unique Grade - Teacher combos from authorized_users
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
          data.map((row) =>
            row.teacher ? `${row.grade} - ${row.teacher}` : row.grade
          )
        )
      );

      setGradeTeacherOptions(uniqueOptions.sort());
    };

    fetchGradeTeacherOptions();
  }, []);

  const generateTempPassword = () => {
    return Math.random().toString(36).slice(-10) + '!';
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setStatus('Creating user...');

    const tempPassword = generateTempPassword();

    // 1. Create Auth user
    const { data: createdUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

    if (authError || !createdUser.user) {
      setStatus('❌ Error creating user: ' + authError.message);
      return;
    }

    const userId = createdUser.user.id;

    // 2. Insert into Users table
    const userRecord = {
      id: userId,
      role,
      full_name: fullName,
    };

    if (role === 'parent') {
      userRecord.student_name = studentName;
      const [g, t] = selectedGradeTeacher.split(' - ');
      userRecord.grade = g;
      if (t) userRecord.teacher = t;
    }

    if (role === 'teacher') {
      userRecord.grade = grade;
    }

    if (role === 'specialized') {
      userRecord.grade = grade; // comma-separated grades
    }

    const { error: metaError } = await supabase.from('Users').insert([userRecord]);

    if (metaError) {
      setStatus('✅ User created in Auth but failed to insert role: ' + metaError.message);
      return;
    }

    // 3. Display temp password (later: send email via email client)
    setStatus(
      `✅ User created successfully!\nTemp Password: ${tempPassword}`
    );

    // Reset form
    setEmail('');
    setFullName('');
    setStudentName('');
    setGrade('');
    setSelectedGradeTeacher('');
    setRole('');
  };

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
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </>
      );
    }

    if (role === 'teacher') {
      return (
        <input
          type="text"
          placeholder="Grade"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          required
        />
      );
    }

    if (role === 'specialized') {
      return (
        <input
          type="text"
          placeholder="Grades (e.g. 6th,7th,8th)"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          required
        />
      );
    }

    return null;
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <form onSubmit={handleCreateUser}>
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
            setGrade('');
            setSelectedGradeTeacher('');
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

      {status && (
        <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{status}</pre>
      )}
    </div>
  );
}

