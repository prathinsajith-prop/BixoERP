import { Controller, Get, Post, Put, Body, Param, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import { CreateDepartmentDto, CreateDepartmentDtoType } from '../dto/hr.dto';
import { DepartmentRepository, DEPARTMENT_REPOSITORY } from '../../domain/repositories/department.repository';
import { Department } from '../../domain/entities/department.entity';
import { EntityNotFoundException, DuplicateEntryException } from '../../domain/exceptions/domain.exceptions';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('api/v1/hr/departments')
export class DepartmentController {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY) private readonly departmentRepo: DepartmentRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new department' })
  async create(@Body(new ZodValidationPipe(CreateDepartmentDto)) dto: CreateDepartmentDtoType, @TenantId() tenantId: string) {
    const exists = await this.departmentRepo.existsByCode(dto.code, tenantId);
    if (exists) throw new DuplicateEntryException('code', dto.code);

    const department = Department.create({
      code: dto.code,
      name: dto.name,
      parentId: dto.parentId ?? null,
      managerId: dto.managerId ?? null,
      tenantId,
      description: dto.description ?? null,
    });

    const saved = await this.departmentRepo.save(department);
    return this.toResponse(saved);
  }

  @Get()
  @ApiOperation({ summary: 'List all departments for current tenant' })
  async list(@TenantId() tenantId: string) {
    const departments = await this.departmentRepo.findAll(tenantId);
    return departments.map((d) => this.toResponse(d));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID' })
  async findById(@Param('id') id: string, @TenantId() tenantId: string) {
    const department = await this.departmentRepo.findById(id, tenantId);
    if (!department) throw new EntityNotFoundException('Department', id);
    return this.toResponse(department);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a department' })
  async update(@Param('id') id: string, @Body(new ZodValidationPipe(CreateDepartmentDto)) dto: CreateDepartmentDtoType, @TenantId() tenantId: string) {
    const department = await this.departmentRepo.findById(id, tenantId);
    if (!department) throw new EntityNotFoundException('Department', id);

    // Re-create with updated props preserving the same id
    const updated = Department.fromPersistence(
      {
        code: dto.code,
        name: dto.name,
        parentId: dto.parentId ?? null,
        managerId: dto.managerId ?? null,
        isActive: department.isActive,
        tenantId,
        description: dto.description ?? null,
        createdAt: department.createdAt,
        updatedAt: new Date(),
      },
      id,
    );

    const saved = await this.departmentRepo.update(updated);
    return this.toResponse(saved);
  }

  private toResponse(dept: Department) {
    return {
      id: dept.id,
      code: dept.code,
      name: dept.name,
      parentId: dept.parentId,
      managerId: dept.managerId,
      isActive: dept.isActive,
      description: dept.description,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
    };
  }
}
