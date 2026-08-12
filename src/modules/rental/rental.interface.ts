
export interface Rental {
    id: number;
    vehicle_id: number;
    customer_name: string;
    customer_phone: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    status: RentalStatus;
    created_at?: Date;
    updated_at?: Date;
}

export enum RentalStatus {
    BOOKED = "booked",
    ONGOING = "ongoing",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}