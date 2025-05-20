import { useState } from 'react';
import { supabase } from '../../supabase/client';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    const emailLower = email.toLowerCase(); // ✅ Ensure lowercase comparison

    // Check if this email is authorized
    const { data: authData, error: authError } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('email', emailLower)
      .single();

    if (authError || !authData) {
      setError('Email is not authorized to sign up.');
      return;
    }

    // Create user in Supabase Auth
    const { error: signUpError } = await supabase.auth.signUp({
      email: emailLower,
      password
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      alert('Signup successful! Please log in.');
      navigate('/login');
    }
  };

  return (
    <form onSubmit={handleSignup}>
      <h2>Sign Up</h2>
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
      <button type="submit">Sign Up</button>
    </form>
  );
}
