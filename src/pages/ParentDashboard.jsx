import { supabase } from '../supabase/client';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('Users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !data || data.role !== 'parent') {
        navigate('/not-authorized');
      } else {
        setUser(user);
        setRole(data.role);
      }

      setLoading(false);
    };

    fetchUserRole();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
  <div>
    <h1>Parent Dashboard</h1>
    <p>Welcome! You are logged in as a <strong>{role}</strong>.</p>
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }}
    >
      Log Out
    </button>
  </div>
);
