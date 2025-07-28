import { PartialType, OmitType, ApiProperty } from '@nestjs/swagger';
import { CreateSlideDto } from './create-slide.dto';

export class UpdateSlideDto extends PartialType(
  OmitType(CreateSlideDto, ['deckId'] as const)
) {}

export class ReorderSlidesDto {
  @ApiProperty({ description: 'Array of slide IDs in new order' })
  slideIds: string[];
}
