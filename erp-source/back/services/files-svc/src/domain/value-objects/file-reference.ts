export class FileReference {
  readonly bucket: string;
  readonly key: string;

  constructor(bucket: string, key: string) {
    if (!bucket || bucket.trim().length === 0) {
      throw new Error('FileReference bucket cannot be empty');
    }
    if (!key || key.trim().length === 0) {
      throw new Error('FileReference key cannot be empty');
    }
    this.bucket = bucket;
    this.key = key;
  }

  get fullPath(): string {
    return `${this.bucket}/${this.key}`;
  }

  equals(other: FileReference): boolean {
    return this.bucket === other.bucket && this.key === other.key;
  }

  toString(): string {
    return this.fullPath;
  }
}
