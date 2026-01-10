'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { requestPasswordReset } from '@/lib/actions/password-reset.actions';
import { useActionState } from 'react';

const PasswordResetRequestForm = () => {
  const [data, action] = useActionState(requestPasswordReset, {
    success: false,
    message: '',
  });

  const SubmitButton = () => {
    const { pending } = useFormStatus();
    return (
      <Button disabled={pending} className="w-full" variant="default">
        {pending ? 'Sending...' : 'Send Reset Link'}
      </Button>
    );
  };

  return (
    <form action={action}>
      <div className="space-y-1">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Enter your email address"
        />
      </div>
      <div className="mt-6">
        <SubmitButton />
      </div>
      {data && data.message && (
        <div className={`text-center text-sm mt-4 ${
          data.success ? 'text-green-600' : 'text-destructive'
        }`}>
          {data.message}
        </div>
      )}
    </form>
  );
};

export default PasswordResetRequestForm;