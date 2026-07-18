import { Request, Response } from 'express';

import { UserService } from './user.service';

import { asyncWrapper } from '../../core/utils/asyncWrapper';



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







  updateUser = asyncWrapper(

    async (
      req: Request,
      res: Response
    ) => {


      const organizationId =
        req.user!.organizationId;



      const userId =
        String(req.params.id);



      const user =
        await this.service.updateUser(

          organizationId,

          userId,

          req.body

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


      const organizationId =
        req.user!.organizationId;



      const userId =
        String(req.params.id);



      const user =
        await this.service.updateUserStatus(

          organizationId,

          userId,

          req.body.isActive

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


      const organizationId =
        req.user!.organizationId;



      const userId =
        String(req.params.id);



      await this.service.deleteUser(

        organizationId,

        userId

      );



      res.status(200).json({

        success: true,

        message:
          'User deleted successfully',

      });

    }

  );

}