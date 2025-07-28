import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateCustomDto {
  @ApiProperty({ description: 'ID of the project to create the deck in' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: 'Company name' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ description: 'Industry sector' })
  @IsString()
  @IsNotEmpty()
  industry: string;

  @ApiProperty({ description: 'Target market description' })
  @IsString()
  @IsNotEmpty()
  targetMarket: string;

  @ApiProperty({ description: 'Problem statement' })
  @IsString()
  @IsNotEmpty()
  problemStatement: string;

  @ApiProperty({ description: 'Solution description' })
  @IsString()
  @IsNotEmpty()
  solution: string;

  @ApiProperty({ description: 'Business model' })
  @IsString()
  @IsNotEmpty()
  businessModel: string;

  @ApiProperty({ description: 'Go-to-market strategy', required: false })
  @IsString()
  @IsOptional()
  goToMarketStrategy?: string;

  @ApiProperty({ description: 'Competition analysis', required: false })
  @IsString()
  @IsOptional()
  competition?: string;

  @ApiProperty({ description: 'Team information', required: false })
  @IsString()
  @IsOptional()
  team?: string;

  @ApiProperty({ description: 'Financial projections', required: false })
  @IsString()
  @IsOptional()
  financials?: string;

  @ApiProperty({ description: 'Traction and milestones', required: false })
  @IsString()
  @IsOptional()
  traction?: string;

  @ApiProperty({ description: 'Funding ask details', required: false })
  @IsString()
  @IsOptional()
  fundingAsk?: string;

  @ApiProperty({ description: 'Preferred AI model', required: false })
  @IsString()
  @IsOptional()
  preferredModel?: string;

  @ApiProperty({ description: 'User API key for external providers', required: false })
  @IsString()
  @IsOptional()
  userApiKey?: string;
}
