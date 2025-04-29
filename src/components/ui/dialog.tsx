import * as React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({ children, className = '', ...props }: React.ComponentPropsWithoutRef<typeof RadixDialog.Content>) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
      <RadixDialog.Content
        className={
          'fixed z-50 left-1/2 top-1/2 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white dark:bg-zinc-900 p-6 shadow-lg focus:outline-none ' +
          className
        }
        {...props}
      >
        {children}
        <RadixDialog.Close asChild>
          <button
            className="absolute right-4 top-4 rounded-md p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function DialogHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={"mb-4 " + className}>{children}</div>;
}

export function DialogTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <RadixDialog.Title className={"text-lg font-bold " + className}>{children}</RadixDialog.Title>;
}

export const DialogClose = RadixDialog.Close; 