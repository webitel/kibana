/**
 * Created by igor on 12.12.16.
 */

"use strict";

import nodemailer from 'nodemailer';
import smtpPool from 'nodemailer-smtp-pool';

export function sendMail(emailConfig, job, attachments, cb) {
  const transporter = nodemailer.createTransport(smtpPool(emailConfig));
  const mailOption = {
    from: emailConfig.from || "bot",
    to: job.data.emails,
    subject: job.data.subject || "",
    text: job.data.text || "",
    attachments: attachments
  };

  // console.log(attachments);
  // cb()
  transporter.sendMail(
    mailOption,
    cb
  );
}
