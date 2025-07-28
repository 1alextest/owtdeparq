import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiProviderService } from './ai-provider.service';
import { UpdateAiSettingsDto } from './dto/update-ai-settings.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { UserAiSettings } from '../entities/user-ai-settings.entity';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiProviderService: AiProviderService) {}

  @Get('providers')
  @ApiOperation({ summary: 'Get available AI providers and their status' })
  @ApiResponse({ status: 200, description: 'List of AI providers' })
  getAiProviders() {
    return this.aiProviderService.getAvailableProviders();
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get user AI settings' })
  @ApiResponse({ status: 200, description: 'User AI settings', type: UserAiSettings })
  getAiSettings(@User() user: AuthenticatedUser): Promise<UserAiSettings> {
    return this.aiProviderService.getUserSettings(user.uid);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update user AI settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully', type: UserAiSettings })
  updateAiSettings(
    @Body() updateDto: UpdateAiSettingsDto,
    @User() user: AuthenticatedUser,
  ): Promise<UserAiSettings> {
    return this.aiProviderService.updateUserSettings(user.uid, updateDto);
  }
}
