import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UsePipes,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId, CurrentUser } from '../decorators/tenant.decorator';
import { ZodValidationPipe } from '../middleware/zod-validation.pipe';
import {
  CreateTaskDto,
  CreateTaskDtoType,
  UpdateTaskStatusDto,
  UpdateTaskStatusDtoType,
  AssignTaskDto,
  AssignTaskDtoType,
} from '../dto/project.dto';
import {
  TaskRepository,
  TASK_REPOSITORY,
} from '../../domain/repositories/task.repository';
import {
  ProjectRepository,
  PROJECT_REPOSITORY,
} from '../../domain/repositories/project.repository';
import { Task } from '../../domain/entities/task.entity';
import { TaskStatusEnum } from '../../domain/value-objects/task-status';
import {
  ProjectNotFoundException,
  TaskNotFoundException,
  InvalidStatusTransition,
} from '../../domain/exceptions/domain.exceptions';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('api/v1/projects/tasks')
export class TaskController {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepo: TaskRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: ProjectRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateTaskDto))
  @ApiOperation({ summary: 'Create a new task in a project' })
  async create(
    @Body() dto: CreateTaskDtoType,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    // Verify project exists
    const project = await this.projectRepo.findById(dto.projectId, tenantId);
    if (!project) throw new ProjectNotFoundException(dto.projectId);

    const task = Task.create({
      projectId: dto.projectId,
      title: dto.title,
      description: dto.description,
      assigneeId: dto.assigneeId ?? null,
      milestoneId: dto.milestoneId ?? null,
      priority: dto.priority,
      estimatedHours: dto.estimatedHours,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      tenantId,
      createdBy: user.userId,
    });

    project.addTask(task);
    const saved = await this.taskRepo.save(task);

    return {
      id: saved.id,
      title: saved.title,
      status: saved.status,
      projectId: saved.projectId,
    };
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(UpdateTaskStatusDto))
  @ApiOperation({ summary: 'Update task status' })
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDtoType,
    @TenantId() tenantId: string,
  ) {
    const task = await this.taskRepo.findById(id, tenantId);
    if (!task) throw new TaskNotFoundException(id);

    const targetStatus = dto.status as TaskStatusEnum;
    if (!task.statusVO.canTransitionTo(targetStatus)) {
      throw new InvalidStatusTransition(task.status, targetStatus);
    }

    task.updateStatus(targetStatus);
    const saved = await this.taskRepo.update(task);

    return {
      id: saved.id,
      title: saved.title,
      previousStatus: task.status,
      newStatus: saved.status,
    };
  }

  @Patch(':id/assign')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(AssignTaskDto))
  @ApiOperation({ summary: 'Assign task to a user' })
  async assign(
    @Param('id') id: string,
    @Body() dto: AssignTaskDtoType,
    @TenantId() tenantId: string,
  ) {
    const task = await this.taskRepo.findById(id, tenantId);
    if (!task) throw new TaskNotFoundException(id);

    task.assign(dto.assigneeId);
    await this.taskRepo.update(task);

    return { id: task.id, assigneeId: dto.assigneeId };
  }

  @Get()
  @ApiOperation({ summary: 'List tasks by project' })
  async listByProject(
    @Query('projectId') projectId: string,
    @TenantId() tenantId: string,
  ) {
    return this.taskRepo.findByProject(projectId, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  async findById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    const task = await this.taskRepo.findById(id, tenantId);
    if (!task) throw new TaskNotFoundException(id);
    return task;
  }

  @Get('assignee/:assigneeId')
  @ApiOperation({ summary: 'List tasks by assignee' })
  async listByAssignee(
    @Param('assigneeId') assigneeId: string,
    @TenantId() tenantId: string,
  ) {
    return this.taskRepo.findByAssignee(assigneeId, tenantId);
  }
}
