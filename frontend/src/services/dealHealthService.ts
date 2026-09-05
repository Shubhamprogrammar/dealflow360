import * as mock from '@/lib/mock/server';

export const dealHealthService = {
  listAlerts: () => mock.listHealthAlerts(),
};
