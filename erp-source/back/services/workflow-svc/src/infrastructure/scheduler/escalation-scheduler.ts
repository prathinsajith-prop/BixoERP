import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EscalateRequestUseCase } from '../../application/use-cases/escalate-request.use-case';

@Injectable()
export class EscalationScheduler {
  private readonly logger = new Logger(EscalationScheduler.name);

  constructor(private readonly escalateUseCase: EscalateRequestUseCase) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkForOverdueApprovals(): Promise<void> {
    try {
      const escalated = await this.escalateUseCase.autoEscalateOverdue();
      if (escalated > 0) {
        this.logger.log(`Auto-escalated ${escalated} overdue approval requests`);
      }
    } catch (error) {
      this.logger.error(`Escalation scheduler error: ${error}`);
    }
  }
}
