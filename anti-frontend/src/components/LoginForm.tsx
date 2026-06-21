9// src/components/LoginForm.tsx
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { loginUser, registerUser, verifyOtp, resendOtp } from '../api';

interface LoginFormProps {
  onCancel?: () => void;
  initialRegister?: boolean;
}

export default function LoginForm({ onCancel, initialRegister = false }: LoginFormProps) {
  const auth = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'SELLER'>('CUSTOMER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(initialRegister);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification states
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds

  useEffect(() => {
    let timer: any;
    if (isVerifyingOtp) {
      setTimeLeft(120);
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsVerifyingOtp(false);
            setIsRegister(true);
            setError('Verification timed out. Please check your details and try again.');
            return 120;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isVerifyingOtp]);

  useEffect(() => {
    setIsRegister(initialRegister);
    setError(null);
    setName('');
    setRole('CUSTOMER');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsVerifyingOtp(false);
    setOtpCode('');
    setOtpMessage(null);
    setResendLoading(false);
    setTimeLeft(120);
  }, [initialRegister]);

  if (!auth) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOtpMessage(null);

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const response = await registerUser(name, email, password, role);
        // Since backend requires verification, response.token is null, so switch to OTP screen
        setIsVerifyingOtp(true);
        setOtpMessage(response.message || 'Verification code sent to your email. Please enter the OTP code below.');
      } else {
        const response = await loginUser(email, password);
        if (response.token) {
          auth.login(response.token, email);
        } else {
          setError(response.message || 'Login failed');
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Network error';
      setError(errorMsg);
      // Auto transition to OTP screen if unverified
      if (errorMsg.toLowerCase().includes('verify your email') || errorMsg.toLowerCase().includes('otp code')) {
        setIsVerifyingOtp(true);
        setOtpMessage('Your account is not verified yet. Please enter the verification code sent to your email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOtpMessage(null);
    setLoading(true);

    try {
      const response = await verifyOtp(email, otpCode);
      if (response.token) {
        auth.login(response.token, email);
      } else {
        setError('Verification succeeded, but session token was not received. Please log in.');
        setIsVerifyingOtp(false);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setOtpMessage(null);
    setResendLoading(true);

    try {
      const response = await resendOtp(email);
      setOtpMessage(response.message || 'Verification code resent successfully.');
      setTimeLeft(120);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setResendLoading(false);
    }
  };

  if (isVerifyingOtp) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Verify Email</h2>
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

        {otpMessage && (
          <div style={{ 
            backgroundColor: '#e6f4ea', 
            color: '#137333', 
            padding: '12px', 
            borderRadius: '6px', 
            marginBottom: '16px', 
            fontSize: '0.875rem',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <span>✉️</span>
            <span>{otpMessage}</span>
          </div>
        )}

        {error && (
          <div className="form-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Countdown Timer */}
        <div style={{
          fontSize: '0.875rem',
          fontWeight: 700,
          color: timeLeft <= 15 ? '#b91c1c' : 'var(--color-primary)',
          backgroundColor: timeLeft <= 15 ? '#fef2f2' : 'rgba(79, 70, 229, 0.08)',
          padding: '8px 12px',
          borderRadius: '8px',
          marginBottom: '16px',
          textAlign: 'center',
          border: timeLeft <= 15 ? '1px solid #fee2e2' : '1px solid rgba(79, 70, 229, 0.15)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>⏱️</span>
          <span>Time remaining:</span>
          <span style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 800 }}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60) < 10 ? '0' : ''}{timeLeft % 60}
          </span>
        </div>

        <form onSubmit={handleOtpSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="otp-code">Verification Code</label>
            <input 
              id="otp-code"
              type="text" 
              className="form-input"
              placeholder="Enter 6-digit code"
              value={otpCode} 
              onChange={(e) => setOtpCode(e.target.value.trim())} 
              maxLength={6}
              pattern="\d{6}"
              title="Please enter a 6-digit code"
              style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', padding: '10px' }}
              required 
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button 
              type="button" 
              onClick={() => {
                setIsVerifyingOtp(false);
                setError(null);
                setOtpMessage(null);
                setIsRegister(name.trim() !== '');
              }} 
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Back
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary"
              style={{ flex: 1 }}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            Didn't receive the code?{' '}
          </span>
          <button
            type="button"
            disabled={resendLoading}
            onClick={handleResendOtp}
            style={{ 
              border: 'none', 
              background: 'none', 
              color: resendLoading ? 'var(--color-text-secondary)' : 'var(--color-primary)', 
              fontWeight: 600, 
              padding: '0 4px', 
              cursor: resendLoading ? 'not-allowed' : 'pointer', 
              textDecoration: 'underline' 
            }}
          >
            {resendLoading ? 'Resending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    );
  }

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
        {isRegister && (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="register-name">Full Name</label>
              <input 
                id="register-name"
                type="text" 
                className="form-input"
                placeholder="John Doe"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-role">Register As</label>
              <select
                id="register-role"
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                style={{ background: 'white', cursor: 'pointer' }}
                required
              >
                <option value="CUSTOMER">Customer (Buyer)</option>
                <option value="SELLER">Seller (Merchant)</option>
              </select>
            </div>
          </>
        )}

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
          <div className="password-input-container">
            <input 
              id="login-password"
              type={showPassword ? "text" : "password"} 
              className="form-input"
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {isRegister && (
          <div className="form-group">
            <label className="form-label" htmlFor="login-confirm-password">Confirm Password</label>
            <div className="password-input-container">
              <input 
                id="login-confirm-password"
                type={showConfirmPassword ? "text" : "password"} 
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
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
            setShowPassword(false);
            setShowConfirmPassword(false);
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
