export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DomainException';
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, 'ENTITY_NOT_FOUND');
    this.name = 'EntityNotFoundException';
  }
}

export class BusinessRuleViolation extends DomainException {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION');
    this.name = 'BusinessRuleViolation';
  }
}

export class DuplicateEntryException extends DomainException {
  constructor(field: string, value: string) {
    super(`Duplicate ${field}: ${value}`, 'DUPLICATE_ENTRY');
    this.name = 'DuplicateEntryException';
  }
}

export class FileAccessDeniedException extends DomainException {
  constructor(fileId: string, tenantId: string) {
    super(`Access denied to file ${fileId} for tenant ${tenantId}`, 'FILE_ACCESS_DENIED');
    this.name = 'FileAccessDeniedException';
  }
}

export class FileTooLargeException extends DomainException {
  constructor(sizeBytes: number, maxBytes: number) {
    super(
      `File size ${sizeBytes} exceeds maximum allowed ${maxBytes}`,
      'FILE_TOO_LARGE',
    );
    this.name = 'FileTooLargeException';
  }
}

export class UnsupportedMimeTypeException extends DomainException {
  constructor(mimeType: string) {
    super(`MIME type not supported: ${mimeType}`, 'UNSUPPORTED_MIME_TYPE');
    this.name = 'UnsupportedMimeTypeException';
  }
}

export class StorageException extends DomainException {
  constructor(message: string) {
    super(message, 'STORAGE_ERROR');
    this.name = 'StorageException';
  }
}

export class VirusScanFailedException extends DomainException {
  constructor(fileName: string) {
    super(`Virus scan failed for file: ${fileName}`, 'VIRUS_SCAN_FAILED');
    this.name = 'VirusScanFailedException';
  }
}
