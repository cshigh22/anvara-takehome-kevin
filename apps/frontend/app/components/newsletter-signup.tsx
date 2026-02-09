'use client';

import { useState, useEffect } from 'react';
import { subscribeNewsletter } from '@/lib/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STORAGE_KEY = 'newsletter-subscribed';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

interface NewsletterSignupProps {
  /** Compact layout for sidebar/narrow contexts */
  variant?: 'default' | 'compact';
  /** Optional heading override */
  heading?: string;
  /** Optional description override */
  description?: string;
}

export function NewsletterSignup({
  variant = 'default',
  heading = 'Stay in the loop',
  description = 'Get the latest sponsorship opportunities and marketplace updates delivered to your inbox.',
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');

  // Show success state if user already subscribed this session
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_KEY)) {
      setStatus('success');
      setMessage('Thanks for subscribing!');
    }
  }, []);

  const validateEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Email is required';
    if (!EMAIL_REGEX.test(trimmed)) return 'Please enter a valid email address';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions (double-click, rapid submit)
    if (status === 'loading') return;

    const trimmedEmail = email.trim().toLowerCase();

    const validationError = validateEmail(email);
    if (validationError) {
      setStatus('error');
      setMessage(validationError);
      return;
    }

    // Prevent same email from being submitted again this session
    if (typeof window !== 'undefined') {
      const alreadySubmitted = sessionStorage.getItem(STORAGE_KEY);
      if (alreadySubmitted === trimmedEmail) {
        setStatus('error');
        setMessage('This email has already been subscribed.');
        return;
      }
    }

    setStatus('loading');
    setMessage('');

    try {
      await subscribeNewsletter(trimmedEmail);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, trimmedEmail);
      }
      setStatus('success');
      setMessage('Thanks for subscribing!');
      setEmail(''); // Reset form after success
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  const isCompact = variant === 'compact';

  return (
    <div
      className={isCompact ? 'space-y-3' : 'space-y-4'}
      role="region"
      aria-label="Newsletter signup"
    >
      <div>
        <h3
          className={`font-semibold text-[--color-foreground] ${isCompact ? 'text-base' : 'text-lg'}`}
        >
          {heading}
        </h3>
        <p
          className={`mt-1 text-[--color-muted] ${isCompact ? 'text-sm' : 'text-base'}`}
        >
          {description}
        </p>
      </div>

      {status === 'success' ? (
        <div
          role="status"
          aria-live="polite"
          className="newsletter-success-animate flex items-center gap-2 rounded-lg border border-[--color-success]/30 bg-[--color-success]/10 p-4 text-[--color-success]"
        >
          <svg
            className="h-5 w-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-sm font-medium">{message}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={isCompact ? 'space-y-2' : 'space-y-3'}>
          <div>
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === 'error') {
                  setStatus('idle');
                  setMessage('');
                }
              }}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={status === 'loading'}
              aria-invalid={status === 'error'}
              aria-describedby={
                status === 'error' ? 'newsletter-error' : undefined
              }
              className="w-full rounded-lg border border-[--color-border] bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-500 focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/20 disabled:opacity-60 dark:bg-slate-800 dark:text-gray-100 dark:placeholder:text-gray-400 dark:border-slate-600"
            />
            {status === 'error' && (
              <p
                id="newsletter-error"
                role="alert"
                className="mt-1.5 text-sm text-[--color-error]"
              >
                {message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            aria-busy={status === 'loading'}
            className="w-full rounded-lg bg-[--color-primary] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[--color-primary-hover] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Subscribing...
              </span>
            ) : (
              'Subscribe'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
