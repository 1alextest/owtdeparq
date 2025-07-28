import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VersionsService } from './versions.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';

@ApiTags('Versions')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('versions')
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Get('deck/:deckId')
  @ApiOperation({ summary: 'Get version history for a deck' })
  @ApiResponse({ status: 200, description: 'Version history' })
  getDeckVersions(
    @Param('deckId') deckId: string,
    @User() user: AuthenticatedUser,
  ) {
    return this.versionsService.getDeckVersions(deckId, user.uid);
  }

  @Post('deck/:deckId/create')
  @ApiOperation({ summary: 'Create a new version snapshot' })
  @ApiResponse({ status: 201, description: 'Version created' })
  createVersion(
    @Param('deckId') deckId: string,
    @Body() versionData: { description?: string; changeSummary?: string },
    @User() user: AuthenticatedUser,
  ) {
    return this.versionsService.createVersion(deckId, versionData, user.uid);
  }

  @Post('deck/:deckId/restore/:versionId')
  @ApiOperation({ summary: 'Restore deck to a previous version' })
  @ApiResponse({ status: 200, description: 'Deck restored' })
  restoreVersion(
    @Param('deckId') deckId: string,
    @Param('versionId') versionId: string,
    @User() user: AuthenticatedUser,
  ) {
    return this.versionsService.restoreVersion(deckId, versionId, user.uid);
  }
}
