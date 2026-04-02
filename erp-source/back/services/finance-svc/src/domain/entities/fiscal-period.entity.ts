import { v4 as uuidv4 } from 'uuid';

export enum FiscalPeriodStatus {
    OPEN = 'OPEN',
    SOFT_CLOSED = 'SOFT_CLOSED',
    HARD_CLOSED = 'HARD_CLOSED',
}

export interface FiscalPeriodProps {
    name: string;
    startDate: Date;
    endDate: Date;
    status: FiscalPeriodStatus;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}

export class FiscalPeriod {
    readonly id: string;
    private props: FiscalPeriodProps;

    private constructor(props: FiscalPeriodProps, id: string) {
        this.id = id;
        this.props = props;
    }

    static create(
        params: {
            name: string;
            startDate: Date;
            endDate: Date;
            tenantId: string;
        },
        id?: string,
    ): FiscalPeriod {
        return new FiscalPeriod(
            {
                ...params,
                status: FiscalPeriodStatus.OPEN,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            id ?? uuidv4(),
        );
    }

    static fromPersistence(props: FiscalPeriodProps, id: string): FiscalPeriod {
        return new FiscalPeriod(props, id);
    }

    get name(): string { return this.props.name; }
    get startDate(): Date { return this.props.startDate; }
    get endDate(): Date { return this.props.endDate; }
    get status(): FiscalPeriodStatus { return this.props.status; }
    get tenantId(): string { return this.props.tenantId; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }

    close(type: 'soft' | 'hard'): void {
        this.props.status = type === 'hard' ? FiscalPeriodStatus.HARD_CLOSED : FiscalPeriodStatus.SOFT_CLOSED;
        this.props.updatedAt = new Date();
    }
}
