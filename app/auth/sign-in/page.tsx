// app/auth/sign-in/page.tsx
import React, { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";


export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          {/* lightweight fallback while client component hydrates */}
          <div className="animate-pulse text-center text-sm text-muted-foreground">
            Loading…
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
