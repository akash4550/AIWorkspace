import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';



const uuidSchema =
  z.string().uuid('Invalid id');





export const createProjectSchema = z.object({

  body:z.object({


    name:
      z.string()
      .min(2,'Name must be at least 2 characters')
      .max(100),



    key:
      z.string()
      .min(2)
      .max(10)
      .regex(
        /^[A-Z0-9]+$/,
        'Key can only contain uppercase letters and numbers'
      ),



    description:
      z.string()
      .max(1000)
      .optional()
      .nullable(),



    status:
      z.nativeEnum(ProjectStatus)
      .optional(),



    color:
      z.string()
      .regex(
        /^#[0-9A-Fa-f]{6}$/,
        'Invalid hex color'
      )
      .optional()
      .nullable(),



    icon:
      z.string()
      .optional()
      .nullable(),



    startDate:
      z.string()
      .datetime()
      .optional()
      .nullable()
      .transform(
        value => value ? new Date(value) : null
      ),



    endDate:
      z.string()
      .datetime()
      .optional()
      .nullable()
      .transform(
        value => value ? new Date(value) : null
      ),


  })

});








export const updateProjectSchema = z.object({

  params:z.object({

    id:uuidSchema

  }),



  body:z.object({


    name:
      z.string()
      .min(2)
      .max(100)
      .optional(),



    description:
      z.string()
      .max(1000)
      .optional()
      .nullable(),



    status:
      z.nativeEnum(ProjectStatus)
      .optional(),



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



    startDate:
      z.string()
      .datetime()
      .optional()
      .nullable()
      .transform(
        value => value ? new Date(value) : null
      ),



    endDate:
      z.string()
      .datetime()
      .optional()
      .nullable()
      .transform(
        value => value ? new Date(value) : null
      ),


  })

});








export const getProjectSchema = z.object({

  params:z.object({

    id:uuidSchema

  })

});








export const deleteProjectSchema = z.object({

  params:z.object({

    id:uuidSchema

  })

});








export const projectListSchema = z.object({

  query:z.object({


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



    status:
      z.nativeEnum(ProjectStatus)
      .optional(),



    ownerId:
      uuidSchema
      .optional(),



    isArchived:
      z.coerce
      .boolean()
      .optional(),



    sortBy:
      z.enum([
        'name',
        'createdAt',
        'updatedAt',
        'endDate'
      ])
      .optional(),



    sortOrder:
      z.enum([
        'asc',
        'desc'
      ])
      .optional(),


  })

});