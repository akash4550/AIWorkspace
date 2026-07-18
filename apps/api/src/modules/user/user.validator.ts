import { z } from 'zod';
import { Role } from '@prisma/client';


export const createUserSchema = z.object({

  body: z.object({

    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50),

    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50),

    email: z
      .string()
      .email('Invalid email format')
      .toLowerCase(),

    role: z
      .nativeEnum(Role)
      .optional()
      .default(Role.EMPLOYEE),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .optional(),

  }),
});



export const updateUserSchema = z.object({

  params: z.object({

    id: z
      .string()
      .uuid('Invalid user id'),

  }),


  body: z.object({

    firstName: z
      .string()
      .min(2)
      .max(50)
      .optional(),


    lastName: z
      .string()
      .min(2)
      .max(50)
      .optional(),


    role: z
      .nativeEnum(Role)
      .optional(),


    avatar: z
      .string()
      .url()
      .nullable()
      .optional(),

  }),
});



export const updateUserStatusSchema = z.object({

  params: z.object({

    id: z
      .string()
      .uuid('Invalid user id'),

  }),


  body: z.object({

    isActive: z.boolean(),

  }),
});



export const getUserSchema = z.object({

  params: z.object({

    id: z
      .string()
      .uuid('Invalid user id'),

  }),
});



export const listUsersSchema = z.object({

  query: z.object({

    page: z
      .coerce
      .number()
      .int()
      .positive()
      .default(1),


    limit: z
      .coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(20),


    search: z
      .string()
      .optional(),


    role: z
      .nativeEnum(Role)
      .optional(),

  }),

});