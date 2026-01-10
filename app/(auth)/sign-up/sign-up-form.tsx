'use client';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {SignUpDefaultValues} from '@/lib/constants';
import Link from 'next/link';
import {useActionState} from 'react';
import {useFormStatus} from 'react-dom';
import {signUpUser} from '@/lib/actions/user.actions';
import {useSearchParams} from 'next/navigation';

const CredentialsSignUpForm = () => {
  const [data, action] = useActionState(signUpUser, {
    success: false,
    message: '',
  });

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const SignUpButton = () => {
    const {pending} = useFormStatus();
    return (
      <Button disabled={pending} className="w-full" variant="default">
        {pending ? 'Submitting' : 'Sign Up'}
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
          // required
          autoComplete="email"
          defaultValue={SignUpDefaultValues.email}
        ></Input>
      </div>
      <div className="space-y-1 mt-6">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          //required
          autoComplete="password"
          defaultValue={SignUpDefaultValues.password}
        ></Input>
      </div>
      <div className="space-y-1 mt-6">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          //required
          autoComplete="confirmpassword"
          defaultValue={SignUpDefaultValues.password}
        ></Input>
      </div>
      <div className="mt-6">
        <SignUpButton />
      </div>
      {data && !data.success && (
        <div className="text-center text-destructive mt-6">{data.message}</div>
      )}
      <div className="text-sm text-center text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link href="/sign-in" target="_self" className="link">
          Sign In
        </Link>
      </div>
    </form>
  );
};

export default CredentialsSignUpForm;
