import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IntegrationLogRepository } from '../../../domain/repositories/integration-log.repository';
import { IntegrationLog, IntegrationLogProps } from '../../../domain/entities/integration-log.entity';
import { IntegrationStatus } from '../../../domain/value-objects/integration-status.vo';
import { IntegrationLogModel, IntegrationLogDocument } from '../schemas/integration-log.schema';

@Injectable()
export class MongoIntegrationLogRepository implements IntegrationLogRepository {
  constructor(
    @InjectModel(IntegrationLogModel.name) private readonly model: Model<IntegrationLogDocument>,
  ) {}

  async save(log: IntegrationLog): Promise<void> {
    await this.model.findOneAndUpdate(
      { _id: log.id },
      {
        _id: log.id,
        tenantId: log.tenantId,
        subscriptionId: log.subscriptionId,
        eventType: log.eventType,
        direction: log.direction,
        url: log.url,
        method: log.method,
        requestHeaders: log.requestHeaders,
        requestBody: log.requestBody,
        responseStatus: log.responseStatus,
        responseHeaders: log.responseHeaders,
        responseBody: log.responseBody,
        status: log.status,
        durationMs: log.durationMs,
        attempt: log.attempt,
        errorMessage: log.errorMessage,
      },
      { upsert: true, new: true },
    );
  }

  async findById(id: string, tenantId: string): Promise<IntegrationLog | null> {
    const doc = await this.model.findOne({ _id: id, tenantId }).lean().exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByTenant(
    tenantId: string,
    options?: {
      limit?: number;
      offset?: number;
      subscriptionId?: string;
      eventType?: string;
      status?: string;
      direction?: string;
    },
  ): Promise<IntegrationLog[]> {
    const filter: Record<string, unknown> = { tenantId };
    if (options?.subscriptionId) filter.subscriptionId = options.subscriptionId;
    if (options?.eventType) filter.eventType = options.eventType;
    if (options?.status) filter.status = options.status;
    if (options?.direction) filter.direction = options.direction;

    const docs = await this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50)
      .lean()
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  async findFailedBySubscription(subscriptionId: string, tenantId: string): Promise<IntegrationLog[]> {
    const docs = await this.model
      .find({
        tenantId,
        subscriptionId,
        status: IntegrationStatus.FAILED,
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  async countByTenant(
    tenantId: string,
    filters?: { subscriptionId?: string; eventType?: string; status?: string },
  ): Promise<number> {
    const filter: Record<string, unknown> = { tenantId };
    if (filters?.subscriptionId) filter.subscriptionId = filters.subscriptionId;
    if (filters?.eventType) filter.eventType = filters.eventType;
    if (filters?.status) filter.status = filters.status;

    return this.model.countDocuments(filter).exec();
  }

  private toDomain(doc: Record<string, any>): IntegrationLog {
    return IntegrationLog.reconstitute(
      {
        tenantId: doc.tenantId,
        subscriptionId: doc.subscriptionId,
        eventType: doc.eventType,
        direction: doc.direction,
        url: doc.url,
        method: doc.method,
        requestHeaders: doc.requestHeaders,
        requestBody: doc.requestBody,
        responseStatus: doc.responseStatus,
        responseHeaders: doc.responseHeaders,
        responseBody: doc.responseBody,
        status: doc.status as IntegrationStatus,
        durationMs: doc.durationMs,
        attempt: doc.attempt || 1,
        errorMessage: doc.errorMessage,
        createdAt: doc.createdAt,
      },
      doc._id.toString(),
    );
  }
}
