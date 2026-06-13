"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { signIn, signUp } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

function getCallbackURL() {
  if (typeof window === "undefined") {
    return "/home";
  }

  return `${window.location.origin}/home`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleEmailContinue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!isValidEmail(trimmedEmail)) {
      toast.error("Enter a valid email address");
      return;
    }

    if (password.length < 12) {
      toast.error("Password must be at least 12 characters");
      return;
    }

    setIsLoading(true);

    try {
      const callbackURL = getCallbackURL();
      const displayName = trimmedEmail.split("@")[0] ?? "User";

      const signUpResult = await signUp.email({
        email: trimmedEmail,
        password,
        name: displayName,
        callbackURL,
      });

      if (!signUpResult.error) {
        router.push("/home");
        router.refresh();
        return;
      }

      const existingUserCodes = new Set([
        "USER_ALREADY_EXISTS",
        "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
      ]);

      if (!existingUserCodes.has(signUpResult.error.code ?? "")) {
        toast.error(signUpResult.error.message ?? "Unable to continue");
        return;
      }

      const signInResult = await signIn.email({
        email: trimmedEmail,
        password,
        callbackURL,
      });

      if (signInResult.error) {
        toast.error(signInResult.error.message ?? "Invalid email or password");
        return;
      }

      router.push("/home");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);

    try {
      await signIn.social({
        provider: "google",
        callbackURL: getCallbackURL(),
      });
    } catch {
      toast.error("Unable to start Google sign-in");
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Continue with Google or your email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailContinue}>
            <FieldGroup>
              <Field>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  disabled={isGoogleLoading || isLoading}
                  onClick={handleGoogleSignIn}
                >
                  {isGoogleLoading ? <Spinner className="size-4" /> : null}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with email
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={12}
                  required
                />
              </Field>
              <Field>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Spinner className="size-4" /> : null}
                  Continue
                </Button>
                <FieldDescription className="text-center">
                  New here? Enter your email and password to create an account automatically.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <span className="underline">Terms of Service</span> and{" "}
        <span className="underline">Privacy Policy</span>.
      </FieldDescription>
    </div>
  );
}
