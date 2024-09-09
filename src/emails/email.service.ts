import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { readFileSync } from "fs";

class EmailService {

    private static transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        secure: process.env.NODE_ENV === 'PRODUCTION' ? true : false,
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASS
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
        const mailOptions: Mail.Options = {
            from: process.env.EMAIL_ADDRESS,
            to,
            subject: 'Email Verification',
            html: EmailService.parseMailFile(readFileSync(`${__dirname}/templates/verification_email.html`).toString(), fullname, vToken)
        }

        try {
            await EmailService.transporter.sendMail(mailOptions);
            console.log('Verification mail sent successfully');
        } catch (error) {
            console.log((error as Error).name, 'error_name');
            throw error;
        }

    }

    static async sendPasswordResetToken(to: string, username: string, resetPasswordToken: string) {
        const mailOptions: Mail.Options = {
            from: process.env.EMAIL_ADDRESS,
            to,
            subject: 'Reset Password',
            html: EmailService.parseMailFile(readFileSync(`${__dirname}/templates/password_reset.html`).toString(), username, resetPasswordToken)
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
