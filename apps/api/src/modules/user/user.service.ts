import bcrypt from 'bcrypt';

import { Role } from '@prisma/client';

import { UserRepository } from './user.repository';

import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
} from './user.dto';

import { AppError } from '../../core/errors/AppError';



export class UserService {


  private repository: UserRepository;



  constructor() {

    this.repository = new UserRepository();

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









  async updateUser(
    organizationId: string,
    userId: string,
    data: UpdateUserDto
  ) {


    const exists =
      await this.repository.exists(

        userId,

        organizationId

      );



    if (!exists) {

      throw new AppError(

        'User not found',

        404

      );

    }



    return this.repository.update(

      userId,

      organizationId,

      data

    );

  }









  async updateUserStatus(
    organizationId: string,
    userId: string,
    isActive: boolean
  ) {


    const exists =
      await this.repository.exists(

        userId,

        organizationId

      );



    if (!exists) {

      throw new AppError(

        'User not found',

        404

      );

    }



    return this.repository.update(

      userId,

      organizationId,

      {

        isActive,

      }

    );

  }









  async deleteUser(
    organizationId: string,
    userId: string
  ) {


    const exists =
      await this.repository.exists(

        userId,

        organizationId

      );



    if (!exists) {

      throw new AppError(

        'User not found',

        404

      );

    }



    return this.repository.softDelete(

      userId,

      organizationId

    );

  }

}