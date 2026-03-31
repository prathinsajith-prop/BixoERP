import { Controller, Get, Post, Put, Delete, Body, Param, Inject, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { TenantId } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import {
  CreateTemplateSchema,
  UpdateTemplateSchema,
  CreateTemplateRequestDto,
  UpdateTemplateRequestDto,
} from '../dto/template.schemas';
import { TEMPLATE_REPOSITORY, TemplateRepository } from '../../domain/repositories/template.repository';
import { CreateTemplateUseCase } from '../../application/use-cases/create-template.use-case';
import { EntityNotFoundException } from '../../domain/exceptions/domain.exceptions';

@ApiTags('Notification Templates')
@ApiBearerAuth()
@Controller('api/v1/notification-templates')
export class TemplateController {
  constructor(
    @Inject(TEMPLATE_REPOSITORY) private readonly templateRepo: TemplateRepository,
    private readonly createTemplateUseCase: CreateTemplateUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all notification templates' })
  async list(@TenantId() tenantId: string) {
    const templates = await this.templateRepo.findAll(tenantId);
    return {
      data: templates.map((t) => ({
        id: t.id,
        name: t.name,
        code: t.code,
        channel: t.channel,
        subjectTemplate: t.subjectTemplate,
        bodyTemplate: t.bodyTemplate,
        variables: t.variables,
        isActive: t.isActive,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification template by ID' })
  @ApiParam({ name: 'id', type: String })
  async findById(@TenantId() tenantId: string, @Param('id') id: string) {
    const template = await this.templateRepo.findById(id, tenantId);
    if (!template) throw new EntityNotFoundException('NotificationTemplate', id);
    return {
      id: template.id,
      name: template.name,
      code: template.code,
      channel: template.channel,
      subjectTemplate: template.subjectTemplate,
      bodyTemplate: template.bodyTemplate,
      variables: template.variables,
      isActive: template.isActive,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new notification template' })
  async create(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(CreateTemplateSchema)) body: CreateTemplateRequestDto,
  ) {
    const template = await this.createTemplateUseCase.execute({
      tenantId,
      name: body.name,
      code: body.code,
      channel: body.channel as any,
      subjectTemplate: body.subjectTemplate,
      bodyTemplate: body.bodyTemplate,
      variables: body.variables,
    });
    return {
      id: template.id,
      name: template.name,
      code: template.code,
      channel: template.channel,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a notification template' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTemplateSchema)) body: UpdateTemplateRequestDto,
  ) {
    const template = await this.templateRepo.findById(id, tenantId);
    if (!template) throw new EntityNotFoundException('NotificationTemplate', id);

    template.update(body);
    await this.templateRepo.save(template);
    return {
      id: template.id,
      name: template.name,
      code: template.code,
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification template' })
  @ApiParam({ name: 'id', type: String })
  async delete(@TenantId() tenantId: string, @Param('id') id: string) {
    const template = await this.templateRepo.findById(id, tenantId);
    if (!template) throw new EntityNotFoundException('NotificationTemplate', id);
    await this.templateRepo.delete(id, tenantId);
    return { success: true };
  }
}
