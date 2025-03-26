import nodemailer from 'nodemailer';
import dotenv from "dotenv";
import { logger } from './logger';
dotenv.config();

export const sendMail = async (from: string, to: string, subject: string, text: string | null, html: string | null = null) => {
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD
        }
    });

    if(text === null && html === null) {
        throw new Error('Text and html cannot be null');
    }

    const mailOptions: { from: string; to: string; subject: string; text?: string; html?: string } = {
        from: from,
        to: to,
        subject: subject
    };
    if (text) {
        mailOptions.text = text;
    }
    if (html) {
        mailOptions.html = html;
    }

    logger.info(`Sending mail to - ${to}`);
    transporter.sendMail(mailOptions, (error, info)=> {
        if (error) {
            logger.error(error);
        } else {
            logger.info('Email sent: ' + info.response);
        }
    });
}