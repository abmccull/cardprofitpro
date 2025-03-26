import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl font-bold text-primary mb-8 text-center">
          Join CardProfit Pro
        </h1>
        <p className="text-lg text-gray-600 mb-12 text-center">
          Create an account to streamline your sports card flipping business
        </p>
        <div className="flex justify-center">
          <SignUp redirectUrl="/dashboard" routing="path" path="/auth/sign-up" />
        </div>
      </div>
    </main>
  );
} 