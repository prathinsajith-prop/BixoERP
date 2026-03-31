import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import {
  SearchPort,
  OrderSearchDocument,
  OrderSearchResult,
} from '../../application/ports/search.port';

const INDEX_NAME = 'sales_orders';

@Injectable()
export class ElasticsearchSalesSearch implements SearchPort, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ElasticsearchSalesSearch.name);
  private client!: Client;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.client = new Client({
      node: this.config.get<string>('elasticsearch.url'),
    });

    // Create index if it doesn't exist
    const exists = await this.client.indices.exists({ index: INDEX_NAME });
    if (!exists) {
      await this.client.indices.create({
        index: INDEX_NAME,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                order_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'asciifolding'],
                },
              },
            },
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              orderNumber: { type: 'keyword' },
              customerId: { type: 'keyword' },
              customerName: {
                type: 'text',
                analyzer: 'order_analyzer',
                fields: { keyword: { type: 'keyword' } },
              },
              status: { type: 'keyword' },
              totalAmount: { type: 'keyword' },
              currency: { type: 'keyword' },
              lines: {
                type: 'nested',
                properties: {
                  productId: { type: 'keyword' },
                  productName: {
                    type: 'text',
                    analyzer: 'order_analyzer',
                  },
                  quantity: { type: 'integer' },
                },
              },
              tenantId: { type: 'keyword' },
              confirmedAt: { type: 'date' },
              createdAt: { type: 'date' },
            },
          },
        },
      });
      this.logger.log(`Created Elasticsearch index: ${INDEX_NAME}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }

  async indexOrder(order: OrderSearchDocument): Promise<void> {
    await this.client.index({
      index: INDEX_NAME,
      id: order.id,
      document: order,
      refresh: 'wait_for',
    });
  }

  async searchOrders(query: string, tenantId: string): Promise<OrderSearchResult[]> {
    const result = await this.client.search({
      index: INDEX_NAME,
      body: {
        query: {
          bool: {
            must: [
              {
                bool: {
                  should: [
                    { match: { orderNumber: { query, boost: 3 } } },
                    { match: { customerName: { query, boost: 2 } } },
                    {
                      nested: {
                        path: 'lines',
                        query: {
                          match: { 'lines.productName': query },
                        },
                      },
                    },
                  ],
                  minimum_should_match: 1,
                },
              },
            ],
            filter: [{ term: { tenantId } }],
          },
        },
        size: 50,
      },
    });

    return result.hits.hits.map((hit: any) => ({
      id: hit._source.id,
      orderNumber: hit._source.orderNumber,
      customerName: hit._source.customerName,
      status: hit._source.status,
      totalAmount: hit._source.totalAmount,
      currency: hit._source.currency,
      score: hit._score ?? 0,
    }));
  }

  async removeOrder(orderId: string, _tenantId: string): Promise<void> {
    await this.client.delete({
      index: INDEX_NAME,
      id: orderId,
      refresh: 'wait_for',
    }).catch(() => {
      // Ignore if document not found
    });
  }
}
