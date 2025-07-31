import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePresentationDto } from './create-presentation.dto';

export class UpdatePresentationDto extends PartialType(
  OmitType(CreatePresentationDto, ['projectId'] as const)
) {}
