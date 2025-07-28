import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SlidesService } from './slides.service';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto, ReorderSlidesDto } from './dto/update-slide.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { Slide } from '../entities/slide.entity';

@ApiTags('Slides')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('slides')
export class SlidesController {
  constructor(private readonly slidesService: SlidesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new slide' })
  @ApiResponse({ status: 201, description: 'Slide created successfully', type: Slide })
  create(
    @Body() createSlideDto: CreateSlideDto,
    @User() user: AuthenticatedUser,
  ): Promise<Slide> {
    return this.slidesService.create(createSlideDto, user.uid);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific slide by ID' })
  @ApiResponse({ status: 200, description: 'Slide details', type: Slide })
  findOne(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<Slide> {
    return this.slidesService.findOne(id, user.uid);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a slide' })
  @ApiResponse({ status: 200, description: 'Slide updated successfully', type: Slide })
  update(
    @Param('id') id: string,
    @Body() updateSlideDto: UpdateSlideDto,
    @User() user: AuthenticatedUser,
  ): Promise<Slide> {
    return this.slidesService.update(id, updateSlideDto, user.uid);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder slides in a deck' })
  @ApiResponse({ status: 200, description: 'Slides reordered successfully' })
  reorderSlides(
    @Body() reorderDto: ReorderSlidesDto,
    @User() user: AuthenticatedUser,
  ): Promise<void> {
    return this.slidesService.reorderSlides(reorderDto.slideIds, user.uid);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a slide' })
  @ApiResponse({ status: 200, description: 'Slide deleted successfully' })
  remove(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<void> {
    return this.slidesService.remove(id, user.uid);
  }
}
