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

    public async Task SendForgotPasswordEmailAsync(string recipientEmail, string recipientName, string tempPassword)
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
            mail.Subject = "Password Reset - OPPI Excellence in Innovation Award 2025";
            
            mail.Body = $@"Dear {recipientName},

We received a request to reset the password for your account on the OPPI Excellence in Innovation Award portal.

Your temporary password is: {tempPassword}

Please log in to the portal using this password and immediately change your password by going to the Change Password section.

Portal URL: http://innovationawards.indiaoppi.com/

If you did not request this password reset, please ignore this email or contact support if you have concerns.

Regards,
OPPI Excellence in Innovation Award Team";

            mail.IsBodyHtml = false;

            using var smtp = new SmtpClient(host, port);
            smtp.Credentials = new NetworkCredential(username, password);
            smtp.EnableSsl = enableSsl;

            _logger.LogInformation("Sending forgot password email to {Email}...", recipientEmail);
            await smtp.SendMailAsync(mail);
            _logger.LogInformation("Forgot password email sent successfully to {Email}.", recipientEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send forgot password email to {Email}.", recipientEmail);
        }
    }

    public async Task SendJuryInvitationEmailAsync(string recipientEmail, string recipientName, string roleType, string password, bool isNewUser)
    {
        try
        {
            var smtpSection = _config.GetSection("SmtpSettings");
            var host = smtpSection["Server"] ?? "smtp.gmail.com";
            var portStr = smtpSection["Port"] ?? "587";
            var enableSslStr = smtpSection["EnableSsl"] ?? "true";
            var username = smtpSection["Username"] ?? "smtpindiaoppi@gmail.com";
            var passwordSmtp = smtpSection["Password"] ?? "jafkaniynuahfkbe";
            var senderEmail = smtpSection["SenderEmail"] ?? "smtpindiaoppi@gmail.com";
            var senderName = smtpSection["SenderName"] ?? "OPPI Excellence in Innovation Award";

            int port = int.TryParse(portStr, out var p) ? p : 587;
            bool enableSsl = !bool.TryParse(enableSslStr, out var ssl) || ssl;

            using var mail = new MailMessage();
            mail.From = new MailAddress(senderEmail, senderName);
            mail.To.Add(new MailAddress(recipientEmail, recipientName));
            mail.Subject = $"Invitation to join as {roleType} - OPPI Excellence in Innovation Award 2025";
            
            string bodyText = "";
            if (isNewUser)
            {
                bodyText = $@"Dear {recipientName},

You have been registered as a {roleType} on the OPPI Excellence in Innovation Award 2025 portal.

Please find your login credentials below:
Portal URL: http://innovationawards.indiaoppi.com/
Email: {recipientEmail}
Password: {password}

We recommend logging in and changing your password via the portal menu.

Regards,
OPPI Excellence in Innovation Award Team";
            }
            else
            {
                bodyText = $@"Dear {recipientName},

Your account has been updated with the {roleType} role on the OPPI Excellence in Innovation Award 2025 portal.

Please find your login details below:
Portal URL: http://innovationawards.indiaoppi.com/
Email: {recipientEmail}
{(string.IsNullOrWhiteSpace(password) ? "You can login using your existing password." : $"Your password has been updated to: {password}")}

Regards,
OPPI Excellence in Innovation Award Team";
            }

            mail.Body = bodyText;
            mail.IsBodyHtml = false;

            using var smtp = new SmtpClient(host, port);
            smtp.Credentials = new NetworkCredential(username, passwordSmtp);
            smtp.EnableSsl = enableSsl;

            _logger.LogInformation("Sending jury/validator invitation email to {Email}...", recipientEmail);
            await smtp.SendMailAsync(mail);
            _logger.LogInformation("Jury/validator invitation email sent successfully to {Email}.", recipientEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send jury/validator invitation email to {Email}.", recipientEmail);
        }
    }
}
