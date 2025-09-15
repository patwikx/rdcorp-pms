import { Role } from '@prisma/client';
import { create } from 'zustand';


// The data shape needed for the modal
export type UserAssignmentData = {
    userId: string;
    username: string | null;
    roleId: string;
}

interface UserManagementModalStore {
  initialData: UserAssignmentData | null;
  isOpen: boolean;
  roles: Role[];
  onOpen: (roles: Role[], data?: UserAssignmentData) => void;
  onClose: () => void;
}

export const useUserManagementModal = create<UserManagementModalStore>((set) => ({
  initialData: null,
  isOpen: false,
  roles: [],
  onOpen: (roles, data) => set({ isOpen: true, roles, initialData: data || null }),
  onClose: () => set({ isOpen: false, initialData: null, roles: [] }),
}));