import { AggregateRoot, DomainEvent } from './aggregate-root.base';
import { FileReference } from '../value-objects/file-reference';
import { AllowedMimeTypes } from '../value-objects/allowed-mime-types';
import { BusinessRuleViolation } from '../exceptions/domain.exceptions';
import { v4 as uuidv4 } from 'uuid';

export interface FileMetadataProps {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  storageBucket: string;
  version: number;
  tenantId: string;
  uploadedBy: string;
  tags: string[];
  description: string | null;
  category: string | null;
  expiresAt: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class FileMetadata extends AggregateRoot<FileMetadataProps> {
  get originalName(): string {
    return this.props.originalName;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get sizeBytes(): number {
    return this.props.sizeBytes;
  }

  get storagePath(): string {
    return this.props.storagePath;
  }

  get storageBucket(): string {
    return this.props.storageBucket;
  }

  get fileReference(): FileReference {
    return new FileReference(this.props.storageBucket, this.props.storagePath);
  }

  get version(): number {
    return this.props.version;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get uploadedBy(): string {
    return this.props.uploadedBy;
  }

  get tags(): string[] {
    return [...this.props.tags];
  }

  get description(): string | null {
    return this.props.description;
  }

  get category(): string | null {
    return this.props.category;
  }

  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }

  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static create(input: {
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storageBucket: string;
    storagePath: string;
    tenantId: string;
    uploadedBy: string;
    tags?: string[];
    description?: string;
    category?: string;
    expiresAt?: Date;
  }): FileMetadata {
    if (!AllowedMimeTypes.isAllowed(input.mimeType)) {
      throw new BusinessRuleViolation(`MIME type not allowed: ${input.mimeType}`);
    }

    const id = uuidv4();
    const now = new Date();
    const metadata = new FileMetadata(
      {
        originalName: input.originalName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storageBucket: input.storageBucket,
        storagePath: input.storagePath,
        version: 1,
        tenantId: input.tenantId,
        uploadedBy: input.uploadedBy,
        tags: input.tags ?? [],
        description: input.description ?? null,
        category: input.category ?? null,
        expiresAt: input.expiresAt ?? null,
        isDeleted: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );

    metadata.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'file.uploaded',
      aggregateId: id,
      tenantId: input.tenantId,
      occurredAt: now,
      payload: {
        originalName: input.originalName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storagePath: input.storagePath,
        uploadedBy: input.uploadedBy,
      },
    });

    return metadata;
  }

  static reconstitute(id: string, props: FileMetadataProps): FileMetadata {
    return new FileMetadata(props, id);
  }

  bumpVersion(newStoragePath: string, newSizeBytes: number): void {
    this.props.version += 1;
    this.props.storagePath = newStoragePath;
    this.props.sizeBytes = newSizeBytes;
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'file.version_updated',
      aggregateId: this._id,
      tenantId: this.props.tenantId,
      occurredAt: this.props.updatedAt,
      payload: {
        version: this.props.version,
        storagePath: newStoragePath,
        sizeBytes: newSizeBytes,
      },
    });
  }

  updateTags(tags: string[]): void {
    this.props.tags = tags;
    this.props.updatedAt = new Date();
  }

  updateMetadata(input: {
    description?: string | null;
    category?: string | null;
    expiresAt?: Date | null;
    tags?: string[];
  }): void {
    if (input.description !== undefined) this.props.description = input.description;
    if (input.category !== undefined) this.props.category = input.category;
    if (input.expiresAt !== undefined) this.props.expiresAt = input.expiresAt;
    if (input.tags !== undefined) this.props.tags = input.tags;
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    if (this.props.isDeleted) {
      throw new BusinessRuleViolation('File already deleted');
    }
    this.props.isDeleted = true;
    this.props.deletedAt = new Date();
    this.props.updatedAt = this.props.deletedAt;

    this.addDomainEvent({
      eventId: uuidv4(),
      eventType: 'file.deleted',
      aggregateId: this._id,
      tenantId: this.props.tenantId,
      occurredAt: this.props.updatedAt,
      payload: {
        originalName: this.props.originalName,
        storagePath: this.props.storagePath,
      },
    });
  }
}
