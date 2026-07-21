import bcrypt from 'bcrypt';

import { Role } from '@prisma/client';

import { UserRepository } from './user.repository';

import {
  CreateUserDto,
  UserProfileUpdateDto,
  UserQueryDto,
  UserRoleUpdateDto,
  UserStatusUpdateDto,
  UserUpdateActor,
} from './user.dto';

import { AppError } from '../../core/errors/AppError';

const ROLE_RANK: Record<Role, number> = {
  [Role.EMPLOYEE]: 0,
  [Role.MANAGER]: 1,
  [Role.ADMIN]: 2,
  [Role.SUPER_ADMIN]: 3,
};



export class UserService {


  private repository: UserRepository;



  constructor() {

    this.repository = new UserRepository();

  }

  private assertAdministrativeActor(actor: UserUpdateActor): void {
    if (ROLE_RANK[actor.role] < ROLE_RANK[Role.ADMIN]) {
      throw new AppError('Forbidden - Insufficient permissions', 403);
    }
  }

  private async getAdministrativeTarget(
    actor: UserUpdateActor,
    userId: string,
  ) {
    this.assertAdministrativeActor(actor);
    const target = await this.repository.findById(userId, actor.organizationId);

    if (!target) {
      throw new AppError('User not found', 404);
    }

    if (ROLE_RANK[target.role] > ROLE_RANK[actor.role]) {
      throw new AppError('Forbidden - role hierarchy violation', 403);
    }

    return target;
  }






  async getUsers(
    organizationId: string,
    query: UserQueryDto
  ) {


    const page = query.page ?? 1;

    const limit = query.limit ?? 20;



    const result =
      await this.repository.findMany(

        organizationId,

        {

          skip: (page - 1) * limit,

          take: limit,

          search: query.search,

          role: query.role,

        }

      );



    return {

      users: result.users,


      pagination: {

        page,

        limit,

        total: result.total,

        totalPages: Math.ceil(
          result.total / limit
        ),

      },

    };

  }








  async getUserById(
    organizationId: string,
    userId: string
  ) {


    const user =
      await this.repository.findById(

        userId,

        organizationId

      );



    if (!user) {

      throw new AppError(
        'User not found',
        404
      );

    }



    return user;

  }








  async createUser(
    organizationId: string,
    data: CreateUserDto
  ) {


    const existing =
      await this.repository.findByEmail(

        data.email,

        organizationId

      );



    if (existing) {

      throw new AppError(

        'User with this email already exists',

        400

      );

    }



    if (data.role === Role.SUPER_ADMIN) {

      throw new AppError(

        'Cannot create SUPER_ADMIN user',

        403

      );

    }



    if (!data.password) {

      throw new AppError(

        'Password is required',

        400

      );

    }




    const password =
      await bcrypt.hash(

        data.password,

        12

      );





    return this.repository.create({

      email: data.email.toLowerCase(),


      password,


      firstName: data.firstName,


      lastName: data.lastName,


      role:
        data.role ?? Role.EMPLOYEE,



      organization: {

        connect: {

          id: organizationId,

        },

      },

    });

  }









  async updateOwnProfile(
    actor: UserUpdateActor,
    data: UserProfileUpdateDto,
  ) {


    const target = await this.repository.findById(
      actor.id,
      actor.organizationId,
    );



    if (!target) {

      throw new AppError(

        'User not found',

        404

      );

    }



    return this.repository.updateProfile({
      id: target.id,
      organizationId: actor.organizationId,
      expectedRole: target.role,
    }, data);

  }









  async updateUserProfile(
    actor: UserUpdateActor,
    userId: string,
    data: UserProfileUpdateDto,
  ) {
    const target = await this.getAdministrativeTarget(actor, userId);

    return this.repository.updateProfile({
      id: target.id,
      organizationId: actor.organizationId,
      expectedRole: target.role,
    }, data);
  }

  async updateUserRole(
    actor: UserUpdateActor,
    userId: string,
    data: UserRoleUpdateDto,
  ) {
    this.assertAdministrativeActor(actor);
    if (actor.id === userId) {
      throw new AppError('Users cannot change their own role', 403);
    }

    const target = await this.getAdministrativeTarget(actor, userId);
    if (ROLE_RANK[data.role] > ROLE_RANK[actor.role]) {
      throw new AppError('Forbidden - role hierarchy violation', 403);
    }

    if (target.role === data.role) {
      return target;
    }

    return this.repository.updateRole({
      id: target.id,
      organizationId: actor.organizationId,
      expectedRole: target.role,
      actorId: actor.id,
      role: data.role,
    });
  }

  async updateUserStatus(
    actor: UserUpdateActor,
    userId: string,
    data: UserStatusUpdateDto,
  ) {


    this.assertAdministrativeActor(actor);

    if (actor.id === userId) {
      throw new AppError(
        'Administrators cannot change their own status',
        403,
      );
    }

    const target = await this.getAdministrativeTarget(actor, userId);

    return this.repository.updateStatus({
      id: target.id,
      organizationId: actor.organizationId,
      expectedRole: target.role,
    }, data.isActive);

  }









  async deleteUser(
    actor: UserUpdateActor,
    userId: string
  ) {


    this.assertAdministrativeActor(actor);

    if (actor.id === userId) {
      throw new AppError(
        'Administrators cannot delete themselves',
        403,
      );
    }



    const target = await this.getAdministrativeTarget(actor, userId);



    return this.repository.softDelete({
      id: target.id,
      organizationId: actor.organizationId,
      expectedRole: target.role,
    });

  }

}
