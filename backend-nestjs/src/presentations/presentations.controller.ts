import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PresentationsService } from './presentations.service';
import { CreatePresentationDto } from './dto/create-presentation.dto';
import { UpdatePresentationDto } from './dto/update-presentation.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { Presentation } from '../entities/presentation.entity';

@ApiTags('presentations')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('api/presentations')
export class PresentationsController {
  constructor(private readonly presentationsService: PresentationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new presentation' })
  @ApiResponse({ status: 201, description: 'Presentation created successfully', type: Presentation })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Access denied to project' })
  async create(
    @Body() createPresentationDto: CreatePresentationDto,
    @Request() req: any,
  ): Promise<Presentation> {
    return await this.presentationsService.create(createPresentationDto, req.user.uid);
  }

  @Get()
  @ApiOperation({ summary: 'Get presentations by project' })
  @ApiResponse({ status: 200, description: 'Presentations retrieved successfully', type: [Presentation] })
  @ApiResponse({ status: 403, description: 'Access denied to project' })
  async findByProject(
    @Query('projectId') projectId: string,
    @Request() req: any,
  ): Promise<Presentation[]> {
    return await this.presentationsService.findAllByProject(projectId, req.user.uid);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a presentation by ID' })
  @ApiResponse({ status: 200, description: 'Presentation retrieved successfully', type: Presentation })
  @ApiResponse({ status: 404, description: 'Presentation not found' })
  @ApiResponse({ status: 403, description: 'Access denied to presentation' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<Presentation> {
    return await this.presentationsService.findOne(id, req.user.uid);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a presentation' })
  @ApiResponse({ status: 200, description: 'Presentation updated successfully', type: Presentation })
  @ApiResponse({ status: 404, description: 'Presentation not found' })
  @ApiResponse({ status: 403, description: 'Access denied to presentation' })
  async update(
    @Param('id') id: string,
    @Body() updatePresentationDto: UpdatePresentationDto,
    @Request() req: any,
  ): Promise<Presentation> {
    return await this.presentationsService.update(id, updatePresentationDto, req.user.uid);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a presentation' })
  @ApiResponse({ status: 200, description: 'Presentation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Presentation not found' })
  @ApiResponse({ status: 403, description: 'Access denied to presentation' })
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.presentationsService.remove(id, req.user.uid);
    return { message: 'Presentation deleted successfully' };
  }
}
