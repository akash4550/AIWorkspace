import { ProjectRepository } from './project.repository';

import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectQueryDto,
} from './project.dto';

import { AppError } from '../../core/errors/AppError';

import { ProjectStatus } from '@prisma/client';



export class ProjectService {


  private repository: ProjectRepository;



  constructor(){

    this.repository =
      new ProjectRepository();

  }







  async getProjects(
    organizationId:string,
    query:ProjectQueryDto
  ){

    return this.repository.findMany(

      organizationId,

      query

    );

  }







  async getProjectById(
    organizationId:string,
    projectId:string
  ){


    const project =
      await this.repository.findById(

        organizationId,

        projectId

      );



    if(!project){

      throw new AppError(

        'Project not found',

        404

      );

    }



    return project;

  }







  async createProject(
    organizationId:string,
    ownerId:string,
    data:CreateProjectDto
  ){


    const existing =
      await this.repository.findByKey(

        organizationId,

        data.key.toUpperCase()

      );



    if(existing){

      throw new AppError(

        'Project key already exists',

        400

      );

    }



    return this.repository.create(

      organizationId,

      {

        ...data,

        ownerId,

      }

    );

  }







  async updateProject(
    organizationId:string,
    projectId:string,
    data:UpdateProjectDto
  ){


    const project =
      await this.repository.update(

        organizationId,

        projectId,

        data

      );



    if(!project){

      throw new AppError(

        'Project not found',

        404

      );

    }



    return project;

  }







  async archiveProject(
    organizationId:string,
    projectId:string
  ){


    const project =
      await this.repository.updateStatus(

        organizationId,

        projectId,

        ProjectStatus.ARCHIVED

      );



    if(!project){

      throw new AppError(

        'Project not found',

        404

      );

    }



    return project;

  }







  async restoreProject(
    organizationId:string,
    projectId:string
  ){


    const project =
      await this.repository.updateStatus(

        organizationId,

        projectId,

        ProjectStatus.PLANNING

      );



    if(!project){

      throw new AppError(

        'Project not found',

        404

      );

    }



    return project;

  }







  async deleteProject(
    organizationId:string,
    projectId:string
  ){


    const project =
      await this.repository.softDelete(

        organizationId,

        projectId

      );



    if(!project){

      throw new AppError(

        'Project not found',

        404

      );

    }



    return project;

  }


}