import { Prisma, User } from '@prisma/client';

import { prisma } from '../../config/prisma';


const userSafeSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  avatar: true,
  organizationId: true,
  isActive: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;



export class UserRepository {


  async findMany(
    organizationId: string,
    options?: {
      skip?: number;
      take?: number;
      search?: string;
      role?: User['role'];
    }
  ) {


    const where: Prisma.UserWhereInput = {

      organizationId,

      deletedAt: null,


      ...(options?.search && {

        OR: [

          {
            firstName: {
              contains: options.search,
              mode: 'insensitive',
            },
          },

          {
            lastName: {
              contains: options.search,
              mode: 'insensitive',
            },
          },

          {
            email: {
              contains: options.search,
              mode: 'insensitive',
            },
          },

        ],

      }),



      ...(options?.role && {

        role: options.role,

      }),

    };



    const [users, total] =
      await prisma.$transaction([


        prisma.user.findMany({

          where,

          skip: options?.skip,

          take: options?.take,


          select: userSafeSelect,


          orderBy: {

            createdAt: 'desc',

          },

        }),



        prisma.user.count({

          where,

        }),


      ]);



    return {

      users,

      total,

    };

  }






  async findById(
    id: string,
    organizationId: string
  ) {


    return prisma.user.findFirst({

      where: {

        id,

        organizationId,

        deletedAt: null,

      },


      select: userSafeSelect,

    });

  }







  async findByEmail(
    email: string,
    organizationId: string
  ) {


    return prisma.user.findFirst({

      where: {

        email,

        organizationId,

        deletedAt: null,

      },


      select: {

        ...userSafeSelect,

        password: true,

      },

    });

  }







  async findByEmailGlobal(
    email: string
  ) {


    return prisma.user.findFirst({

      where: {

        email,

        deletedAt: null,

      },


      select: {

        ...userSafeSelect,

        password: true,

      },

    });

  }







  async create(
    data: Prisma.UserCreateInput
  ) {


    return prisma.user.create({

      data,


      select: userSafeSelect,

    });

  }







  async update(
    id: string,
    organizationId: string,
    data: Prisma.UserUpdateInput
  ) {


    return prisma.user.update({

      where: {

        id,

        organizationId,

      },


      data,


      select: userSafeSelect,

    });

  }







  async softDelete(
    id: string,
    organizationId: string
  ) {


    return prisma.user.update({

      where: {

        id,

        organizationId,

      },


      data: {

        isActive: false,

        deletedAt: new Date(),

      },


      select: userSafeSelect,

    });

  }







  async exists(
    id: string,
    organizationId: string
  ) {


    const user =
      await prisma.user.findFirst({

        where: {

          id,

          organizationId,

          deletedAt: null,

        },


        select: {

          id: true,

        },

      });



    return Boolean(user);

  }

}