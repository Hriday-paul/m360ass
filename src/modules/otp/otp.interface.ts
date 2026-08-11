

export interface OtpRequest {
    id: number;
    code: string;
    expiredAt: Date;
    isVerified: boolean;
    type: "REGISTER" | "FORGOT_PASSWORD" | "CHANGE_EMAIL";
    attempts: number;
    maxAttempts: number;
    userId: number;
    verifiedAt?: Date;
    createdAt: Date;
}