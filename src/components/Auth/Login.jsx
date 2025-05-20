import { useState } from 'react';
import { supabase } from '../../supabase/client';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const userId = signInData.user?.id;
    if (!userId) {
      setError('Something went wrong. Please try again.');
      return;
    }

    const { data: userData, error: roleError } = await supabase
      .from('Users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (roleError || !userData?.role) {
      navigate('/not-authorized');
    } else if (userData.role === 'parent') {
      navigate('/parent-dashboard');
    } else if (userData.role === 'admin') {
      navigate('/admin-dashboard');
    } else {
      navigate('/not-authorized');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
