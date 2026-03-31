import { Entity } from './base.entity';

export enum SocialProvider {
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
  MICROSOFT = 'MICROSOFT',
  APPLE = 'APPLE',
}

export class SocialAccount extends Entity {
  userId: string;
  provider: SocialProvider;
  providerAccountId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;

  private constructor(
    tenantId: string,
    userId: string,
    provider: SocialProvider,
    providerAccountId: string,
    email: string,
    id?: string,
  ) {
    super(tenantId, id);
    this.userId = userId;
    this.provider = provider;
    this.providerAccountId = providerAccountId;
    this.email = email;
    this.displayName = null;
    this.avatarUrl = null;
  }

  static create(
    tenantId: string,
    userId: string,
    provider: SocialProvider,
    providerAccountId: string,
    email: string,
  ): SocialAccount {
    return new SocialAccount(tenantId, userId, provider, providerAccountId, email);
  }

  static reconstitute(props: {
    id: string;
    tenantId: string;
    userId: string;
    provider: SocialProvider;
    providerAccountId: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): SocialAccount {
    const acc = new SocialAccount(
      props.tenantId,
      props.userId,
      props.provider,
      props.providerAccountId,
      props.email,
      props.id,
    );
    acc.displayName = props.displayName;
    acc.avatarUrl = props.avatarUrl;
    (acc as any).createdAt = props.createdAt;
    acc.updatedAt = props.updatedAt;
    return acc;
  }
}
