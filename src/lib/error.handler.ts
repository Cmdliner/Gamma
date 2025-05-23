import { StatusCodes } from "http-status-codes"

type AppErrorResponse = {
    error: true;
    reason?: string;
    message: string;
}

export class AppError {
    name = "APP_ERROR";
    message: string;
    status: StatusCodes;
    reason: string;

    constructor(err_status: StatusCodes, message: string, reason?: string) {
        this.message = message;
        this.status = err_status;
        if (reason) this.reason = reason;
    }

    static handle(error: any, default_message: string) {
        let status: StatusCodes = error.status || StatusCodes.INTERNAL_SERVER_ERROR;
        const errResponse: AppErrorResponse = { error: true, message: default_message };

        if (error.name === "APP_ERROR") {
            errResponse.message = error.message;
            if (error.reason) errResponse.reason = error.reason;
        }

        return [status, errResponse] as const;

    }
}