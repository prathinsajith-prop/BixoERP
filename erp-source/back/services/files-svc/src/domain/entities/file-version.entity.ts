import { v4 as uuidv4 } from 'uuid';

export interface FileVersionProps {
  fileMetadataId: string;
  version: number;
  storagePath: string;
  storageBucket: string;
  sizeBytes: number;
  uploadedBy: string;
  tenantId: string;
  createdAt: Date;
}

export class FileVersion {
  private readonly _id: string;
  private readonly props: FileVersionProps;

  constructor(props: FileVersionProps, id?: string) {
    this._id = id ?? uuidv4();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  get fileMetadataId(): string {
    return this.props.fileMetadataId;
  }

  get version(): number {
    return this.props.version;
  }

  get storagePath(): string {
    return this.props.storagePath;
  }

  get storageBucket(): string {
    return this.props.storageBucket;
  }

  get sizeBytes(): number {
    return this.props.sizeBytes;
  }

  get uploadedBy(): string {
    return this.props.uploadedBy;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(input: {
    fileMetadataId: string;
    version: number;
    storagePath: string;
    storageBucket: string;
    sizeBytes: number;
    uploadedBy: string;
    tenantId: string;
  }): FileVersion {
    return new FileVersion({
      ...input,
      createdAt: new Date(),
    });
  }

  static reconstitute(id: string, props: FileVersionProps): FileVersion {
    return new FileVersion(props, id);
  }
}
