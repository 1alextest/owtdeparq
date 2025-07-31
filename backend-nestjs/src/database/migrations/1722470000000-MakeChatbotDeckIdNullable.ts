import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeChatbotDeckIdNullable1722470000000 implements MigrationInterface {
  name = 'MakeChatbotDeckIdNullable1722470000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "chatbot_conversations" 
      DROP CONSTRAINT "FK_chatbot_conversations_deck"
    `);

    // Make deck_id nullable to support virtual decks
    await queryRunner.query(`
      ALTER TABLE "chatbot_conversations" 
      ALTER COLUMN "deck_id" DROP NOT NULL
    `);

    // Add the foreign key constraint back with nullable support
    await queryRunner.query(`
      ALTER TABLE "chatbot_conversations" 
      ADD CONSTRAINT "FK_chatbot_conversations_deck" 
      FOREIGN KEY ("deck_id") REFERENCES "pitch_decks"("id") ON DELETE CASCADE
    `);

    // Add a check constraint to ensure either deck_id is provided OR it's a virtual deck
    // Virtual decks will have deck_id as UUID but not in pitch_decks table
    await queryRunner.query(`
      ALTER TABLE "chatbot_conversations" 
      ADD CONSTRAINT "CHK_chatbot_conversations_deck_or_virtual" 
      CHECK (
        "deck_id" IS NOT NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the check constraint
    await queryRunner.query(`
      ALTER TABLE "chatbot_conversations" 
      DROP CONSTRAINT "CHK_chatbot_conversations_deck_or_virtual"
    `);

    // Drop the foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "chatbot_conversations" 
      DROP CONSTRAINT "FK_chatbot_conversations_deck"
    `);

    // Make deck_id NOT NULL again
    await queryRunner.query(`
      ALTER TABLE "chatbot_conversations" 
      ALTER COLUMN "deck_id" SET NOT NULL
    `);

    // Add the foreign key constraint back with NOT NULL
    await queryRunner.query(`
      ALTER TABLE "chatbot_conversations" 
      ADD CONSTRAINT "FK_chatbot_conversations_deck" 
      FOREIGN KEY ("deck_id") REFERENCES "pitch_decks"("id") ON DELETE CASCADE
    `);
  }
}
