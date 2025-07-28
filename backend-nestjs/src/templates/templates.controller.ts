import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { SlideTemplate } from '../entities/slide-template.entity';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available slide templates' })
  @ApiResponse({ status: 200, description: 'List of templates', type: [SlideTemplate] })
  findAll(): Promise<SlideTemplate[]> {
    return this.templatesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific template by ID' })
  @ApiResponse({ status: 200, description: 'Template details', type: SlideTemplate })
  findOne(@Param('id') id: string): Promise<SlideTemplate> {
    return this.templatesService.findOne(id);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get templates by category' })
  @ApiResponse({ status: 200, description: 'Templates in category', type: [SlideTemplate] })
  findByCategory(@Param('category') category: string): Promise<SlideTemplate[]> {
    return this.templatesService.findByCategory(category);
  }
}
