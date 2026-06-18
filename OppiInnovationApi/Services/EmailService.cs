using System.Net;
using System.Net.Mail;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace OppiInnovationApi.Services;

public class EmailService
{
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, IWebHostEnvironment env, ILogger<EmailService> logger)
    {
        _config = config;
        _env = env;
        _logger = logger;
    }

    public async Task SendRegistrationEmailAsync(string recipientEmail, string recipientName)
    {
        try
        {
            var smtpSection = _config.GetSection("SmtpSettings");
            var host = smtpSection["Server"] ?? "smtp.gmail.com";
            var portStr = smtpSection["Port"] ?? "587";
            var enableSslStr = smtpSection["EnableSsl"] ?? "true";
            var username = smtpSection["Username"] ?? "smtpindiaoppi@gmail.com";
            var password = smtpSection["Password"] ?? "jafkaniynuahfkbe";
            var senderEmail = smtpSection["SenderEmail"] ?? "smtpindiaoppi@gmail.com";
            var senderName = smtpSection["SenderName"] ?? "OPPI Excellence in Innovation Award";

            int port = int.TryParse(portStr, out var p) ? p : 587;
            bool enableSsl = !bool.TryParse(enableSslStr, out var ssl) || ssl;

            using var mail = new MailMessage();
            mail.From = new MailAddress(senderEmail, senderName);
            mail.To.Add(new MailAddress(recipientEmail, recipientName));
            mail.Subject = "Registration Confirmation - OPPI Excellence in Innovation Award 2025";
            
            mail.Body = $@"Dear {recipientName},

We have received your registration for the OPPI Excellence in Innovation Award for Healthcare Start-up of the year 2025.

For your easy reference, I’ve attached a blank application form in Word format. You may find it helpful to fill in all the required details in this document beforehand and keep it handy while uploading files and completing the online application.

This approach can help prevent any loss of data during the uploading process and ensure a smoother submission experience.

Please note, final submission must be done online.

To proceed with your application, please login here: http://innovationawards.indiaoppi.com/ 

The last date for submission is 22nd August 2025. We look forward to your submission. 

In case of any query, please feel free to reach out to me.";

            mail.IsBodyHtml = false;

            // Attach the blank application form Word file
            var attachmentPath = Path.Combine(_env.WebRootPath, "templates", "Blank_Application_Form.doc");
            if (File.Exists(attachmentPath))
            {
                mail.Attachments.Add(new Attachment(attachmentPath));
            }
            else
            {
                _logger.LogWarning("Blank application form attachment not found at path: {Path}", attachmentPath);
            }

            using var smtp = new SmtpClient(host, port);
            smtp.Credentials = new NetworkCredential(username, password);
            smtp.EnableSsl = enableSsl;

            _logger.LogInformation("Sending registration email to {Email} using SMTP host {Host}:{Port}...", recipientEmail, host, port);
            await smtp.SendMailAsync(mail);
            _logger.LogInformation("Registration email sent successfully to {Email}.", recipientEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send registration email to {Email}.", recipientEmail);
        }
    }
}
