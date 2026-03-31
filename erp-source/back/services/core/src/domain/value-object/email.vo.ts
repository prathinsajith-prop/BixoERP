export class Email {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(public readonly value: string) {}

  static create(email: string): Email {
    const normalized = email.trim().toLowerCase();
    if (!Email.EMAIL_REGEX.test(normalized)) {
      throw new Error(`Invalid email format: ${email}`);
    }
    return new Email(normalized);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
