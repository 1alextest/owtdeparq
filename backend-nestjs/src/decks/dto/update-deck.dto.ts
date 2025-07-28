import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDeckDto } from './create-deck.dto';

export class UpdateDeckDto extends PartialType(
  OmitType(CreateDeckDto, ['projectId'] as const)
) {}
