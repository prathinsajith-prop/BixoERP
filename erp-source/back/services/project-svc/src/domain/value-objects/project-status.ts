/** Value Object: ProjectStatus — lifecycle PLANNING → ACTIVE → ON_HOLD → COMPLETED → CANCELLED */
export enum ProjectStatusEnum {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

const VALID_TRANSITIONS: Record<ProjectStatusEnum, ProjectStatusEnum[]> = {
  [ProjectStatusEnum.PLANNING]: [ProjectStatusEnum.ACTIVE, ProjectStatusEnum.CANCELLED],
  [ProjectStatusEnum.ACTIVE]: [ProjectStatusEnum.ON_HOLD, ProjectStatusEnum.COMPLETED, ProjectStatusEnum.CANCELLED],
  [ProjectStatusEnum.ON_HOLD]: [ProjectStatusEnum.ACTIVE, ProjectStatusEnum.CANCELLED],
  [ProjectStatusEnum.COMPLETED]: [],
  [ProjectStatusEnum.CANCELLED]: [],
};

export class ProjectStatus {
  private constructor(private readonly _value: ProjectStatusEnum) {}

  static create(value: string): ProjectStatus {
    if (!Object.values(ProjectStatusEnum).includes(value as ProjectStatusEnum)) {
      throw new Error(`Invalid project status: ${value}`);
    }
    return new ProjectStatus(value as ProjectStatusEnum);
  }

  static planning(): ProjectStatus {
    return new ProjectStatus(ProjectStatusEnum.PLANNING);
  }

  get value(): ProjectStatusEnum {
    return this._value;
  }

  canTransitionTo(target: ProjectStatusEnum): boolean {
    return VALID_TRANSITIONS[this._value].includes(target);
  }

  transitionTo(target: ProjectStatusEnum): ProjectStatus {
    if (!this.canTransitionTo(target)) {
      throw new Error(
        `Invalid status transition from ${this._value} to ${target}`,
      );
    }
    return new ProjectStatus(target);
  }

  isTerminal(): boolean {
    return (
      this._value === ProjectStatusEnum.COMPLETED ||
      this._value === ProjectStatusEnum.CANCELLED
    );
  }

  equals(other: ProjectStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
