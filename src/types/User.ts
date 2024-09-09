export interface IRegisterUser {
    firstname: string;
    lastname: string;
    email: string;
    dob: Date | string;
    gender: string;
    referral_code?: string;
    state_of_origin: string;
}

