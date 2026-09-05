import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  approveApproval,
  listQueue,
  rejectApproval,
  requestRevisionApproval,
} from './approval.controller.js';
import {
  approveSchema,
  listQueueSchema,
  rejectSchema,
  requestRevisionSchema,
} from './approval.validation.js';

export const approvalRoutes = Router();

// roleaccess.md: only Sales Manager and Finance/Ops approve/reject/return
// quotes. The service further restricts each action to whichever role owns
// the *current* step of that specific approval chain.
const canDecide = authorize('sales_manager', 'finance');

approvalRoutes.use(authenticate);

approvalRoutes.get('/queue', validate(listQueueSchema), asyncHandler(listQueue));
approvalRoutes.post(
  '/:id/approve',
  canDecide,
  validate(approveSchema),
  asyncHandler(approveApproval),
);
approvalRoutes.post('/:id/reject', canDecide, validate(rejectSchema), asyncHandler(rejectApproval));
approvalRoutes.post(
  '/:id/request-revision',
  canDecide,
  validate(requestRevisionSchema),
  asyncHandler(requestRevisionApproval),
);
