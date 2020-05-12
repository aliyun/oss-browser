angular.module("web").factory("Mailer", [
  "settingsSvs",
  function (settingsSvs) {
    var nodemailer = require("nodemailer");
    var smtpTransport = require("nodemailer-smtp-transport");

    return {
      send: function (info) {
        return new Promise((resolve, reject) => {
          var smtp = settingsSvs.mailSmtp.get();
          var opt = {
            from: smtp.from,
            to: info.to,
            subject: info.subject,
            html: info.html || info.content,
          };
          //console.log('sending..', smtp, opt);

          var transporter = nodemailer.createTransport(smtpTransport(smtp));
          transporter.sendMail(opt, function (err, info) {
            if (err) reject(err);
            else resolve(info);
          });
        });
      },
    };
  },
]);
