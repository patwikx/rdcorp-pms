"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/auth-actions/auth-actions";

// A small component to manage the submit button's state,
// showing a loading indicator when the form is being processed.
function SignOutSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="ghost" type="submit" aria-disabled={pending}>
       <LogOut className="mr-2 h-4 w-4" />
      {pending ? "Signing Out..." : "Sign Out"}
    </Button>
  );
}


export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SignOutSubmitButton />
    </form>
  );
}
