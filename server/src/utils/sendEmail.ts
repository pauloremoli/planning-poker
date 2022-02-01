import nodemailer from "nodemailer";
require("dotenv-safe").config();


export async function sendEmail(to: string, text: string) {
    try {
        // create reusable transporter object using the default SMTP transport

        let transporter = nodemailer.createTransport({
            host: "smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Change password" <no-response@sonhoencantado.com.br>', // sender address
            to: to, // list of receivers
            subject: "Change password", // Subject line
            html: text, // plain text body
        });

    } catch (err) {
        console.error(err);
    }
}
