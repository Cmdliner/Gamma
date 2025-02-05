import { readFileSync } from "fs";
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import path from "path";
import { cfg } from "../init";
import ITransaction from "../types/transaction.schema";
import pdf from "pdf-creator-node";
import IUser from "../types/user.schema";
import { logger } from "../config/logger.config";
import { AppError } from "./error.handler";
import { StatusCodes } from "http-status-codes";


type EmailKind = "verification" | "pwd_reset" | "funds_release" | "payment_refund" | "ads_receipt";

type EmailWithAttachmentOpts = {
    kind: EmailKind;
    user: IUser;
    amount?: number;
    payment_date?: Date;
    item_name?: string;
    payment_method?: string;
    tx_id: string;
    destination: string;
    to: string;
}

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

    private static pdfOptions = {
        format: 'A4',
        orientation: 'portrait',
        border: '10mm',
        footer: {
            height: '10mm'
        }
    };

    static async sendMail(
        to: string,
        fullname: string,
        kind: EmailKind,
        otp: string | null,
        tx?: ITransaction) {
        const mailOptions: Mail.Options = {
            from: ' "Oyeah" <escrow@oyeah.com.ng>',
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

    static async sendMailWithAttachment(opts: EmailWithAttachmentOpts) {
        try {
            const document = {
                html: readFileSync(EmailService.emailTemplate[opts.kind].html, 'utf-8'),
                data: {
                    amount: opts.amount,
                    payment_date: opts.payment_date,
                    item_name: opts.item_name,
                    payment_method: opts.payment_method,
                    tx_id: opts.tx_id,
                    destination: opts.destination
                },
                path: `./receipts/receipt-${opts.tx_id}.pdf`
            };

            const pdfDoc = await pdf.create(document, this.pdfOptions);

            // Send email
            const mailOptions: Mail.Options = {
                from: ' "Oyeah" <escrow@oyeah.com.ng>',
                to: opts.to,
                subject: this.emailTemplate[opts.kind].subject,
                text: "Please find attached your email receipt",
                attachments: [{
                    filename: 'payment-receipt.pdf',
                    path: pdfDoc.filename
                }]
            };
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            logger.error(error);
            throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Error sending email");
        }
    }
}

export default EmailService;