import { randomUUID } from 'crypto';

export enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export class Organization {
  readonly id: string;
  name: string;
  slug: string;
  description: string;
  status: OrganizationStatus;
  ownerId: string; // user who created it
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  customCss: string;
  settings: Record<string, any>;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(
    id: string,
    name: string,
    slug: string,
    description: string,
    ownerId: string,
  ) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.description = description;
    this.ownerId = ownerId;
    this.status = OrganizationStatus.ACTIVE;
    this.primaryColor = '#2563eb';
    this.secondaryColor = '#1e40af';
    this.accentColor = '#3b82f6';
    this.logoUrl = '';
    this.faviconUrl = '';
    this.customCss = '';
    this.settings = {};
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static create(name: string, slug: string, description: string, ownerId: string): Organization {
    return new Organization(randomUUID(), name, slug, description, ownerId);
  }

  static reconstitute(props: {
    id: string;
    name: string;
    slug: string;
    description: string;
    status: OrganizationStatus;
    ownerId: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl: string;
    faviconUrl: string;
    customCss: string;
    settings: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  }): Organization {
    const org = new Organization(props.id, props.name, props.slug, props.description, props.ownerId);
    org.status = props.status;
    org.primaryColor = props.primaryColor;
    org.secondaryColor = props.secondaryColor;
    org.accentColor = props.accentColor;
    org.logoUrl = props.logoUrl;
    org.faviconUrl = props.faviconUrl;
    org.customCss = props.customCss;
    org.settings = props.settings;
    (org as any).createdAt = props.createdAt;
    org.updatedAt = props.updatedAt;
    return org;
  }

  update(name: string, description: string): void {
    this.name = name;
    this.description = description;
    this.updatedAt = new Date();
  }

  updateBranding(data: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
    customCss?: string;
  }): void {
    if (data.primaryColor !== undefined) this.primaryColor = data.primaryColor;
    if (data.secondaryColor !== undefined) this.secondaryColor = data.secondaryColor;
    if (data.accentColor !== undefined) this.accentColor = data.accentColor;
    if (data.logoUrl !== undefined) this.logoUrl = data.logoUrl;
    if (data.faviconUrl !== undefined) this.faviconUrl = data.faviconUrl;
    if (data.customCss !== undefined) this.customCss = data.customCss;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.status = OrganizationStatus.INACTIVE;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.status = OrganizationStatus.ACTIVE;
    this.updatedAt = new Date();
  }
}
