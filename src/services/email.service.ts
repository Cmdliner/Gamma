import { readFileSync } from "fs";
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import path from "path";
import { cfg } from "../init";
import type ITransaction from "../types/transaction.schema";

type EmailKind = "verification" | "pwd_reset" | "funds_release" | "payment_refund" | "ads_receipt";


class EmailService {

    private static readonly emailTemplate = {
        verification: {
            subject: "Email Verification",
            html: path.resolve(__dirname, "../../templates/verification_email.html"),
        },
        pwd_reset: {
            subject: "Account Password Reset",
            html: path.resolve(__dirname, "../../templates/password_reset.html"),
        },
        funds_release: {
            subject: "Verification of Release of Funds to Seller",
            html: path.resolve(__dirname, "../../templates/release_funds.html"),
        },
        payment_refund: {
            subject: "Notification of Refund",
            html: path.resolve(__dirname, "../../templates/payment_refund.html")
        },
        ads_receipt: {
            subject: "Payment receipt",
            html: path.resolve(__dirname, "../../templates/ad_receipt.html")
        }
    };

    private static readonly transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        service: cfg.APP_EMAIL_SERVICE,
        secure: cfg.NODE_ENV === "production" ? true : false,
        auth: {
            user: cfg.APP_EMAIL_ADDRESS,
            pass: cfg.APP_EMAIL_PASS,
        },
    });

    private static parseMailFile(file: string, fullname: string, code: string | null, tx?: ITransaction) {
        return file.split(" ").map((token) => String(token)
            .replace("${fullname}", fullname)
            .replace("${otp}", code)
            .replace("${tx_id}", tx?.id)
            .replace("${tx_amount}", `${tx?.amount}`)
            .replace("${current_year}", `${new Date().getFullYear()}`)
        ).join(" ");
    }

    static async sendMail(
        to: string,
        fullname: string,
        kind: EmailKind,
        otp: string | null,
        tx?: ITransaction) {
        const mailOptions: Mail.Options = {
            from: ' "Gamma" <escrow@gamma.com.ng>',
            to,
            subject: this.emailTemplate[kind].subject,
            html: this.parseMailFile(
                readFileSync(EmailService.emailTemplate[kind].html).toString(),
                fullname,
                otp,
                tx
            ),
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`Email sent successfully`);
        } catch (error) {
            console.error((error as Error).name, "error_name");
            throw error;
        }
    }

}

export default EmailService;