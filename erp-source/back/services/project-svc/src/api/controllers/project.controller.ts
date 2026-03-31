import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  UsePipes,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import {
  CreateProjectDto,
  CreateProjectDtoType,
  UpdateProjectStatusDto,
  UpdateProjectStatusDtoType,
  UpdateProjectDto,
  UpdateProjectDtoType,
  SetProjectBudgetDto,
  SetProjectBudgetDtoType,
} from '../dto/project.dto';
import {
  CreateProjectUseCase,
  UpdateProjectStatusUseCase,
  TrackBudgetVarianceUseCase,
} from '../../application/use-cases';
import {
  ProjectRepository,
  PROJECT_REPOSITORY,
} from '../../domain/repositories/project.repository';
import { ProjectNotFoundException } from '../../domain/exceptions/domain.exceptions';
import { Project } from '../../domain/entities/project.entity';
import { ProjectBudget } from '../../domain/entities/project-budget.entity';
import { Milestone } from '../../domain/entities/milestone.entity';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('api/v1/projects')
export class ProjectController {
  constructor(
    private readonly createProject: CreateProjectUseCase,
    private readonly updateProjectStatus: UpdateProjectStatusUseCase,
    private readonly trackBudgetVariance: TrackBudgetVarianceUseCase,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: ProjectRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateProjectDto))
  @ApiOperation({ summary: 'Create a new project' })
  async create(
    @Body() dto: CreateProjectDtoType,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.createProject.execute({
      name: dto.name,
      description: dto.description,
      managerId: dto.managerId,
      customerId: dto.customerId ?? null,
      startDate: dto.startDate,
      endDate: dto.endDate ?? null,
      currency: dto.currency,
      tenantId,
      createdBy: user.userId,
    });
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(UpdateProjectStatusDto))
  @ApiOperation({ summary: 'Update project status (lifecycle transition)' })
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProjectStatusDtoType,
    @TenantId() tenantId: string,
  ) {
    return this.updateProjectStatus.execute({
      projectId: id,
      newStatus: dto.status,
      tenantId,
    });
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update project details' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProjectDto)) dto: UpdateProjectDtoType,
    @TenantId() tenantId: string,
  ) {
    const project = await this.projectRepo.findById(id, tenantId);
    if (!project) throw new ProjectNotFoundException(id);

    project.updateDetails({
      name: dto.name,
      description: dto.description,
      managerId: dto.managerId,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });

    await this.projectRepo.update(project);
    return { message: 'Project updated successfully' };
  }

  @Post(':id/budget')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(SetProjectBudgetDto))
  @ApiOperation({ summary: 'Set or update project budget' })
  async setBudget(
    @Param('id') id: string,
    @Body() dto: SetProjectBudgetDtoType,
    @TenantId() tenantId: string,
  ) {
    const project = await this.projectRepo.findById(id, tenantId);
    if (!project) throw new ProjectNotFoundException(id);

    const budget = ProjectBudget.create({
      projectId: id,
      totalBudget: dto.totalBudget,
      laborBudget: dto.laborBudget,
      materialBudget: dto.materialBudget,
      currency: dto.currency,
      tenantId,
    });

    project.setBudget(budget);
    await this.projectRepo.update(project);
    return { message: 'Budget set successfully' };
  }

  @Get(':id/budget/variance')
  @ApiOperation({ summary: 'Get budget variance report for project' })
  async getBudgetVariance(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.trackBudgetVariance.execute({
      projectId: id,
      tenantId,
    });
  }

  @Post(':id/milestones')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a milestone to a project' })
  async addMilestone(
    @Param('id') id: string,
    @Body() dto: { name: string; description: string; dueDate: string },
    @TenantId() tenantId: string,
  ) {
    const project = await this.projectRepo.findById(id, tenantId);
    if (!project) throw new ProjectNotFoundException(id);

    const milestone = Milestone.create({
      projectId: id,
      name: dto.name,
      description: dto.description,
      dueDate: new Date(dto.dueDate),
      tenantId,
    });

    project.addMilestone(milestone);
    await this.projectRepo.update(project);
    return { id: milestone.id, name: milestone.name };
  }

  @Get()
  @ApiOperation({ summary: 'List all projects for current tenant' })
  async list(@TenantId() tenantId: string) {
    return this.projectRepo.findByTenant(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  async findById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    const project = await this.projectRepo.findById(id, tenantId);
    if (!project) throw new ProjectNotFoundException(id);
    return project;
  }
}
