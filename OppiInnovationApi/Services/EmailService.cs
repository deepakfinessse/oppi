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
            mail.Subject = "Registration Confirmation - OPPI Excellence in Innovation Award 2026";
            
            mail.Body = $@"Dear {recipientName},

Thank you for registering for the OPPI Excellence in Innovation Award for Healthcare Start-up of the year 2026.

To proceed with your application, please log in to the awards portal using your credentials:
http://innovationawards.indiaoppi.com/ 

For any technical assistance or queries related to the application process, please contact Ms. Clara Rodricks at clara.rodricks@indiaoppi.com or call +91 96190 80644.

We look forward to receiving your application.

Warm regards,
Team - OPPI Awards";

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

    public async Task SendForgotPasswordEmailAsync(string recipientEmail, string recipientName, string resetLink)
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
            mail.Subject = "Reset Password";
            
            mail.Body = $@"Dear {recipientName},

Your password reset request has been received successfully.

To reset your password, please click the link below:
{resetLink}

For any technical assistance or queries related to the application process, please contact Ms. Clara Rodricks at clara.rodricks@indiaoppi.com or call +91 96190 80644.

Warm regards,
Team - OPPI Awards";

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

    public async Task SendApplicationSubmissionEmailAsync(string recipientEmail, string recipientName, int applicationId)
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
            mail.Subject = "Application Submission - OPPI Excellence in Innovation Award 2026";
            
            mail.Body = $@"Dear {recipientName},

Thank you for submitting your application for the OPPI Excellence in Innovation Award for Healthcare Start-up of the year 2026.

Please note your application no. for future correspondence - {applicationId}

Your application will be reviewed by our validator and, upon successful validation, forwarded to the Jury for evaluation.

In the event that your application is not shortlisted, you will be notified via email.

We appreciate your participation and wish you the very best in the evaluation process.

Warm regards,
Team - OPPI Awards";

            mail.IsBodyHtml = false;

            using var smtp = new SmtpClient(host, port);
            smtp.Credentials = new NetworkCredential(username, password);
            smtp.EnableSsl = enableSsl;

            _logger.LogInformation("Sending application submission email to {Email}...", recipientEmail);
            await smtp.SendMailAsync(mail);
            _logger.LogInformation("Application submission email sent successfully to {Email}.", recipientEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send application submission email to {Email}.", recipientEmail);
        }
    }
}
