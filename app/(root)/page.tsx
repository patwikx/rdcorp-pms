// app/(root)/page.tsx
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function RootPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/sign-in');
  }
  
  const assignments = session.user.assignments;
  
  if (assignments && assignments.length > 0) {
    // User has business unit assignments, redirect to first one
    const firstBusinessUnitId = assignments[0].businessUnitId;
    redirect(`/${firstBusinessUnitId}/dashboard`);
  } else {
    // User has no assignments, send to setup
    redirect('/setup');
  }
}