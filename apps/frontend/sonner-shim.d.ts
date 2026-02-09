import type { ReactElement } from 'react';

declare module 'sonner' {
  const toast: {
    (message?: string): void;
    success: (message: string) => void;
    error: (message: string) => void;
  };
  export { toast };
  export function Toaster(props?: { position?: string; richColors?: boolean }): ReactElement;
}
