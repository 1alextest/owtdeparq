import { Module, forwardRef } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { PowerPointGeneratorService } from './generators/powerpoint-generator.service';
import { PDFGeneratorService } from './generators/pdf-generator.service';
import { TemplateGeneratorService } from './generators/template-generator.service';
import { AuthModule } from '../auth/auth.module';
import { DecksModule } from '../decks/decks.module';

@Module({
  imports: [AuthModule, forwardRef(() => DecksModule)],
  controllers: [ExportController],
  providers: [
    ExportService,
    PowerPointGeneratorService,
    PDFGeneratorService,
    TemplateGeneratorService,
  ],
  exports: [
    ExportService,
    PowerPointGeneratorService,
    PDFGeneratorService,
    TemplateGeneratorService,
  ],
})
export class ExportModule {}
