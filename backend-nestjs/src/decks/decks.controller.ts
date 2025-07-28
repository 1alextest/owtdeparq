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
import { DecksService } from './decks.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { PitchDeck } from '../entities/pitch-deck.entity';

@ApiTags('Decks')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('decks')
export class DecksController {
  constructor(private readonly decksService: DecksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new pitch deck' })
  @ApiResponse({ status: 201, description: 'Deck created successfully', type: PitchDeck })
  create(
    @Body() createDeckDto: CreateDeckDto,
    @User() user: AuthenticatedUser,
  ): Promise<PitchDeck> {
    return this.decksService.create(createDeckDto, user.uid);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific deck by ID' })
  @ApiResponse({ status: 200, description: 'Deck details with slides', type: PitchDeck })
  findOne(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<PitchDeck> {
    return this.decksService.findOne(id, user.uid);
  }

  @Get(':id/slides')
  @ApiOperation({ summary: 'Get all slides for a specific deck' })
  @ApiResponse({ status: 200, description: 'Deck slides retrieved successfully' })
  getDeckSlides(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<any[]> {
    return this.decksService.getDeckSlides(id, user.uid);
  }



  @Patch(':id')
  @ApiOperation({ summary: 'Update a deck' })
  @ApiResponse({ status: 200, description: 'Deck updated successfully', type: PitchDeck })
  update(
    @Param('id') id: string,
    @Body() updateDeckDto: UpdateDeckDto,
    @User() user: AuthenticatedUser,
  ): Promise<PitchDeck> {
    return this.decksService.update(id, updateDeckDto, user.uid);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a deck' })
  @ApiResponse({ status: 200, description: 'Deck deleted successfully' })
  remove(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<void> {
    return this.decksService.remove(id, user.uid);
  }
}
