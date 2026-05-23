import { Mail, X, RefreshCw, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface EmailVerificationNoticeProps {
  email: string;
  onDismiss: () => void;
  onResend: () => void;
  cooldown?: number;
}

export default function EmailVerificationNotice({ email, onDismiss, onResend, cooldown = 0 }: EmailVerificationNoticeProps) {
  const [timeLeft, setTimeLeft] = useState(cooldown);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setTimeLeft(cooldown);
  }, [cooldown]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleResend = async () => {
    setErrorMessage(null);
    try {
      await onResend();
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to send email. Please try again later.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-amber-600" />
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Verify Your Email
        </h2>
        <p className="text-gray-600 text-center mb-6">
          We've sent a verification link to:
        </p>
        <p className="text-indigo-600 font-semibold text-center mb-6 bg-indigo-50 py-3 px-4 rounded-lg">
          {email}
        </p>
        <p className="text-gray-500 text-center text-sm mb-4">
          Please check your inbox and click the verification link to activate your account.
          Don't forget to check your spam folder if you don't see the email.
        </p>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
            {errorMessage}
          </div>
        )}

        {/* Cooldown Message */}
        {timeLeft > 0 && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600 text-sm">Resend available in {formatTime(timeLeft)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleResend}
            disabled={timeLeft > 0}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-colors ${
              timeLeft > 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${timeLeft > 0 ? '' : 'animate-spin-once'}`} />
            {timeLeft > 0 ? `Resend in ${formatTime(timeLeft)}` : 'Resend Verification Email'}
          </button>
          <button
            onClick={onDismiss}
            className="w-full text-gray-500 py-2 px-4 rounded-xl font-medium hover:text-gray-700 transition-colors"
          >
            I'll verify later
          </button>
        </div>

        {/* Help text */}
        <p className="text-xs text-gray-400 text-center mt-4">
          Didn't receive the email? Check your spam folder or wait a few minutes before retrying.
        </p>
      </div>
    </div>
  );
}