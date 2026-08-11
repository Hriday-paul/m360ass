
export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: Role;
    created_at?: Date;
    updated_at?: Date;
    isVerified: boolean;
}

export enum Role {
    STAFF = 'staff',
    CUSTOMER = 'customer'
}