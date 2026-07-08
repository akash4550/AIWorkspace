import { Router } from 'express';
import { TeamController } from './team.controller';
import { requireAuth } from '../../core/middlewares/authMiddleware';
import { requireRole } from '../../core/middlewares/rbacMiddleware';
import { validateRequest } from '../../core/middlewares/validateRequest';
import { createTeamSchema, updateTeamSchema, inviteMemberSchema, updateMembershipSchema } from './team.validator';
import { asyncWrapper } from '../../core/utils/asyncWrapper';

const router = Router();
const controller = new TeamController();

router.use(requireAuth);

router.get('/my-teams', asyncWrapper(controller.getMyTeams));
router.get('/', asyncWrapper(controller.getTeams));
router.get('/:id', asyncWrapper(controller.getTeamById));

// Only admins and managers can create teams organization-wide
router.post(
    '/',
    requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    validateRequest(createTeamSchema),
    asyncWrapper(controller.createTeam)
);

// Updates to core info (Requires team owner/lead logic in a real app, here we just use org roles for simplicity)
router.patch(
    '/:id',
    requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    validateRequest(updateTeamSchema),
    asyncWrapper(controller.updateTeam)
);

router.delete(
    '/:id',
    requireRole('SUPER_ADMIN', 'ADMIN'),
    asyncWrapper(controller.deleteTeam)
);

// Memberships
router.get('/:id/members', asyncWrapper(controller.getMembers));

router.patch(
    '/:id/members/:userId',
    requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    validateRequest(updateMembershipSchema),
    asyncWrapper(controller.updateMembership)
);

router.delete(
    '/:id/members/:userId',
    requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    asyncWrapper(controller.removeMember)
);

// Invitations
router.get('/:id/invitations', asyncWrapper(controller.getInvitations));

router.post(
    '/:id/invitations',
    requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    validateRequest(inviteMemberSchema),
    asyncWrapper(controller.inviteMember)
);

export default router;
