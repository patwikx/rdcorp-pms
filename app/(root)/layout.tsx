// app/(root)/layout.tsx (Corrected and Secured)

import { redirect } from 'next/navigation';
import { auth } from '@/auth';

// We assume this modal is designed to be open by default or controlled by a hook
import { BusinessUnitModal } from '@/components/modals/business-unit-modal';

// This layout no longer needs `params` as it handles the root `/` path
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get the session, which includes the user's assignments
  const session = await auth();

  // 2. If there's no user session, they shouldn't be here. Send to sign-in.
  if (!session?.user) {
    redirect('/auth/sign-in');
  }

  // 3. The user's assignments are already in the session object. No need for another database call.
  const assignments = session.user.assignments;

  // 4. Check if the user has any business unit assignments.
  if (assignments && assignments.length > 0) {
    // --- Scenario 1: User has assignments ---
    // Redirect them to the dashboard of their first assigned business unit.
    const firstBusinessUnitId = assignments[0].businessUnitId;
    redirect(`/${firstBusinessUnitId}`);
  }

  // --- Scenario 2: User has NO assignments ---
  // If the code reaches here, it means the user is logged in but unassigned.
  // We render the page, which will trigger the modal to force them to create a unit.
  return (
    <>
      <BusinessUnitModal />
      {children}
    </>
  );
}