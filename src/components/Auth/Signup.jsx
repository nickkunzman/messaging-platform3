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

    const emailLower = email.toLowerCase();

    // 1. Check authorized_users
    const { data: authData, error: authError } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('email', emailLower)
      .limit(1)
      .maybeSingle();

    if (authError || !authData) {
      setError('Email is not authorized to sign up.');
      return;
    }

    // 2. Check if already signed up
    const { data: existingUser } = await supabase.auth.admin?.listUsers?.(); // fallback-safe
    const alreadyExists = existingUser?.users?.some((u) => u.email === emailLower);
    if (alreadyExists) {
      setError('This email is already registered. Please log in.');
      return;
    }

    // 3. Create Supabase Auth user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: emailLower,
      password
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // 4. Insert into Users table
    const userId = signUpData.user?.id;
    if (userId) {
      const fullName = authData.parent_name || emailLower;

      const { error: insertError } = await supabase
        .from('Users')
        .insert([{ id: userId, role: 'parent', full_name: fullName }]);

      if (insertError) {
        console.error('❌ Error inserting user metadata:', insertError.message);
      }
    }

    alert('Signup successful! Please log in.');
    navigate('/login');
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
