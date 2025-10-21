export interface User {
    id: number;
    email: string;
    password: string;
    created_at: string;
}
export interface CreateUserData {
    email: string;
    password: string;
}
export declare class UserModel {
    static create(userData: CreateUserData): Promise<User>;
    static findByEmail(email: string): Promise<User | null>;
    static findById(id: number): Promise<User>;
    static emailExists(email: string): Promise<boolean>;
}
//# sourceMappingURL=User.d.ts.map