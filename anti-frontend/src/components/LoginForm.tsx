import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { loginUser, registerUser, verifyOtp, resendOtp, forgotPassword, resetPassword, googleLogin } from '../api';
import { useGoogleLogin } from '@react-oauth/google';
import AuthAnimation from './animations/AuthAnimation';

interface LoginFormProps {
  onCancel?: () => void;
  initialRegister?: boolean;
}

// Password strength calculation
const calculateStrength = (pass: string) => {
  let score = 0;
  if (!pass) return score;
  if (pass.length > 5) score += 1;
  if (pass.length > 8) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;
  return Math.min(score, 5); // 0-5
};

const getStrengthColor = (score: number) => {
  switch (score) {
    case 0: return 'bg-slate-200';
    case 1: return 'bg-rose-500';
    case 2: return 'bg-orange-500';
    case 3: return 'bg-amber-400';
    case 4: return 'bg-emerald-400';
    case 5: return 'bg-emerald-600';
    default: return 'bg-slate-200';
  }
};

const OtpInput = ({ value, onChange, disabled }: { value: string, onChange: (val: string) => void, disabled?: boolean }) => {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 1) {
      const pastedData = val.slice(0, 6);
      onChange(pastedData.padEnd(6, '').slice(0, 6));
      const nextIndex = Math.min(pastedData.length, 5);
      inputs.current[nextIndex]?.focus();
      return;
    }
    
    const chars = value.split('').concat(Array(6).fill(''));
    chars[index] = val.slice(-1);
    const newValue = chars.slice(0, 6).join('');
    onChange(newValue);
    
    if (val && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      const chars = value.split('').concat(Array(6).fill(''));
      chars[index - 1] = '';
      onChange(chars.slice(0, 6).join(''));
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-4 my-8 w-full" dir="ltr">
      {Array(6).fill(0).map((_, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={6}
          disabled={disabled}
          value={value[i] || ''}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="w-12 h-14 sm:w-14 sm:h-16 bg-[#FFFFFF] border border-[#6E6E73]/40 rounded-xl text-center text-xl sm:text-2xl font-bold text-[#111113] focus:bg-[#FAFAFA] focus:border-[#111113] focus:ring-1 focus:ring-[#111113] transition-all outline-none disabled:opacity-50"
        />
      ))}
    </div>
  );
};

const FormInput = ({ id, type, label, value, onChange, required = true, children }: any) => (
  <div className="relative mb-4">
    <input
      id={id}
      type={type}
      className="peer w-full bg-[#FFFFFF] border border-[#6E6E73]/30 text-[#111113] text-sm rounded-xl px-4 pt-[22px] pb-2 outline-none focus:border-[#111113] focus:ring-1 focus:ring-[#111113] transition-all placeholder-transparent"
      placeholder={label}
      value={value}
      onChange={onChange}
      required={required}
    />
    <label
      htmlFor={id}
      className="absolute left-4 top-3.5 text-[10px] font-semibold text-[#6E6E73] -translate-y-[20px] bg-[#FFFFFF] px-1.5 z-10 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:-translate-y-0 peer-placeholder-shown:bg-transparent peer-placeholder-shown:z-0 peer-focus:text-[10px] peer-focus:text-[#111113] peer-focus:-translate-y-[20px] peer-focus:bg-[#FFFFFF] peer-focus:z-10 pointer-events-none"
    >
      {label}
    </label>
    {children}
  </div>
);

const PrimaryButton = ({ children, disabled, loading, type = "submit", onClick }: any) => (
  <button 
    type={type}
    disabled={disabled || loading} 
    onClick={onClick}
    className="w-full bg-[#111113] hover:bg-[#111113]/90 text-white font-bold text-sm py-4 px-4 rounded-xl transition-all transform active:scale-[0.99] disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-2 mt-4"
  >
    {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</> : children}
  </button>
);

const SecondaryButton = ({ children, disabled, onClick }: any) => (
  <button 
    type="button" 
    disabled={disabled} 
    onClick={onClick} 
    className="w-full bg-white hover:bg-[#FAFAFA] border border-[#6E6E73]/30 text-[#111113] text-sm font-semibold py-4 px-4 rounded-xl transition-all disabled:opacity-50 mt-3"
  >
    {children}
  </button>
);

const LeftHeroSection = () => (
  <div className="hidden lg:flex lg:w-[45%] bg-[#FFFFFF] relative overflow-hidden flex-col justify-end px-[54px] py-16 xl:px-[86px] xl:py-24 pb-20">
    {/* Live Lottie Animation in background/middle */}
    <div className="absolute inset-0 flex items-center justify-center p-8 z-0">
      <AuthAnimation />
    </div>
  </div>
);

const HeaderText = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-bold text-[#111113] mb-2">{title}</h2>
    <p className="text-sm text-[#6E6E73]">{subtitle}</p>
  </div>
);

const RightContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full lg:w-[55%] flex flex-col bg-[#FFFFFF] relative h-full items-center justify-center py-6">
    <div className="w-full max-w-[500px] flex flex-col justify-center">
      <div className="overflow-y-auto auth-scroll px-4 md:px-8 py-4 max-h-[430px]">
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  </div>
);

export default function LoginForm({ onCancel, initialRegister = false }: LoginFormProps) {
  const auth = useContext(AuthContext);
  
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError(null);
        const res = await googleLogin(tokenResponse.access_token);
        if (res.token) {
          auth?.login(res.token);
          if (onCancel) onCancel();
        } else {
          setError('Google Login failed: No token received');
        }
      } catch (err: any) {
        setError(err.message || 'Google Login failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google Login Failed'),
  });
  
  // Basic states
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'SELLER'>('CUSTOMER');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(initialRegister);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // OTP Verification states
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forgot Password states
  const [isForgot, setIsForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotPasswordValue, setForgotPasswordValue] = useState('');
  const [forgotConfirmPasswordValue, setForgotConfirmPasswordValue] = useState('');
  const [showForgotPwd, setShowForgotPwd] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isVerifyingOtp || (isForgot && forgotStep === 2)) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (isVerifyingOtp) {
              setIsVerifyingOtp(false);
              setIsRegister(true);
              setError('Verification timed out. Please check your details and try again.');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isVerifyingOtp, isForgot, forgotStep]);

  useEffect(() => {
    let cooldownTimer: any;
    if (resendCooldown > 0) {
      cooldownTimer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownTimer) clearInterval(cooldownTimer);
    };
  }, [resendCooldown]);

  useEffect(() => {
    setIsRegister(initialRegister);
    setError(null);
    setFirstName('');
    setLastName('');
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
    setResendCooldown(0);
    setIsForgot(false);
    setForgotStep(1);
    setForgotPasswordValue('');
    setForgotConfirmPasswordValue('');
    setRoleDropdownOpen(false);
  }, [initialRegister]);

  // Close role dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
        const fullName = `${firstName} ${lastName}`.trim();
        const response = await registerUser(fullName, email, password, role);
        setIsVerifyingOtp(true);
        setTimeLeft(120);
        setResendCooldown(30);
        setOtpCode('');
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
      if (errorMsg.toLowerCase().includes('verify your email') || errorMsg.toLowerCase().includes('otp code')) {
        setIsVerifyingOtp(true);
        setTimeLeft(120);
        setResendCooldown(30);
        setOtpMessage('Your account is not verified yet. Please enter the verification code sent to your email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      setError('Please enter the 6-digit code');
      return;
    }
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
    if (resendCooldown > 0) return;
    setError(null);
    setOtpMessage(null);
    setResendLoading(true);

    try {
      const response = await resendOtp(email);
      setOtpMessage(response.message || 'Verification code resent successfully.');
      setTimeLeft(120);
      setResendCooldown(30);
      setOtpCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setResendLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOtpMessage(null);
    setLoading(true);

    try {
      const response = await forgotPassword(email);
      setOtpMessage(response.message || 'Password reset verification code sent to email.');
      setForgotStep(2);
      setTimeLeft(120);
      setResendCooldown(30);
      setOtpCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    if (forgotPasswordValue !== forgotConfirmPasswordValue) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setOtpMessage(null);
    setLoading(true);

    try {
      const response = await resetPassword(email, otpCode, forgotPasswordValue);
      if (response.token) {
        auth.login(response.token, email);
      } else {
        alert(response.message || 'Password reset successful! Please log in.');
        setIsForgot(false);
        setForgotStep(1);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendForgotPasswordOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setOtpMessage(null);
    setResendLoading(true);

    try {
      const response = await forgotPassword(email);
      setOtpMessage(response.message || 'Verification code resent successfully.');
      setTimeLeft(120);
      setResendCooldown(30);
      setOtpCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setResendLoading(false);
    }
  };

  const errorAlert = error && (
    <div className="mb-8 bg-rose-50 border border-rose-200 text-rose-700 px-5 py-4 rounded-xl flex items-start gap-3 text-sm animate-[slideIn_0.3s_ease] font-medium shadow-sm">
      <svg className="w-5 h-5 mt-0.5 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>{error}</span>
    </div>
  );

  const messageAlert = otpMessage && (
    <div className="mb-8 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl flex items-start gap-3 text-sm animate-[slideIn_0.3s_ease] font-medium shadow-sm">
      <svg className="w-5 h-5 mt-0.5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <span>{otpMessage}</span>
    </div>
  );



  const strengthScore = calculateStrength(password);



  return (
    <>
      {/* Import the elegant serif font for the Sellora logo and style scrollbar */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&family=Playfair+Display:wght@700&display=swap');
        
        .auth-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .auth-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .auth-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .auth-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#FAFAFA] p-8 sm:p-12 md:p-16 lg:p-20 xl:p-24 overflow-hidden">
        {/* Brand Logo in top-left of the page */}
        <div 
          className="absolute top-8 left-8 md:top-3 md:left-7 z-50 text-[2.2rem] font-bold tracking-[-0.03em] text-[#111113]"
          style={{ fontFamily: '"Playfair Display", "Cormorant Garamond", serif' }}
        >
          Sellora
        </div>

        {/* Back to Store button in top-right of the page */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-8 right-8 md:top-5 md:right-7 z-50 flex items-center gap-2 px-4 py-2 border border-[#111113]/30 hover:border-[#111113] text-[#111113] hover:bg-[#111113] hover:text-white transition-all rounded-full text-xs font-bold uppercase tracking-wider"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Back to Store
          </button>
        )}

        {/* Main Floating Card Container */}
        <div className="w-full h-full max-w-7xl max-h-[900px] bg-[#FFFFFF] rounded-3xl sm:rounded-[2.5rem] shadow-[0_30px_100px_-10px_rgba(0,0,0,0.18)] border border-[#6E6E73]/20 flex overflow-hidden animate-[fadeIn_0.4s_ease-out] relative">
          
          <LeftHeroSection />

          {/* RIGHT SIDE: Auth Form Container */}
          {isForgot ? (
            <RightContainer>
              {forgotStep === 1 ? (
                <>
                  <HeaderText title="Reset Password" subtitle="Enter your email to receive a secure code." />
                  {errorAlert}
                  {messageAlert}
                  <form onSubmit={handleForgotPasswordRequest} className="mt-8">
                    <FormInput id="forgot-email" type="email" label="Email Address" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                    <PrimaryButton loading={loading}>Send Reset Link</PrimaryButton>
                    <SecondaryButton onClick={() => { setIsForgot(false); setError(null); setOtpMessage(null); }}>Back to Login</SecondaryButton>
                  </form>
                </>
              ) : (
                <>
                  <HeaderText title="Create New Password" subtitle="Enter the 6-digit code we sent you." />
                  {errorAlert}
                  {messageAlert}
                  <form onSubmit={handleForgotPasswordReset}>
                    <div className="mb-8 flex flex-col items-center">
                      <span className={`text-sm font-bold px-4 py-1.5 rounded-full border ${timeLeft <= 15 ? 'text-rose-600 border-rose-200 bg-rose-50' : 'text-[#6E6E73] border-[#6E6E73]/30 bg-[#FAFAFA]'}`}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} remaining
                      </span>
                      <OtpInput value={otpCode} onChange={setOtpCode} disabled={loading} />
                    </div>

                    <FormInput id="reset-pwd" type={showForgotPwd ? "text" : "password"} label="New Password" value={forgotPasswordValue} onChange={(e: any) => setForgotPasswordValue(e.target.value)}>
                      <button type="button" onClick={() => setShowForgotPwd(!showForgotPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition-colors flex items-center justify-center" aria-label={showForgotPwd ? "Hide password" : "Show password"}>
                        {showForgotPwd ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        )}
                      </button>
                    </FormInput>
                    <FormInput id="reset-confirm" type={showForgotPwd ? "text" : "password"} label="Confirm New Password" value={forgotConfirmPasswordValue} onChange={(e: any) => setForgotConfirmPasswordValue(e.target.value)} />

                    <PrimaryButton loading={loading}>Reset Password</PrimaryButton>
                    <SecondaryButton disabled={resendLoading || resendCooldown > 0} onClick={handleResendForgotPasswordOtp}>
                      {resendLoading ? 'Resending...' : resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
                    </SecondaryButton>
                  </form>
                </>
              )}
            </RightContainer>
          ) : isVerifyingOtp ? (
            <RightContainer>
              <HeaderText title="Verify your email" subtitle={`We've sent a 6-digit code to ${email}`} />
              {errorAlert}
              {messageAlert}

              <form onSubmit={handleOtpSubmit} className="mt-8">
                <div className="mb-10 text-center">
                  <div className="flex justify-center mb-6">
                    <span className={`text-sm font-bold px-4 py-1.5 rounded-full border ${timeLeft <= 15 ? 'text-rose-600 border-rose-200 bg-rose-50' : 'text-[#6E6E73] border-[#6E6E73]/30 bg-[#FAFAFA]'}`}>
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} remaining
                    </span>
                  </div>
                  <OtpInput value={otpCode} onChange={setOtpCode} disabled={loading} />
                </div>

                <PrimaryButton loading={loading}>Verify Account</PrimaryButton>
                
                <div className="mt-8 text-center text-sm font-semibold">
                  <span className="text-[#6E6E73]">Didn't receive the code?</span>{' '}
                  <button type="button" disabled={resendLoading || resendCooldown > 0} onClick={handleResendOtp} className={`transition-colors p-0 bg-transparent border-none inline-baseline ${resendCooldown > 0 ? 'text-[#6E6E73]/50 cursor-not-allowed' : 'text-[#2563EB] hover:text-[#1D4ED8] hover:underline'}`}>
                    {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Click to resend'}
                  </button>
                </div>
              </form>
            </RightContainer>
          ) : (
            <RightContainer>
              <HeaderText 
                title={isRegister ? "Create an account" : "Welcome Back"} 
                subtitle={isRegister ? "Join Sellora for a premium shopping experience." : "Sign in to continue shopping on Sellora."} 
              />
              {errorAlert}

              <form onSubmit={handleSubmit} className="mt-6">
                {isRegister && (
                  <div className="flex gap-4 mb-4">
                    <div className="relative flex-1 group">
                      <input
                        id="reg-fname"
                        type="text"
                        className="peer w-full bg-[#FFFFFF] border border-[#6E6E73]/30 text-[#111113] text-sm rounded-xl px-4 pt-[22px] pb-2 outline-none focus:border-[#111113] focus:ring-1 focus:ring-[#111113] transition-all placeholder-transparent"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                      <label
                        htmlFor="reg-fname"
                        className="absolute left-4 top-3.5 text-[10px] font-semibold text-[#6E6E73] -translate-y-[20px] bg-[#FFFFFF] px-1.5 z-10 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:-translate-y-0 peer-placeholder-shown:bg-transparent peer-placeholder-shown:z-0 peer-focus:text-[10px] peer-focus:text-[#111113] peer-focus:-translate-y-[20px] peer-focus:bg-[#FFFFFF] peer-focus:z-10 pointer-events-none"
                      >
                        First Name
                      </label>
                    </div>
                    <div className="relative flex-1 group">
                      <input
                        id="reg-lname"
                        type="text"
                        className="peer w-full bg-[#FFFFFF] border border-[#6E6E73]/30 text-[#111113] text-sm rounded-xl px-4 pt-[22px] pb-2 outline-none focus:border-[#111113] focus:ring-1 focus:ring-[#111113] transition-all placeholder-transparent"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                      <label
                        htmlFor="reg-lname"
                        className="absolute left-4 top-3.5 text-[10px] font-semibold text-[#6E6E73] -translate-y-[20px] bg-[#FFFFFF] px-1.5 z-10 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:-translate-y-0 peer-placeholder-shown:bg-transparent peer-placeholder-shown:z-0 peer-focus:text-[10px] peer-focus:text-[#111113] peer-focus:-translate-y-[20px] peer-focus:bg-[#FFFFFF] peer-focus:z-10 pointer-events-none"
                      >
                        Last Name
                      </label>
                    </div>
                  </div>
                )}

                {isRegister && (
                  <div className="mb-4 relative" ref={dropdownRef}>
                    <button
                      id="reg-role"
                      type="button"
                      onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                      className={`w-full bg-[#FFFFFF] border text-left text-sm rounded-xl px-4 pt-[22px] pb-2 outline-none transition-all flex items-center justify-between cursor-pointer font-medium h-[52px] ${
                        roleDropdownOpen ? 'border-[#111113] ring-1 ring-[#111113]' : 'border-[#6E6E73]/30'
                      }`}
                    >
                      <span className="text-[#111113]">
                        {role === 'CUSTOMER' ? 'Personal Account' : 'Merchant Account'}
                      </span>
                      <span className="text-[#6E6E73]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className={`w-4 h-4 transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180' : ''}`}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </span>
                    </button>
                    <label
                      htmlFor="reg-role"
                      className="absolute left-4 top-3.5 text-[10px] font-semibold text-[#6E6E73] -translate-y-[20px] bg-[#FFFFFF] px-1.5 z-10 pointer-events-none"
                    >
                      Account Type
                    </label>
                    {roleDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1 bg-[#FFFFFF] border border-[#6E6E73]/20 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] z-50 overflow-hidden animate-[fadeIn_0.15s_ease-out]">
                        <button
                          type="button"
                          onClick={() => {
                            setRole('CUSTOMER');
                            setRoleDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3.5 text-sm transition-colors hover:bg-[#FAFAFA] font-medium ${
                            role === 'CUSTOMER' ? 'text-[#111113] bg-[#FAFAFA]' : 'text-[#6E6E73]'
                          }`}
                        >
                          Personal Account
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRole('SELLER');
                            setRoleDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3.5 text-sm transition-colors hover:bg-[#FAFAFA] font-medium border-t border-slate-100 ${
                            role === 'SELLER' ? 'text-[#111113] bg-[#FAFAFA]' : 'text-[#6E6E73]'
                          }`}
                        >
                          Merchant Account
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <FormInput id="login-email" type="email" label="Email address" value={email} onChange={(e: any) => setEmail(e.target.value)} />

                <FormInput
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  required
                >
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6E6E73] hover:text-[#111113] transition-colors flex items-center justify-center" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </FormInput>

                {isRegister && password && (
                  <div className="mb-6 px-1">
                    <div className="flex gap-1 h-1 w-full mb-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div key={level} className={`flex-1 rounded-full transition-colors duration-500 ${strengthScore >= level ? getStrengthColor(strengthScore) : 'bg-slate-100'}`}></div>
                      ))}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 text-right">
                      {strengthScore < 3 ? 'Weak' : strengthScore < 4 ? 'Good' : 'Strong'}
                    </div>
                  </div>
                )}
                {!isRegister && <div className="mb-4"></div>}

                {isRegister && (
                  <FormInput
                    id="login-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={(e: any) => setConfirmPassword(e.target.value)}
                    required
                  >
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6E6E73] hover:text-[#111113] transition-colors flex items-center justify-center" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                      {showConfirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      )}
                    </button>
                  </FormInput>
                )}

                {!isRegister && (
                  <div className="flex justify-end mb-8 -mt-1">
                    <button type="button" onClick={() => { setIsForgot(true); setForgotStep(1); setError(null); setOtpMessage(null); }} className="text-sm font-semibold text-[#6E6E73] hover:text-[#2563EB] transition-colors p-0 bg-transparent border-none inline-baseline">
                      Forgot password?
                    </button>
                  </div>
                )}

                <PrimaryButton loading={loading}>
                  {isRegister ? 'Create Account' : 'Sign In'}
                </PrimaryButton>

                <div className="relative flex py-4 items-center">
                  <div className="flex-grow border-t border-[#6E6E73]/20"></div>
                  <span className="flex-shrink mx-4 text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">or</span>
                  <div className="flex-grow border-t border-[#6E6E73]/20"></div>
                </div>

                <button
                  type="button"
                  onClick={() => loginWithGoogle()}
                  className="w-full bg-[#FFFFFF] hover:bg-[#FAFAFA] border border-[#6E6E73]/30 text-[#111113] font-bold text-sm py-4 px-4 rounded-xl transition-all transform active:scale-[0.99] flex justify-center items-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.355 0 3.39 2.673 1.482 6.573L5.266 9.765z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.273c0-.818-.073-1.609-.209-2.373H12v4.509h6.445c-.277 1.482-1.118 2.736-2.373 3.582v2.982h3.836c2.245-2.073 3.582-5.118 3.582-8.7z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.266 14.235A7.098 7.098 0 0 1 4.909 12c0-.791.136-1.555.357-2.265L1.482 6.573A11.934 11.934 0 0 0 0 12c0 2.01.5 3.9 1.382 5.573l3.884-3.338z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.245 0 5.973-1.073 7.964-2.909l-3.836-2.982c-1.064.718-2.436 1.145-4.128 1.145-3.182 0-5.882-2.145-6.845-5.027l-3.855 3.191C3.218 21.264 7.282 24 12 24z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </form>

              <div className="mt-5 pt-3 border-t border-[#6E6E73]/20 text-center text-sm font-semibold">
                <span className="text-[#6E6E73]">
                  {isRegister ? 'Already have an account?' : "Don't have an account?"}
                </span>{' '}
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
                  className="text-[#2563EB] hover:text-[#1D4ED8] hover:underline transition-all p-0 bg-transparent border-none inline-baseline"
                >
                  {isRegister ? 'Sign in' : 'Register now'}
                </button>
              </div>
            </RightContainer>
          )}

        </div>
      </div>
    </>
  );
}
