// src/components/Unauthorized.tsx
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px 24px',
      textAlign: 'center',
      background: 'var(--color-bg-surface)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-md)',
      maxWidth: '480px',
      margin: '80px auto',
      border: '1px solid var(--color-border)'
    }}>
      <div style={{
        fontSize: '4.5rem',
        marginBottom: '20px',
        lineHeight: 1,
        animation: 'bounce 2s infinite'
      }}>
        🛡️
      </div>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 800,
        color: 'var(--color-text-primary)',
        marginBottom: '12px',
        letterSpacing: '-0.025em'
      }}>
        Access Denied
      </h1>
      <div style={{
        width: '40px',
        height: '4px',
        background: 'var(--color-danger)',
        borderRadius: '2px',
        marginBottom: '24px'
      }}></div>
      <p style={{
        fontSize: '1rem',
        color: 'var(--color-text-secondary)',
        lineHeight: '1.6',
        marginBottom: '32px',
        maxWidth: '360px'
      }}>
        You do not have the required permissions to view this page. If you believe this is an error, please contact support or try logging in with a different account.
      </p>
      <div style={{
        display: 'flex',
        gap: '12px',
        width: '100%'
      }}>
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary"
          style={{ flex: 1, padding: '12px' }}
        >
          Go Back
        </button>
        <button
          onClick={() => navigate('/')}
          className="btn-primary"
          style={{ flex: 1, padding: '12px' }}
        >
          Home Page
        </button>
      </div>
    </div>
  );
}
