export interface Admin {
    email: string;
    password: string;
    role: "super_admin" | "regular_admin";
}