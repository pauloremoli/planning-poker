import nodemailer from "nodemailer";

// async..await is not allowed in global scope, must use a wrapper
export async function sendEmail(to: string, text: string) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    console.log("sendEmail");
    try {
        // create reusable transporter object using the default SMTP transport

        let transporter = nodemailer.createTransport({
            host: "smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "36e88495ca268e",
                pass: "ee9aeff290994e"
            }
        });
        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Reddit change password mailer" <foo@example.com>', // sender address
            to: to, // list of receivers
            subject: "Change password", // Subject line
            html: text, // plain text body
        });

        console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (err) {
        console.error(err);
    }
}
