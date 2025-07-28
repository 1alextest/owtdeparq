import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsString, IsNotEmpty, IsUUID, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PitchDeck } from './pitch-deck.entity';

@Entity('deck_versions')
@Index('idx_deck_versions_deck', ['deckId', 'versionNumber'])
export class DeckVersion {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the deck version' })
  id: string;

  @Column({ name: 'deck_id', type: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID of the deck this version belongs to' })
  deckId: string;

  @Column({ name: 'version_number', type: 'integer' })
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ description: 'Version number (incremental)' })
  versionNumber: number;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Description of this version' })
  description: string;

  @Column({ name: 'change_summary', type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Summary of changes made in this version' })
  changeSummary: string;

  @Column({ name: 'version_data', type: 'jsonb' })
  @IsNotEmpty()
  @ApiProperty({ description: 'Complete deck state snapshot for this version' })
  versionData: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Version creation timestamp' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => PitchDeck, (deck) => deck.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deck_id' })
  @ApiProperty({ type: () => PitchDeck, description: 'Deck this version belongs to' })
  deck: PitchDeck;
}
