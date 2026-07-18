import { Prisma, ProjectStatus } from '@prisma/client';

import { prisma } from '../../config/prisma';

import {
 CreateProjectDto,
 UpdateProjectDto,
 ProjectQueryDto
} from './project.dto';



export class ProjectRepository {



 async findById(
  organizationId:string,
  id:string
 ){

  return prisma.project.findFirst({

   where:{
    id,
    organizationId,
    deletedAt:null
   },


   include:{

    owner:{
     select:{
      id:true,
      firstName:true,
      lastName:true,
      avatar:true
     }
    }

   }

  });

 }







 async findByKey(
  organizationId:string,
  key:string
 ){

  return prisma.project.findFirst({

   where:{
    key,
    organizationId,
    deletedAt:null
   }

  });

 }







 async findMany(
  organizationId:string,
  query:ProjectQueryDto
 ){


  const {

   page=1,

   limit=20,

   search,

   status,

   ownerId,

   isArchived,

   sortBy='createdAt',

   sortOrder='desc'

  } = query;



  const skip=(page-1)*limit;



  const where:Prisma.ProjectWhereInput={

   organizationId,

   deletedAt:null

  };



  if(isArchived){

   where.status=ProjectStatus.ARCHIVED;

  }

  else if(status){

   where.status=status;

  }

  else{

   where.status={
    not:ProjectStatus.ARCHIVED
   };

  }



  if(ownerId){

   where.ownerId=ownerId;

  }



  if(search){

   where.OR=[

    {
     name:{
      contains:search,
      mode:'insensitive'
     }
    },


    {
     key:{
      contains:search,
      mode:'insensitive'
     }
    }

   ];

  }





  const orderBy:Prisma.ProjectOrderByWithRelationInput={

   [sortBy]:sortOrder

  };





  const [projects,total]=
   await prisma.$transaction([


    prisma.project.findMany({

     where,

     skip,

     take:limit,

     orderBy,


     include:{

      owner:{
       select:{
        id:true,
        firstName:true,
        lastName:true,
        avatar:true
       }
      }

     }

    }),



    prisma.project.count({
     where
    })

   ]);





  return {

   projects,

   total

  };


 }







 async create(
  organizationId:string,
  data:CreateProjectDto
 ){


  return prisma.project.create({

   data:{

    organizationId,

    name:data.name,

    key:data.key.toUpperCase(),

    description:data.description,

    status:data.status,

    color:data.color,

    icon:data.icon,

    ownerId:data.ownerId,

    startDate:data.startDate,

    endDate:data.endDate

   }

  });

 }







 async update(
  organizationId:string,
  id:string,
  data:UpdateProjectDto
 ){


  const project=
   await this.findById(
    organizationId,
    id
   );


  if(!project)
    return null;



  return prisma.project.update({

   where:{
    id
   },

   data

  });

 }







 async updateStatus(
  organizationId:string,
  id:string,
  status:ProjectStatus
 ){


  const project=
   await this.findById(
    organizationId,
    id
   );


  if(!project)
    return null;



  return prisma.project.update({

   where:{
    id
   },

   data:{
    status
   }

  });

 }







 async softDelete(
  organizationId:string,
  id:string
 ){


  const project=
   await this.findById(
    organizationId,
    id
   );


  if(!project)
    return null;



  return prisma.project.update({

   where:{
    id
   },

   data:{
    deletedAt:new Date()
   }

  });

 }


}