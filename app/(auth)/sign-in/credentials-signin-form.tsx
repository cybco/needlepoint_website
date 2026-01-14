'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {SignInDefaultValues} from '@/lib/constants';
import Link from 'next/link';
import {useActionState} from 'react';
import {useFormStatus} from 'react-dom';
import {signInWithCredentials} from '@/lib/actions/user.actions';
import {useSearchParams} from 'next/navigation';

const CredentialsSignInForm = () => {
  const [data, action] = useActionState(signInWithCredentials, {
    success: false,
    message: '',
  });

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const SignInButton = () => {
    const {pending} = useFormStatus();
    return (
      <Button disabled={pending} className="w-full" variant="default">
        {pending ? 'Signing In...' : 'Sign In'}
      </Button>
    );
  };

  return (
    <form action={action}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={SignInDefaultValues.email}
        ></Input>
      </div>
      <div className="space-y-1 mt-6">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="password"
          defaultValue={SignInDefaultValues.password}
        ></Input>
      </div>
      <div className="mt-6">
        <SignInButton />
      </div>
      {data && !data.success && (
        <div className="text-center text-destructive mt-6">{data.message}</div>
      )}
      <div className="text-center mt-4">
        <Link href="/reset-password" className="text-sm font-bold text-muted-foreground hover:text-primary">
          Forgot Password
        </Link>
      </div>
      <div className="text-center mt-6">
        <Link href="/sign-up" target="_self" className="text-sm font-bold text-muted-foreground hover:text-primary">
          Create Account
        </Link>
      </div>
    </form>
  );
};

export default CredentialsSignInForm;
