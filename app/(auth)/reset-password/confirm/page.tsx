import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { Metadata } from 'next';
import Image from 'next/image';
import PasswordResetConfirmForm from './password-reset-confirm-form';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Confirm Password Reset',
};

const ConfirmResetPasswordPage = async (props: {
  searchParams: Promise<{ token?: string }>;
}) => {
  const { token } = await props.searchParams;
  const session = await auth();

  if (session?.user) {
    return redirect('/');
  }

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-4">
            <Link href="/" className="flex-center">
              <Image
                src="/images/logo.svg"
                width={100}
                height={100}
                alt={`${APP_NAME} logo`}
                priority={true}
              />
            </Link>
            <CardTitle className="text-center">Invalid Reset Link</CardTitle>
            <CardDescription className="text-center">
              This password reset link is invalid or missing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Link href="/reset-password" className="text-blue-600 hover:text-blue-800">
                Request a new password reset
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="space-y-4">
          <Link href="/" className="flex-center">
            <Image
              src="/images/logo.svg"
              width={100}
              height={100}
              alt={`${APP_NAME} logo`}
              priority={true}
            />
          </Link>
          <CardTitle className="text-center">Reset Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PasswordResetConfirmForm token={token} />
          <div className="text-center">
            <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-primary">
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmResetPasswordPage;