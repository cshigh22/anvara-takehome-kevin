'use client';

import { useFormStatus } from 'react-dom';

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function SubmitButton({ children, pendingLabel = 'Saving...', className, disabled }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}
