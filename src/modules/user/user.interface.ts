
export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    role: "staff" | "customer";
    created_at?: Date;
    updated_at?: Date;
    isVerified: boolean;
}