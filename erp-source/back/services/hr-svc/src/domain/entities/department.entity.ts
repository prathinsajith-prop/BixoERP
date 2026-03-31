import { Entity } from './entity.base';

export interface DepartmentProps {
  code: string;
  name: string;
  parentId: string | null;
  managerId: string | null;
  isActive: boolean;
  tenantId: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Department extends Entity<DepartmentProps> {
  static create(
    props: Omit<DepartmentProps, 'isActive' | 'createdAt' | 'updatedAt'>,
    id?: string,
  ): Department {
    return new Department(
      {
        ...props,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
  }

  static fromPersistence(props: DepartmentProps, id: string): Department {
    return new Department(props, id);
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get parentId(): string | null {
    return this.props.parentId;
  }

  get managerId(): string | null {
    return this.props.managerId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get description(): string | null {
    return this.props.description;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  assignManager(managerId: string): void {
    this.props.managerId = managerId;
    this.props.updatedAt = new Date();
  }
}
