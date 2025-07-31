import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPresentationEntity1722480000000 implements MigrationInterface {
    name = 'AddPresentationEntity1722480000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create presentations table
        await queryRunner.query(`
            CREATE TABLE "presentations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "project_id" uuid NOT NULL,
                "name" text NOT NULL,
                "description" text,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_presentations" PRIMARY KEY ("id")
            )
        `);

        // Create index on project_id
        await queryRunner.query(`
            CREATE INDEX "idx_presentations_project" ON "presentations" ("project_id")
        `);

        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "presentations" 
            ADD CONSTRAINT "FK_presentations_project" 
            FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
        `);

        // Add presentation_id column to pitch_decks table
        await queryRunner.query(`
            ALTER TABLE "pitch_decks" 
            ADD COLUMN "presentation_id" uuid
        `);

        // Add foreign key constraint for presentation_id
        await queryRunner.query(`
            ALTER TABLE "pitch_decks" 
            ADD CONSTRAINT "FK_pitch_decks_presentation" 
            FOREIGN KEY ("presentation_id") REFERENCES "presentations"("id") ON DELETE CASCADE
        `);

        // Create index on presentation_id
        await queryRunner.query(`
            CREATE INDEX "idx_pitch_decks_presentation" ON "pitch_decks" ("presentation_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "pitch_decks" 
            DROP CONSTRAINT "FK_pitch_decks_presentation"
        `);

        await queryRunner.query(`
            ALTER TABLE "presentations" 
            DROP CONSTRAINT "FK_presentations_project"
        `);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "idx_pitch_decks_presentation"`);
        await queryRunner.query(`DROP INDEX "idx_presentations_project"`);

        // Drop presentation_id column from pitch_decks
        await queryRunner.query(`
            ALTER TABLE "pitch_decks" 
            DROP COLUMN "presentation_id"
        `);

        // Drop presentations table
        await queryRunner.query(`DROP TABLE "presentations"`);
    }
}
