import * as mock from '@/lib/mock/server';
import type { SplitLine } from '@/types';

export const fulfillmentService = {
  list: () => mock.listFulfillment(),
  get: (id: string) => mock.getFulfillment(id),
  listStock: () => mock.listStock(),
  acceptSplit: (id: string) => mock.acceptSplit(id),
  overrideSplit: (id: string, split: SplitLine[]) => mock.overrideSplit(id, split),
};
