import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerProps } from '../../../domain/entities/customer.entity';
import { CustomerRepository } from '../../../domain/repositories/customer.repository';
import { CustomerOrmEntity } from '../entities/customer.orm-entity';

@Injectable()
export class PostgresCustomerRepository implements CustomerRepository {
  constructor(
    @InjectRepository(CustomerOrmEntity)
    private readonly repo: Repository<CustomerOrmEntity>,
  ) {}

  async findById(id: string, tenantId: string): Promise<Customer | null> {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByCustomerNumber(customerNumber: string, tenantId: string): Promise<Customer | null> {
    const row = await this.repo.findOne({ where: { customerNumber, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string, tenantId: string): Promise<Customer | null> {
    const row = await this.repo.findOne({ where: { email, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(tenantId: string): Promise<Customer[]> {
    const rows = await this.repo.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findActive(tenantId: string): Promise<Customer[]> {
    const rows = await this.repo.find({
      where: { tenantId, isActive: true },
      order: { name: 'ASC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(customer: Customer): Promise<Customer> {
    const entity = this.toOrm(customer);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async existsByEmail(email: string, tenantId: string): Promise<boolean> {
    const count = await this.repo.count({ where: { email, tenantId } });
    return count > 0;
  }

  async nextCustomerNumber(tenantId: string): Promise<string> {
    const result = await this.repo
      .createQueryBuilder('c')
      .select('COUNT(*)', 'count')
      .where('c.tenant_id = :tenantId', { tenantId })
      .getRawOne();
    const seq = parseInt(result.count, 10) + 1;
    return `CUST-${String(seq).padStart(6, '0')}`;
  }

  private toDomain(row: CustomerOrmEntity): Customer {
    const props: CustomerProps = {
      customerNumber: row.customerNumber,
      name: row.name,
      email: row.email,
      phone: row.phone,
      billingAddress: row.billingAddress,
      shippingAddress: row.shippingAddress,
      taxId: row.taxId,
      creditLimit: row.creditLimit,
      currency: row.currency,
      isActive: row.isActive,
      tenantId: row.tenantId,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return Customer.fromPersistence(props, row.id);
  }

  private toOrm(customer: Customer): CustomerOrmEntity {
    const entity = new CustomerOrmEntity();
    entity.id = customer.id;
    entity.customerNumber = customer.customerNumber;
    entity.name = customer.name;
    entity.email = customer.email;
    entity.phone = customer.phone;
    entity.billingAddress = customer.billingAddress;
    entity.shippingAddress = customer.shippingAddress;
    entity.taxId = customer.taxId;
    entity.creditLimit = customer.creditLimit;
    entity.currency = customer.currency;
    entity.isActive = customer.isActive;
    entity.tenantId = customer.tenantId;
    entity.createdBy = customer.createdBy;
    entity.createdAt = customer.createdAt;
    entity.updatedAt = customer.updatedAt;
    return entity;
  }
}
