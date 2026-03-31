import { Injectable, Inject } from '@nestjs/common';
import { NotificationTemplate } from '../../domain/entities/notification-template.entity';
import { TEMPLATE_REPOSITORY, TemplateRepository } from '../../domain/repositories/template.repository';
import { CreateTemplateDto } from '../dtos/create-template.dto';
import { DuplicateEntryException } from '../../domain/exceptions/domain.exceptions';

@Injectable()
export class CreateTemplateUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY) private readonly templateRepo: TemplateRepository,
  ) {}

  async execute(dto: CreateTemplateDto): Promise<NotificationTemplate> {
    // Check for duplicate code within the tenant
    const existing = await this.templateRepo.findByCode(dto.code, dto.tenantId);
    if (existing) {
      throw new DuplicateEntryException('template code', dto.code);
    }

    const template = NotificationTemplate.create({
      tenantId: dto.tenantId,
      name: dto.name,
      code: dto.code,
      channel: dto.channel,
      subjectTemplate: dto.subjectTemplate,
      bodyTemplate: dto.bodyTemplate,
      variables: dto.variables,
    });

    await this.templateRepo.save(template);
    return template;
  }
}
