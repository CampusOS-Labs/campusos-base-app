"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { requestPasswordReset } from "@/lib/auth-client";
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
import { Spinner } from "@/components/ui/spinner";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!isValidEmail(trimmedEmail)) {
      toast.error("Enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const redirectTo =
        typeof window === "undefined"
          ? "/reset-password"
          : `${window.location.origin}/reset-password`;

      const result = await requestPasswordReset({
        email: trimmedEmail,
        redirectTo,
      });

      if (result.error) {
        toast.error(result.error.message ?? "Unable to send reset email");
        return;
      }

      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Forgot password</CardTitle>
          <CardDescription>
            {submitted
              ? "Check your inbox for a reset link."
              : "Enter your email and we will send you a reset link."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <FieldGroup>
              <FieldDescription className="text-center">
                If an account exists for {email.trim().toLowerCase()}, you will receive an email
                with instructions to reset your password.
              </FieldDescription>
              <Field>
                <Button render={<Link href="/login" />} className="w-full" nativeButton={false}>
                  Back to sign in
                </Button>
              </Field>
            </FieldGroup>
          ) : (
            <form onSubmit={handleSubmit}>
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
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Spinner className="size-4" /> : null}
                    Send reset link
                  </Button>
                  <FieldDescription className="text-center">
                    <Link href="/login" className="underline underline-offset-4">
                      Back to sign in
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
