// src/components/LoginForm.tsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { loginUser, registerUser } from '../api';

interface LoginFormProps {
  onCancel?: () => void;
}

export default function LoginForm({ onCancel }: LoginFormProps) {
  const auth = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!auth) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const response = await registerUser(email, password);
        if (response.token) {
          auth.login(response.token, email);
        } else {
          // If register succeeded but didn't return a token immediately
          alert('Registration successful! Please login.');
          setIsRegister(false);
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        const response = await loginUser(email, password);
        if (response.token) {
          auth.login(response.token, email);
        } else {
          setError(response.message || 'Login failed');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{isRegister ? 'Create Account' : 'Login to Account'}</h2>
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel} 
            className="btn-secondary btn-sm"
            style={{ width: '32px', height: '32px', borderRadius: '50%', padding: 0 }}
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="form-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">Email Address</label>
          <input 
            id="login-email"
            type="email" 
            className="form-input"
            placeholder="name@example.com"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="login-password">Password</label>
          <input 
            id="login-password"
            type="password" 
            className="form-input"
            placeholder="••••••••"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>

        {isRegister && (
          <div className="form-group">
            <label className="form-label" htmlFor="login-confirm-password">Confirm Password</label>
            <input 
              id="login-confirm-password"
              type="password" 
              className="form-input"
              placeholder="••••••••"
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel} 
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary"
            style={{ flex: 1 }}
          >
            {loading ? (isRegister ? 'Registering...' : 'Logging in...') : (isRegister ? 'Register' : 'Login')}
          </button>
        </div>
      </form>

      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.875rem' }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
        </span>
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setError(null);
            setPassword('');
            setConfirmPassword('');
          }}
          style={{ 
            border: 'none', 
            background: 'none', 
            color: 'var(--color-primary)', 
            fontWeight: 600, 
            padding: '0 4px', 
            cursor: 'pointer', 
            textDecoration: 'underline' 
          }}
        >
          {isRegister ? 'Sign In' : 'Sign Up'}
        </button>
      </div>
    </div>
  );
}
