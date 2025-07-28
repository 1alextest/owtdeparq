import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContextService } from './context.service';
import { RecordEventDto, UpdateLearningPatternDto } from './dto/record-event.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { RecommendationEngineService } from './learning/recommendation-engine.service';
import { ContextTrackerService } from './learning/context-tracker.service';

@ApiTags('Context & Learning')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('context')
export class ContextController {
  constructor(
    private readonly contextService: ContextService,
    private readonly recommendationEngine: RecommendationEngineService,
    private readonly contextTracker: ContextTrackerService,
  ) {}

  @Post('events')
  @ApiOperation({ summary: 'Record a context memory event' })
  @ApiResponse({ status: 201, description: 'Event recorded successfully' })
  recordEvent(
    @Body() recordDto: RecordEventDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.contextService.recordEvent(recordDto, user.uid);
  }

  @Get('learning-patterns')
  @ApiOperation({ summary: 'Get user learning patterns' })
  @ApiResponse({ status: 200, description: 'Learning patterns retrieved' })
  getLearningPatterns(@User() user: AuthenticatedUser) {
    return this.contextService.getUserLearningPatterns(user.uid);
  }

  @Get('learning-patterns/project/:projectId')
  @ApiOperation({ summary: 'Get learning patterns for a specific project' })
  @ApiResponse({ status: 200, description: 'Project learning patterns' })
  getProjectLearningPatterns(
    @Param('projectId') projectId: string,
    @User() user: AuthenticatedUser,
  ) {
    return this.contextService.getProjectLearningPatterns(projectId, user.uid);
  }

  @Post('learning-patterns/project/:projectId')
  @ApiOperation({ summary: 'Update learning pattern for a project' })
  @ApiResponse({ status: 200, description: 'Learning pattern updated' })
  updateProjectLearningPattern(
    @Param('projectId') projectId: string,
    @Body() updateDto: UpdateLearningPatternDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.contextService.updateProjectLearningPattern(projectId, updateDto, user.uid);
  }

  @Get('context-summary/deck/:deckId')
  @ApiOperation({ summary: 'Get context summary for AI generation' })
  @ApiResponse({ status: 200, description: 'Context summary for deck' })
  getDeckContextSummary(
    @Param('deckId') deckId: string,
    @User() user: AuthenticatedUser,
  ) {
    return this.contextService.getDeckContextSummary(deckId, user.uid);
  }

  @Get('recommendations/slide/:slideId')
  @ApiOperation({ summary: 'Get contextual recommendations for a slide' })
  @ApiResponse({ status: 200, description: 'Contextual recommendations' })
  async getSlideRecommendations(
    @Param('slideId') slideId: string,
    @User() user: AuthenticatedUser,
  ) {
    // This would need to be implemented to get slide and deck context
    // For now, return placeholder
    return { recommendations: [], message: 'Slide recommendations not yet implemented' };
  }

  @Post('track/edit')
  @ApiOperation({ summary: 'Track slide edit for learning' })
  @ApiResponse({ status: 200, description: 'Edit tracked successfully' })
  async trackSlideEdit(
    @Body() editData: {
      projectId: string;
      deckId: string;
      slideId: string;
      before: string;
      after: string;
      editType: string;
      timeSpent: number;
    },
    @User() user: AuthenticatedUser,
  ) {
    await this.contextTracker.trackSlideEdit(
      user.uid,
      editData.projectId,
      editData.deckId,
      editData.slideId,
      {
        before: editData.before,
        after: editData.after,
        editType: editData.editType,
        timeSpent: editData.timeSpent,
      }
    );

    return { success: true, message: 'Edit tracked successfully' };
  }

  @Post('track/feedback')
  @ApiOperation({ summary: 'Track user feedback for learning' })
  @ApiResponse({ status: 200, description: 'Feedback tracked successfully' })
  async trackFeedback(
    @Body() feedbackData: {
      projectId: string;
      deckId: string;
      slideId: string;
      type: 'positive' | 'negative' | 'neutral';
      aspect: string;
      suggestion?: string;
      rating?: number;
    },
    @User() user: AuthenticatedUser,
  ) {
    await this.contextTracker.trackFeedback(
      user.uid,
      feedbackData.projectId,
      feedbackData.deckId,
      feedbackData.slideId,
      {
        type: feedbackData.type,
        aspect: feedbackData.aspect,
        suggestion: feedbackData.suggestion,
        rating: feedbackData.rating,
      }
    );

    return { success: true, message: 'Feedback tracked successfully' };
  }

  @Get('session/current')
  @ApiOperation({ summary: 'Get current session context' })
  @ApiResponse({ status: 200, description: 'Current session information' })
  async getCurrentSession(@User() user: AuthenticatedUser) {
    const session = await this.contextTracker.getSessionContext(user.uid);
    return session || { message: 'No active session' };
  }

  @Post('session/start')
  @ApiOperation({ summary: 'Start a new learning session' })
  @ApiResponse({ status: 200, description: 'Session started' })
  async startSession(@User() user: AuthenticatedUser) {
    const sessionId = await this.contextTracker.startSession(user.uid);
    return { sessionId, message: 'Session started successfully' };
  }

  @Post('session/end')
  @ApiOperation({ summary: 'End current learning session' })
  @ApiResponse({ status: 200, description: 'Session ended' })
  async endSession(
    @Body() sessionData: { sessionId: string },
    @User() user: AuthenticatedUser,
  ) {
    await this.contextTracker.endSession(sessionData.sessionId);
    return { success: true, message: 'Session ended successfully' };
  }
}
