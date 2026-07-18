import { z } from 'zod';

import { TeamRole } from '@prisma/client';



export const createTeamSchema = z.object({

  body: z.object({


    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100),


    description:
      z.string()
      .max(500)
      .optional()
      .nullable(),


    color:
      z.string()
      .regex(
        /^#[0-9A-Fa-f]{6}$/,
        'Must be a valid hex color'
      )
      .optional(),


    icon:
      z.string()
      .optional(),

  }),

});







export const updateTeamSchema = z.object({

  params: z.object({

    id: z
      .string()
      .uuid('Invalid team id'),

  }),



  body: z.object({


    name:
      z.string()
      .min(2)
      .max(100)
      .optional(),



    description:
      z.string()
      .max(500)
      .optional()
      .nullable(),



    color:
      z.string()
      .regex(
        /^#[0-9A-Fa-f]{6}$/
      )
      .optional()
      .nullable(),



    icon:
      z.string()
      .optional()
      .nullable(),


  }),

});







export const getTeamSchema = z.object({

  params: z.object({

    id: z
      .string()
      .uuid('Invalid team id'),

  }),

});







export const deleteTeamSchema = z.object({

  params: z.object({

    id: z
      .string()
      .uuid('Invalid team id'),

  }),

});







export const listTeamsSchema = z.object({

  query: z.object({


    page:
      z.coerce
      .number()
      .int()
      .positive()
      .default(1),



    limit:
      z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(20),



    search:
      z.string()
      .optional(),



    ownerId:
      z.string()
      .uuid()
      .optional(),



    sortBy:
      z.enum([
        'name',
        'createdAt',
        'updatedAt',
      ])
      .optional(),



    sortOrder:
      z.enum([
        'asc',
        'desc',
      ])
      .optional(),


  }),

});







export const inviteMemberSchema = z.object({

  params: z.object({

    id: z
      .string()
      .uuid('Invalid team id'),

  }),



  body: z.object({

    email:
      z.string()
      .email('Invalid email address'),

  }),

});







export const updateMembershipSchema = z.object({

  params: z.object({

    id: z
      .string()
      .uuid('Invalid team id'),


    userId: z
      .string()
      .uuid('Invalid user id'),

  }),



  body: z.object({

    role:
      z.nativeEnum(TeamRole),

  }),

});