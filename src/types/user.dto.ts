export interface IRegisterUser {
    first_name: string;
    last_name: string;
    middle_name?: string;
    email: string;
    dob: Date | string;
    location: {
        human_readable: string;
        coordinates: [number, number];
        type: "Point";
    };
    gender: string;
    referral_code?: string;
    interested_categories: string[];
    state_of_origin: string;
    phone_no_1: string;
    phone_no_2: string;
}

