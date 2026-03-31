import { SocialAccount, SocialProvider } from '../entity/social-account.entity';

export const SOCIAL_ACCOUNT_REPOSITORY = Symbol('SOCIAL_ACCOUNT_REPOSITORY');

export interface SocialAccountRepository {
  findByProviderAndAccountId(
    tenantId: string,
    provider: SocialProvider,
    providerAccountId: string,
  ): Promise<SocialAccount | null>;
  findByUserId(tenantId: string, userId: string): Promise<SocialAccount[]>;
  save(account: SocialAccount): Promise<void>;
  delete(tenantId: string, userId: string, provider: SocialProvider): Promise<void>;
}
