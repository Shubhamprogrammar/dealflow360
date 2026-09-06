import { api } from '@/lib/api/apiClient';
import type { Role } from '@/types';
import { mapRole, reverseRole } from '@/lib/mapper/mappers';

export interface UserView {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  team?: string;
  isActive: boolean;
  createdAt: string;
}

export const userService = {
  list: async (): Promise<UserView[]> => {
    const res = await api.get<any[]>('/users');
    return res.data.map((u: any) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: mapRole(u.role),
      team: u.team,
      isActive: u.isActive,
      createdAt: u.createdAt,
    }));
  },
  create: async (input: any): Promise<UserView> => {
    const res = await api.post<any>('/users', {
      ...input,
      role: reverseRole(input.role),
    });
    return {
      id: res.data.id,
      firstName: res.data.firstName,
      lastName: res.data.lastName,
      email: res.data.email,
      role: mapRole(res.data.role),
      team: res.data.team,
      isActive: res.data.isActive,
      createdAt: res.data.createdAt,
    };
  }
};
