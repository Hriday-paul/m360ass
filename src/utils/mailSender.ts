import nodemailer from 'nodemailer';
import config from '../config';

export const sendEmail = async (to: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: config.nodemailer_host_email,
      pass: config.nodemailer_host_pass,
    },
  });

  const res = await transporter.sendMail({
    from: config.nodemailer_host_email, // sender address
    to, // list of receivers
    subject,
    text: '', // plain text body
    html, // html body
  });

  return res;

};


