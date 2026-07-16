import { FormEvent, ReactNode, useState } from 'react';
import { getToken, setToken, setUserId } from '../api/client';

const QUANTUM_CHAT_API =
  import.meta.env.VITE_QUANTUMCHAT_API_URL ?? 'http://localhost:5000/api';

export function LoginGate({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(Boolean(getToken()));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (authenticated) return children;

  async function login(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`${QUANTUM_CHAT_API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Sign in failed');
      setToken(body.data.token);
      setUserId(String(body.data.user.id));
      setAuthenticated(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="ai-login-page">
      <section className="ai-login-copy">
        <img src="/logo.png" alt="" className="ai-login-logo" />
        <p className="ai-login-brand">QuantumAI</p>
        <h1>Your focused AI workspace.</h1>
        <p>Chat, study documents, create quizzes, and build lesson presentations with your QuantumChat account.</p>
      </section>
      <form className="ai-login-form" onSubmit={login}>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {error && <p className="error-banner">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Continue to QuantumAI'}
        </button>
      </form>
    </main>
  );
}
