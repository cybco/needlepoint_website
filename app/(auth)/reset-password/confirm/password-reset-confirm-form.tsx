'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormStatus } from 'react-dom';
import { resetPassword } from '@/lib/actions/password-reset.actions';
import { useActionState, useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import Link from 'next/link';

interface PasswordResetConfirmFormProps {
  token: string;
}

const PasswordResetConfirmForm = ({ token }: PasswordResetConfirmFormProps) => {
  const [data, action] = useActionState(resetPassword, {
    success: false,
    message: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 7) {
      errors.push('At least 7 characters');
    }
    if (!/\d/.test(password)) {
      errors.push('Include at least one number');
    }
    return errors;
  };

  const passwordErrors = validatePassword(password);
  const isValidPassword = passwordErrors.length === 0 && password.length > 0;

  const SubmitButton = () => {
    const { pending } = useFormStatus();
    return (
      <Button 
        disabled={pending || !isValidPassword} 
        className="w-full" 
        variant="default"
      >
        {pending ? 'Updating...' : 'Update Password'}
      </Button>
    );
  };

  if (data && data.success) {
    return (
      <div className="text-center space-y-4">
        <div className="text-green-600 font-medium">
          {data.message}
        </div>
        <Link href="/sign-in" className="inline-block">
          <Button className="w-full">
            Sign In Now
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      
      <div className="space-y-1">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your new password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {/* Password requirements */}
        <div className="text-sm mt-2 space-y-1">
          <div className="text-muted-foreground">Password must include:</div>
          <div className={`flex items-center space-x-1 ${
            password.length >= 7 ? 'text-green-600' : 'text-muted-foreground'
          }`}>
            <span className="text-xs">{password.length >= 7 ? '✓' : '•'}</span>
            <span>At least 7 characters</span>
          </div>
          <div className={`flex items-center space-x-1 ${
            /\d/.test(password) ? 'text-green-600' : 'text-muted-foreground'
          }`}>
            <span className="text-xs">{/\d/.test(password) ? '✓' : '•'}</span>
            <span>At least one number</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <SubmitButton />
      </div>

      {data && !data.success && data.message && (
        <div className="text-center text-destructive text-sm mt-4">
          {data.message}
        </div>
      )}
    </form>
  );
};

export default PasswordResetConfirmForm;