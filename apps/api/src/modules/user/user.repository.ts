import { ActivityType, EntityType, Prisma, Role, User } from '@prisma/client';

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

export interface UserMutationBoundary {
  id: string;
  organizationId: string;
  expectedRole: Role;
}

export interface UserProfileUpdateInput {
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
}

export interface UserRoleChangeInput extends UserMutationBoundary {
  actorId: string;
  role: Role;
}



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







  async updateProfile(
    boundary: UserMutationBoundary,
    data: UserProfileUpdateInput,
  ) {
    return prisma.user.update({
      where: {
        id: boundary.id,
        organizationId: boundary.organizationId,
        role: boundary.expectedRole,
        deletedAt: null,
      },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
      },
      select: userSafeSelect,
    });
  }

  async updateStatus(
    boundary: UserMutationBoundary,
    isActive: boolean,
  ) {
    return prisma.user.update({
      where: {
        id: boundary.id,
        organizationId: boundary.organizationId,
        role: boundary.expectedRole,
        deletedAt: null,
      },
      data: { isActive },
      select: userSafeSelect,
    });
  }

  async updateRole(input: UserRoleChangeInput) {
    return prisma.$transaction(async (transaction) => {
      const updatedUser = await transaction.user.update({
        where: {
          id: input.id,
          organizationId: input.organizationId,
          role: input.expectedRole,
          deletedAt: null,
        },
        data: { role: input.role },
        select: userSafeSelect,
      });

      await transaction.activityLog.create({
        data: {
          organizationId: input.organizationId,
          userId: input.actorId,
          type: ActivityType.UPDATE,
          entityType: EntityType.USER,
          entityId: input.id,
          metadata: {
            previousRole: input.expectedRole,
            newRole: input.role,
          },
        },
      });

      return updatedUser;
    });
  }







  async softDelete(
    boundary: UserMutationBoundary,
  ) {


    return prisma.user.update({

      where: {

        id: boundary.id,

        organizationId: boundary.organizationId,

        role: boundary.expectedRole,

        deletedAt: null,

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
