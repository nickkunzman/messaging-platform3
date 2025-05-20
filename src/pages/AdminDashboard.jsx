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
  const [viewMode, setViewMode] = useState('users'); // 'users' or 'authorized'

  const [users, setUsers] = useState([]);
  const [authorized, setAuthorized] = useState([]);
  const [signedUpEmails, setSignedUpEmails] = useState([]);

  // Fetch both user data and authorized users
  useEffect(() => {
    fetchGradeTeacherOptions();
    fetchUsers();
    fetchAuthorized();
  }, []);

  const fetchGradeTeacherOptions = async () => {
    const { data, error } = await supabase
      .from('authorized_users')
      .select('grade, teacher');

    if (error) return console.error('Grade/Teacher fetch error:', error.message);

    const uniqueOptions = Array.from(
      new Set(data.map(row =>
        row.teacher ? `${row.grade} - ${row.teacher}` : row.grade
      ))
    );
    setGradeTeacherOptions(uniqueOptions.sort());
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('Users').select('*');
    if (error) return console.error('User fetch error:', error.message);

    setUsers(data);
    const signedUp = data.map(u => u.email?.toLowerCase()).filter(Boolean);
    setSignedUpEmails(signedUp);
  };

  const fetchAuthorized = async () => {
    const { data, error } = await supabase.from('authorized_users').select('*');
    if (error) return console.error('Authorized user fetch error:', error.message);
    setAuthorized(data);
  };

  const generateTempPassword = () =>
    Math.random().toString(36).slice(-10) + '!';

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setStatus('Creating user...');

    const tempPassword = generateTempPassword();

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

    const userRecord = {
      id: userId,
      role,
      full_name: fullName,
      email,
    };

    if (role === 'parent') {
      userRecord.student_name = studentName;
      const [g, t] = selectedGradeTeacher.split(' - ');
      userRecord.grade = g;
      if (t) userRecord.teacher = t;
    }

    if (role === 'teacher' || role === 'specialized') {
      userRecord.grade = grade;
    }

    const { error: metaError } = await supabase.from('Users').insert([userRecord]);

    if (metaError) {
      setStatus('✅ Created in Auth, but failed to save metadata: ' + metaError.message);
      return;
    }

    setStatus(`✅ User created! Temp password: ${tempPassword}`);
    setEmail('');
    setFullName('');
    setStudentName('');
    setGrade('');
    setSelectedGradeTeacher('');
    setRole('');
    fetchUsers();
  };

  const handleUpdateUser = async (index) => {
    const updatedUser = users[index];
    const { id, ...fields } = updatedUser;

    const { error } = await supabase.from('Users').update(fields).eq('id', id);
    if (error) {
      alert(`❌ Failed to update: ${error.message}`);
    } else {
      alert('✅ User updated successfully.');
      fetchUsers();
    }
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...users];
    updated[index][field] = value;
    setUsers(updated);
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

    if (role === 'teacher' || role === 'specialized') {
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

    return null;
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>

      {/* VIEW TOGGLE */}
      <div style={{ marginBottom: '1rem' }}>
        <label>
          <strong>View: </strong>
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
            <option value="users">Created Users</option>
            <option value="authorized">Authorized Parents</option>
          </select>
        </label>
      </div>

      {/* CREATE USER FORM */}
      {viewMode === 'users' && (
        <>
          <form onSubmit={handleCreateUser} style={{ marginBottom: '2rem' }}>
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
            <pre style={{ whiteSpace: 'pre-wrap', color: 'green' }}>{status}</pre>
          )}

          {/* USERS TABLE */}
          <h3>All Users</h3>
          <table border="1" cellPadding="6" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Grade</th>
                <th>Teacher</th>
                <th>Student</th>
                <th>Save</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ fontSize: '0.75rem' }}>{u.id}</td>
                  <td>
                    <input
                      value={u.email || ''}
                      onChange={(e) => handleInputChange(i, 'email', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={u.full_name || ''}
                      onChange={(e) => handleInputChange(i, 'full_name', e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleInputChange(i, 'role', e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="parent">Parent</option>
                      <option value="teacher">Teacher</option>
                      <option value="specialized">Specialized</option>
                    </select>
                  </td>
                  <td>
                    <input
                      value={u.grade || ''}
                      onChange={(e) => handleInputChange(i, 'grade', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={u.teacher || ''}
                      onChange={(e) => handleInputChange(i, 'teacher', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={u.student_name || ''}
                      onChange={(e) =>
                        handleInputChange(i, 'student_name', e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <button onClick={() => handleUpdateUser(i)}>Save</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* AUTHORIZED USERS VIEW */}
      {viewMode === 'authorized' && (
        <>
          <h3>Authorized Parents</h3>
          <table border="1" cellPadding="6" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Parent Name</th>
                <th>Student Name</th>
                <th>Grade</th>
                <th>Teacher</th>
                <th>Signed Up?</th>
              </tr>
            </thead>
            <tbody>
              {authorized.map((a, i) => (
                <tr key={i}>
                  <td>{a.email}</td>
                  <td>{a.parent_name}</td>
                  <td>{a.student_name}</td>
                  <td>{a.grade}</td>
                  <td>{a.teacher || '-'}</td>
                  <td>
                    {signedUpEmails.includes(a.email.toLowerCase())
                      ? '✅ Yes'
                      : '❌ No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
