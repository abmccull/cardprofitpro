import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl font-bold text-primary mb-8 text-center">
          Welcome to CardProfit Pro
        </h1>
        <p className="text-lg text-gray-600 mb-12 text-center">
          Streamline your sports card flipping business with AI-powered analytics and automation
        </p>
        <div className="flex justify-center">
          <SignIn redirectUrl="/dashboard" routing="path" path="/auth/sign-in" />
        </div>
      </div>
    </main>
  );
} 