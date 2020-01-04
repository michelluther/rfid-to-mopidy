const nodemailer = require('nodemailer')
const config = require('./config') 

const sendMessage = async (toAddress, subject, text) => {
    let transporter = nodemailer.createTransport({
        host: config.email.smtpHost,
        port: config.email.smtpPort,
        secure: false, // true for 465, false for other ports
        auth: {
          user: config.email.fromAddress, // generated ethereal user
          pass: config.email.smtpPassword // generated ethereal password
        }
      });
      await transporter.sendMail({
        from: `"Admin Wohnzimmermusik" <${config.email.fromAddress}>`, // sender address
        to: toAddress, // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
        html: `<p>${text}</p>` // html body
      });
    
} 

module.exports = {sendMessage: sendMessage}