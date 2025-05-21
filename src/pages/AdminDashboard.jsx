import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [grades, setGrades] = useState([]);
  const [teacher, setTeacher] = useState('');
  const [students, setStudents] = useState([{ name: '', gradeTeacher: '' }]);
  const [gradeTeacherOptions, setGradeTeacherOptions] = useState([]);
  const [status, setStatus] = useState('');
  const [viewMode, setViewMode] = useState('users');

  const [users, setUsers] = useState([]);
  const [authorized, setAuthorized] = useState([]);
  const [signedUpEmails, setSignedUpEmails] = useState([]);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
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
      email
    };

    if (role === 'parent') {
      const [first] = students;
      userRecord.student_name = first.name;
      const [g, t] = first.gradeTeacher.split(' - ');
      userRecord.grade = g;
      if (t) userRecord.teacher = t;
    }

    if (role === 'teacher') {
      const [g] = grades;
      userRecord.grade = g;
    }

    if (role === 'specialized') {
      userRecord.grade = grades.join(',');
    }

    const { error: metaError } = await supabase.from('Users').insert([userRecord]);

    if (metaError) {
      setStatus('✅ Created in Auth, but failed to save metadata: ' + metaError.message);
      return;
    }

    setStatus(`✅ User created! Temp password: ${tempPassword}`);
    setEmail('');
    setFullName('');
    setStudents([{ name: '', gradeTeacher: '' }]);
    setGrades([]);
    setTeacher('');
    setRole('');
    fetchUsers();
  };

  const renderRoleFields = () => {
    if (role === 'parent') {
      return (
        <>
          <h4>Student(s):</h4>
          {students.map((student, index) => (
            <div key={index} style={{ marginBottom: '0.5rem' }}>
              <input
                type="text"
                placeholder="Student Name"
                value={student.name}
                onChange={(e) => {
                  const updated = [...students];
                  updated[index].name = e.target.value;
                  setStudents(updated);
                }}
                required
              />
              <select
                value={student.gradeTeacher}
                onChange={(e) => {
                  const updated = [...students];
                  updated[index].gradeTeacher = e.target.value;
                  setStudents(updated);
                }}
                required
              >
                <option value="">Select Grade - Teacher</option>
                {gradeTeacherOptions.map((opt, i) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {students.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setStudents(students.filter((_, i) => i !== index))
                  }
                >
                  🗑 Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setStudents([...students, { name: '', gradeTeacher: '' }])
            }
          >
            ➕ Add Another Student
          </button>
        </>
      );
    }

    if (role === 'teacher') {
      return (
        <select
          value={grades[0] || ''}
          onChange={(e) => setGrades([e.target.value])}
          required
        >
          <option value="">Select Grade</option>
          {gradeTeacherOptions.map((opt, i) => {
            const [gradeOnly] = opt.split(' - ');
            return (
              <option key={i} value={gradeOnly}>
                {gradeOnly}
              </option>
            );
          })}
        </select>
      );
    }

    if (role === 'specialized') {
      return (
        <fieldset>
          <legend>Select Grades (Multiple Allowed)</legend>
          {gradeTeacherOptions.map((opt, i) => {
            const [gradeOnly] = opt.split(' - ');
            return (
              <label key={i} style={{ display: 'block' }}>
                <input
                  type="checkbox"
                  value={gradeOnly}
                  checked={grades.includes(gradeOnly)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setGrades((prev) =>
                      checked
                        ? [...prev, gradeOnly]
                        : prev.filter((g) => g !== gradeOnly)
                    );
                  }}
                />
                {gradeOnly}
              </label>
            );
          })}
        </fieldset>
      );
    }

    return null;
  };
  return (
    <div>
      {/* Header with Logout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Admin Dashboard</h2>
        <button onClick={handleLogout}>Log Out</button>
      </div>

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
                setStudents([{ name: '', gradeTeacher: '' }]);
                setGrades([]);
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
                      onChange={(e) => {
                        const updated = [...users];
                        updated[i].email = e.target.value;
                        setUsers(updated);
                      }}
                    />
                  </td>
                  <td>
                    <input
                      value={u.full_name || ''}
                      onChange={(e) => {
                        const updated = [...users];
                        updated[i].full_name = e.target.value;
                        setUsers(updated);
                      }}
                    />
                  </td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => {
                        const updated = [...users];
                        updated[i].role = e.target.value;
                        setUsers(updated);
                      }}
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
                      onChange={(e) => {
                        const updated = [...users];
                        updated[i].grade = e.target.value;
                        setUsers(updated);
                      }}
                    />
                  </td>
                  <td>
                    <input
                      value={u.teacher || ''}
                      onChange={(e) => {
                        const updated = [...users];
                        updated[i].teacher = e.target.value;
                        setUsers(updated);
                      }}
                    />
                  </td>
                  <td>
                    <input
                      value={u.student_name || ''}
                      onChange={(e) => {
                        const updated = [...users];
                        updated[i].student_name = e.target.value;
                        setUsers(updated);
                      }}
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

      {/* AUTHORIZED PARENTS TABLE */}
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
