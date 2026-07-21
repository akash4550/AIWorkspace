import { Request, Response } from 'express';

import { ProjectService } from './project.service';

import { asyncWrapper } from '../../core/utils/asyncWrapper';



export class ProjectController {


  private service: ProjectService;



  constructor(){

    this.service =
      new ProjectService();

  }







  getProjects = asyncWrapper(

    async(
      req:Request,
      res:Response
    )=>{


      const projects =
        await this.service.getProjects(

          req.user!.organizationId,

          req.query

        );



      res.status(200).json({

        success:true,

        data:projects,

      });

    }

  );








  getProjectById = asyncWrapper(

    async(
      req:Request,
      res:Response
    )=>{


      const id = String(req.params.id);
      const project =
        await this.service.getProjectById(

          req.user!.organizationId,

          id

        );



      res.status(200).json({

        success:true,

        data:project,

      });

    }

  );








  createProject = asyncWrapper(

    async(
      req:Request,
      res:Response
    )=>{


      const project =
        await this.service.createProject(

          req.user!.organizationId,

          req.user!.id,

          req.body

        );



      res.status(201).json({

        success:true,

        data:project,

      });

    }

  );








  updateProject = asyncWrapper(

    async(
      req:Request,
      res:Response
    )=>{


      const id = String(req.params.id);
      const project =
        await this.service.updateProject(

          req.user!.organizationId,

          id,

          req.body

        );



      res.status(200).json({

        success:true,

        data:project,

      });

    }

  );








  archiveProject = asyncWrapper(

    async(
      req:Request,
      res:Response
    )=>{


      const id = String(req.params.id);
      const project =
        await this.service.archiveProject(

          req.user!.organizationId,

          id

        );



      res.status(200).json({

        success:true,

        data:project,

      });

    }

  );








  restoreProject = asyncWrapper(

    async(
      req:Request,
      res:Response
    )=>{


      const id = String(req.params.id);
      const project =
        await this.service.restoreProject(

          req.user!.organizationId,

          id

        );



      res.status(200).json({

        success:true,

        data:project,

      });

    }

  );








  deleteProject = asyncWrapper(

    async(
      req:Request,
      res:Response
    )=>{


      const id = String(req.params.id);
      await this.service.deleteProject(

        req.user!.organizationId,

        id

      );



      res.status(200).json({

        success:true,

        message:
          'Project deleted successfully',

      });

    }

  );

}