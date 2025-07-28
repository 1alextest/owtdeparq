import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SlideTemplate } from '../entities/slide-template.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(SlideTemplate)
    private templateRepository: Repository<SlideTemplate>,
  ) {}

  async findAll(): Promise<SlideTemplate[]> {
    return await this.templateRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<SlideTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id, isActive: true },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async findByCategory(category: string): Promise<SlideTemplate[]> {
    return await this.templateRepository.find({
      where: { category, isActive: true },
      order: { name: 'ASC' },
    });
  }
}
