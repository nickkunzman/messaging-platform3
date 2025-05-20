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

    const {
      data: { user }
    } = await supabase.auth.getUser();

    const { data: userMeta, error: roleError } = await supabase
      .from('Users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !userMeta) {
      navigate('/not-authorized');
      return;
    }

    if (userMeta.role === 'parent') {
      navigate('/parent-dashboard');
    } else if (userMeta.role === 'admin') {
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

      <p style={{ marginTop: '1rem' }}>
        Don’t have an account? <a href="/signup">Sign up here</a>
      </p>
    </form>
  );
}
