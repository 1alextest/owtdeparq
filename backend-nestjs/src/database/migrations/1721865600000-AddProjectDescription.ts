import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectDescription1721865600000 implements MigrationInterface {
  name = "AddProjectDescription1721865600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add description column to projects table
    await queryRunner.query(`
      ALTER TABLE "projects" 
      ADD COLUMN "description" TEXT
    `);

    // Add description_updated_at timestamp column for tracking changes
    await queryRunner.query(`
      ALTER TABLE "projects" 
      ADD COLUMN "description_updated_at" TIMESTAMP WITH TIME ZONE
    `);

    console.log("✅ Project description columns added successfully");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop description_updated_at column
    await queryRunner.query(`
      ALTER TABLE "projects" 
      DROP COLUMN "description_updated_at"
    `);

    // Drop description column
    await queryRunner.query(`
      ALTER TABLE "projects" 
      DROP COLUMN "description"
    `);

    console.log("✅ Project description columns removed successfully");
  }
}