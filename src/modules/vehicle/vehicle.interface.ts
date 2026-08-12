export interface VehiclePhoto {
    id: number;
    base_url: string
    path: string;
    vehicle_id: number;
    created_at: Date;
    updated_at: Date;
}

export interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    category: VehicleCategory;
    daily_rate: number;
    isDeleted: boolean;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

enum VehicleCategory {
    CAR = "car",
    TRUCK = "truck",
    BUS = "bus",
    MOTORCYCLE = "motorcycle",
}
    