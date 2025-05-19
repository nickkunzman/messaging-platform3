import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div>
      <h1>Welcome to the Messaging Platform Dashboard</h1>
      <p>You are logged in.</p>
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
}
