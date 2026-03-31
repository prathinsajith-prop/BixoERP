import { Controller, Get, Post, Put, Body, Param, Query, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import { CreatePositionDto, CreatePositionDtoType } from '../dto/hr.dto';
import { PositionRepository, POSITION_REPOSITORY } from '../../domain/repositories/position.repository';
import { Position } from '../../domain/entities/position.entity';
import { Money } from '../../domain/value-objects/money';
import { EntityNotFoundException, DuplicateEntryException } from '../../domain/exceptions/domain.exceptions';

@ApiTags('Positions')
@ApiBearerAuth()
@Controller('api/v1/hr/positions')
export class PositionController {
  constructor(
    @Inject(POSITION_REPOSITORY) private readonly positionRepo: PositionRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new position' })
  async create(@Body(new ZodValidationPipe(CreatePositionDto)) dto: CreatePositionDtoType, @TenantId() tenantId: string) {
    const exists = await this.positionRepo.existsByCode(dto.code, tenantId);
    if (exists) throw new DuplicateEntryException('code', dto.code);

    const position = Position.create({
      code: dto.code,
      title: dto.title,
      departmentId: dto.departmentId,
      minSalary: Money.create(dto.minSalary, dto.currency),
      maxSalary: Money.create(dto.maxSalary, dto.currency),
      currency: dto.currency,
      tenantId,
      description: dto.description ?? null,
    });

    const saved = await this.positionRepo.save(position);
    return this.toResponse(saved);
  }

  @Get()
  @ApiOperation({ summary: 'List all positions for current tenant' })
  async list(@TenantId() tenantId: string, @Query('departmentId') departmentId?: string) {
    if (departmentId) {
      const positions = await this.positionRepo.findByDepartment(departmentId, tenantId);
      return positions.map((p) => this.toResponse(p));
    }
    const positions = await this.positionRepo.findAll(tenantId);
    return positions.map((p) => this.toResponse(p));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get position by ID' })
  async findById(@Param('id') id: string, @TenantId() tenantId: string) {
    const position = await this.positionRepo.findById(id, tenantId);
    if (!position) throw new EntityNotFoundException('Position', id);
    return this.toResponse(position);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a position' })
  async update(@Param('id') id: string, @Body(new ZodValidationPipe(CreatePositionDto)) dto: CreatePositionDtoType, @TenantId() tenantId: string) {
    const position = await this.positionRepo.findById(id, tenantId);
    if (!position) throw new EntityNotFoundException('Position', id);

    const updated = Position.fromPersistence(
      {
        code: dto.code,
        title: dto.title,
        departmentId: dto.departmentId,
        minSalary: Money.create(dto.minSalary, dto.currency),
        maxSalary: Money.create(dto.maxSalary, dto.currency),
        currency: dto.currency,
        isActive: position.isActive,
        tenantId,
        description: dto.description ?? null,
        createdAt: position.createdAt,
        updatedAt: new Date(),
      },
      id,
    );

    const saved = await this.positionRepo.update(updated);
    return this.toResponse(saved);
  }

  private toResponse(pos: Position) {
    return {
      id: pos.id,
      code: pos.code,
      title: pos.title,
      departmentId: pos.departmentId,
      minSalary: { amount: pos.minSalary.amountAsNumber, currency: pos.currency },
      maxSalary: { amount: pos.maxSalary.amountAsNumber, currency: pos.currency },
      currency: pos.currency,
      isActive: pos.isActive,
      description: pos.description,
      createdAt: pos.createdAt,
      updatedAt: pos.updatedAt,
    };
  }
}
