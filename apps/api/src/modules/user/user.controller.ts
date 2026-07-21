import { Request, Response } from 'express';

import { UserService } from './user.service';

import { asyncWrapper } from '../../core/utils/asyncWrapper';
import { getValidatedRequest } from '../../core/middlewares/validateRequest';
import {
  DeleteUserRequest,
  UpdateOwnProfileRequest,
  UpdateUserRequest,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
} from './user.validator';



export class UserController {


  private service: UserService;


  constructor() {

    this.service = new UserService();

  }




  getUsers = asyncWrapper(

    async (
      req: Request,
      res: Response
    ) => {


      const organizationId =
        req.user!.organizationId;



      const result =
        await this.service.getUsers(

          organizationId,

          req.query

        );



      res.status(200).json({

        success: true,

        data: result,

      });

    }

  );







  getUserById = asyncWrapper(

    async (
      req: Request,
      res: Response
    ) => {


      const organizationId =
        req.user!.organizationId;


      const userId =
        String(req.params.id);



      const user =
        await this.service.getUserById(

          organizationId,

          userId

        );



      res.status(200).json({

        success: true,

        data: user,

      });

    }

  );







  createUser = asyncWrapper(

    async (
      req: Request,
      res: Response
    ) => {


      const organizationId =
        req.user!.organizationId;



      const user =
        await this.service.createUser(

          organizationId,

          req.body

        );



      res.status(201).json({

        success: true,

        data: user,

      });

    }

  );







  updateOwnProfile = asyncWrapper(

    async (
      req: Request,
      res: Response
    ) => {


      const { body } =
        getValidatedRequest<UpdateOwnProfileRequest>(req);



      const user =
        await this.service.updateOwnProfile(

          req.user!,

          body

        );



      res.status(200).json({

        success: true,

        data: user,

      });

    }

  );







  updateUser = asyncWrapper(

    async (
      req: Request,
      res: Response
    ) => {


      const { params, body } =
        getValidatedRequest<UpdateUserRequest>(req);



      const user =
        await this.service.updateUserProfile(

          req.user!,

          params.id,

          body

        );



      res.status(200).json({

        success: true,

        data: user,

      });

    }

  );







  updateUserRole = asyncWrapper(

    async (
      req: Request,
      res: Response
    ) => {


      const { params, body } =
        getValidatedRequest<UpdateUserRoleRequest>(req);



      const user =
        await this.service.updateUserRole(

          req.user!,

          params.id,

          body

        );



      res.status(200).json({

        success: true,

        data: user,

      });

    }

  );







  updateUserStatus = asyncWrapper(

    async (
      req: Request,
      res: Response
    ) => {


      const { params, body } =
        getValidatedRequest<UpdateUserStatusRequest>(req);



      const user =
        await this.service.updateUserStatus(

          req.user!,

          params.id,

          body

        );



      res.status(200).json({

        success: true,

        data: user,

      });

    }

  );







  deleteUser = asyncWrapper(

    async (
      req: Request,
      res: Response
    ) => {


      const { params } =
        getValidatedRequest<DeleteUserRequest>(req);



      await this.service.deleteUser(

        req.user!,

        params.id

      );



      res.status(200).json({

        success: true,

        message:
          'User deleted successfully',

      });

    }

  );

}
