import { readFileSync } from "fs";
import { config as envConfig } from "dotenv";
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import path from "path";
import { cfg } from "../init";

envConfig();

class EmailService {

    private static transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        service: cfg.APP_EMAIL_SERVICE,
        secure: cfg.NODE_ENV === 'production' ? true : false,
        auth: {
            user: cfg.APP_EMAIL_ADDRESS,
            pass: cfg.APP_EMAIL_PASS
        }
    });

    private static parseMailFile(file: string, fullname: string, code: string) {
        return file.split(' ').map((token) => String(token)
            .replace('${fullname}', fullname)
            .replace('${vToken}', code)
            .replace('${passwordResetToken}', code)
        ).join(' ');
    }

    static async sendVerificationEmail(to: string, fullname: string, vToken: string) {
        const pathToEmail = path.resolve(__dirname, "../../templates/verification_email.html")
        const mailOptions: Mail.Options = {
            from: cfg.APP_EMAIL_ADDRESS,
            to,
            subject: 'Email Verification',
            html: EmailService.parseMailFile(readFileSync(pathToEmail).toString(), fullname, vToken)
        }

        try {
            await EmailService.transporter.sendMail(mailOptions);
            console.log('Verification mail sent successfully');
        } catch (error) {
            console.error((error as Error).name, 'error_name');
            throw error;
        }

    }

    static async sendPasswordResetToken(to: string, username: string, resetPasswordToken: string) {
        const pathToEmail = path.resolve(__dirname, "../../templates/password_reset.html")
        const mailOptions: Mail.Options = {
            from: cfg.APP_EMAIL_ADDRESS,
            to,
            subject: 'Reset Password',
            html: EmailService.parseMailFile(readFileSync(pathToEmail).toString(), username, resetPasswordToken)
        }

        try {
            await EmailService.transporter.sendMail(mailOptions);
            console.log('Reset Password mail sent successfully');
        } catch (error) {
            throw error;
        }

    }
}

export default EmailService;