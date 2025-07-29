import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
  HttpException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { Project } from '../entities/project.entity';
import { PitchDeck } from '../entities/pitch-deck.entity';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully', type: Project })
  create(
    @Body() createProjectDto: CreateProjectDto,
    @User() user: AuthenticatedUser,
  ): Promise<Project> {
    return this.projectsService.create(createProjectDto, user.uid);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of user projects with pagination', schema: {
    type: 'object',
    properties: {
      projects: { type: 'array', items: { $ref: '#/components/schemas/Project' } },
      total: { type: 'number' },
      hasMore: { type: 'boolean' }
    }
  }})
  findAll(
    @User() user: AuthenticatedUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{
    projects: Project[];
    total: number;
    hasMore: boolean;
  }> {
    const limitNum = limit ? Math.min(parseInt(limit), 100) : 50; // Max 100 items
    const offsetNum = offset ? parseInt(offset) : 0;
    return this.projectsService.findAllByUser(user.uid, limitNum, offsetNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific project by ID' })
  @ApiResponse({ status: 200, description: 'Project details', type: Project })
  findOne(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<Project> {
    return this.projectsService.findOne(id, user.uid);
  }

  @Get(':id/decks')
  @ApiOperation({ summary: 'Get all decks in a project' })
  @ApiResponse({ status: 200, description: 'List of project decks', type: [PitchDeck] })
  getProjectDecks(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<PitchDeck[]> {
    return this.projectsService.getProjectDecks(id, user.uid);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully', type: Project })
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @User() user: AuthenticatedUser,
  ): Promise<Project> {
    return this.projectsService.update(id, updateProjectDto, user.uid);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  remove(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<void> {
    return this.projectsService.remove(id, user.uid);
  }
  

}
