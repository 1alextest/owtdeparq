import { Controller, Post, Body, Param, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { GenerationService } from "./generation.service";
import { GenerateFreeDto } from "./dto/generate-free.dto";
import { GenerateCustomDto } from "./dto/generate-custom.dto";
import { RegenerateSlideDto } from "./dto/regenerate-slide.dto";
import { FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { User } from "../auth/decorators/user.decorator";
import { AuthenticatedUser } from "../auth/interfaces/auth.interface";
import { PitchDeck } from "../entities/pitch-deck.entity";
import { Slide } from "../entities/slide.entity";

@ApiTags("Generation")
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller("generate")
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Post("free")
  @ApiOperation({
    summary: "Generate pitch deck from single prompt (Free Mode)",
  })
  @ApiResponse({
    status: 201,
    description: "Deck generated successfully",
    type: PitchDeck,
  })
  async generateFreeMode(
    @Body() generateDto: GenerateFreeDto,
    @User() user: AuthenticatedUser
  ): Promise<{ deck_id: string; message: string }> {
    const deck = await this.generationService.generateFreeMode(
      generateDto,
      user.uid
    );
    return {
      deck_id: deck.id,
      message: "Deck generated successfully",
    };
  }

  @Post("custom")
  @ApiOperation({
    summary: "Generate pitch deck from structured form data (Custom Mode)",
  })
  @ApiResponse({
    status: 201,
    description: "Deck generated successfully",
    type: PitchDeck,
  })
  async generateCustomMode(
    @Body() generateDto: GenerateCustomDto,
    @User() user: AuthenticatedUser
  ): Promise<{ deck_id: string; message: string }> {
    const deck = await this.generationService.generateCustomMode(
      generateDto,
      user.uid
    );
    return {
      deck_id: deck.id,
      message: "Deck generated successfully",
    };
  }

  @Post("slides/:slideId/regenerate")
  @ApiOperation({ summary: "Regenerate individual slide content" })
  @ApiResponse({
    status: 200,
    description: "Slide regenerated successfully",
    type: Slide,
  })
  regenerateSlide(
    @Param("slideId") slideId: string,
    @Body() regenerateDto: RegenerateSlideDto,
    @User() user: AuthenticatedUser
  ): Promise<Slide> {
    return this.generationService.regenerateSlide(
      slideId,
      regenerateDto,
      user.uid
    );
  }

  @Post("test-groq")
  @ApiOperation({ summary: "Test Groq provider directly" })
  @ApiResponse({ status: 200, description: "Groq test successful" })
  async testGroq(@User() user: AuthenticatedUser): Promise<any> {
    return this.generationService.testGroq();
  }
}
