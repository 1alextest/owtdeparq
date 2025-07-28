import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { ChatRequestDto, ImproveSpeakerNotesDto } from './dto/chat-request.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';

@ApiTags('Chatbot')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI assistant for pitch deck help' })
  @ApiResponse({ status: 200, description: 'AI response generated' })
  async chatWithAI(
    @Body() chatDto: ChatRequestDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.chatbotService.chatWithAI(chatDto, user.uid);
  }

  @Post('improve-speaker-notes')
  @ApiOperation({ summary: 'Improve speaker notes for a slide' })
  @ApiResponse({ status: 200, description: 'Speaker notes improved' })
  async improveSpeakerNotes(
    @Body() improveDto: ImproveSpeakerNotesDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.chatbotService.improveSpeakerNotes(improveDto, user.uid);
  }
}
