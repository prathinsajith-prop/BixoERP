import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export class HashedPassword {
  private constructor(public readonly hash: string) {}

  static async fromPlaintext(plaintext: string): Promise<HashedPassword> {
    if (plaintext.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    if (plaintext.length > 128) {
      throw new Error('Password must not exceed 128 characters');
    }
    const hash = await bcrypt.hash(plaintext, SALT_ROUNDS);
    return new HashedPassword(hash);
  }

  static fromHash(hash: string): HashedPassword {
    return new HashedPassword(hash);
  }

  async verify(plaintext: string): Promise<boolean> {
    return bcrypt.compare(plaintext, this.hash);
  }
}
