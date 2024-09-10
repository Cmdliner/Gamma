export interface IRegisterUser {
    firstname: string;
    lastname: string;
    email: string;
    dob: Date | string;
    gender: string;
    referral_code?: string;
    state_of_origin: string;
    phone_no_1: string;
    phone_no_2: string;
}

