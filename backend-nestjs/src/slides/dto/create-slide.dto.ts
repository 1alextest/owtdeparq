import { IsString, IsNotEmpty, IsUUID, IsInt, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SlideType } from '../../entities/slide.entity';

export class CreateSlideDto {
  @ApiProperty({ description: 'ID of the deck this slide belongs to' })
  @IsUUID()
  @IsNotEmpty()
  deckId: string;

  @ApiProperty({ description: 'Title of the slide' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Main content of the slide' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Speaker notes for the slide', required: false })
  @IsString()
  @IsOptional()
  speakerNotes?: string;

  @ApiProperty({ 
    description: 'Type of the slide',
    enum: [
      'cover', 'problem', 'solution', 'market', 'product', 'business_model',
      'go_to_market', 'competition', 'team', 'financials', 'traction', 'funding_ask'
    ]
  })
  @IsIn([
    'cover', 'problem', 'solution', 'market', 'product', 'business_model',
    'go_to_market', 'competition', 'team', 'financials', 'traction', 'funding_ask'
  ])
  slideType: SlideType;

  @ApiProperty({ description: 'Order of the slide in the deck' })
  @IsInt()
  @IsNotEmpty()
  slideOrder: number;

  @ApiProperty({ description: 'AI model that generated this slide', required: false })
  @IsString()
  @IsOptional()
  generatedBy?: string;
}
