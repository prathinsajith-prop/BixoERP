/** Value Object: TaskStatus — lifecycle TODO → IN_PROGRESS → IN_REVIEW → DONE → CANCELLED */
export enum TaskStatusEnum {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

const VALID_TRANSITIONS: Record<TaskStatusEnum, TaskStatusEnum[]> = {
  [TaskStatusEnum.TODO]: [TaskStatusEnum.IN_PROGRESS, TaskStatusEnum.CANCELLED],
  [TaskStatusEnum.IN_PROGRESS]: [TaskStatusEnum.IN_REVIEW, TaskStatusEnum.TODO, TaskStatusEnum.CANCELLED],
  [TaskStatusEnum.IN_REVIEW]: [TaskStatusEnum.DONE, TaskStatusEnum.IN_PROGRESS, TaskStatusEnum.CANCELLED],
  [TaskStatusEnum.DONE]: [],
  [TaskStatusEnum.CANCELLED]: [],
};

export class TaskStatus {
  private constructor(private readonly _value: TaskStatusEnum) {}

  static create(value: string): TaskStatus {
    if (!Object.values(TaskStatusEnum).includes(value as TaskStatusEnum)) {
      throw new Error(`Invalid task status: ${value}`);
    }
    return new TaskStatus(value as TaskStatusEnum);
  }

  static todo(): TaskStatus {
    return new TaskStatus(TaskStatusEnum.TODO);
  }

  get value(): TaskStatusEnum {
    return this._value;
  }

  canTransitionTo(target: TaskStatusEnum): boolean {
    return VALID_TRANSITIONS[this._value].includes(target);
  }

  transitionTo(target: TaskStatusEnum): TaskStatus {
    if (!this.canTransitionTo(target)) {
      throw new Error(
        `Invalid task status transition from ${this._value} to ${target}`,
      );
    }
    return new TaskStatus(target);
  }

  isDone(): boolean {
    return this._value === TaskStatusEnum.DONE;
  }

  isTerminal(): boolean {
    return (
      this._value === TaskStatusEnum.DONE ||
      this._value === TaskStatusEnum.CANCELLED
    );
  }

  equals(other: TaskStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
