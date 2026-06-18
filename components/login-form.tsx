"use client";

import Link from "next/link";
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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
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

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in with your email and password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailContinue}>
            <FieldGroup>
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
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  id="password"
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
