using System.Net;
using System.Net.Mail;
using System.Text;
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

    private void PopulateEmailHtmlBody(MailMessage mail, string bodyContent)
    {
        // 1. Capture the plain text body from the main message body
        string plainText = mail.Body;

        // 2. Clear main message body & IsBodyHtml to avoid multipart conflicts
        mail.Body = null;
        mail.IsBodyHtml = false;
        mail.AlternateViews.Clear();

        // 3. Add plain text alternate view if present
        if (!string.IsNullOrEmpty(plainText))
        {
            var plainView = AlternateView.CreateAlternateViewFromString(plainText, Encoding.UTF8, "text/plain");
            mail.AlternateViews.Add(plainView);
        }

        // 4. Build the HTML template
        string htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>OPPI Excellence in Innovation Award</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #f7f7f7; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;"">
    <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""background-color: #f7f7f7; padding: 20px 0;"">
        <tr>
            <td align=""center"">
                <!-- Main Container -->
                <table role=""presentation"" width=""600"" cellspacing=""0"" cellpadding=""0"" border=""0"" style=""background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); width: 600px; max-width: 600px;"">
                    <!-- Header -->
                    <tr>
                        <td align=""center"" style=""background-color: #ebf5f7; padding: 30px 20px; border-bottom: 1px solid #e1edf0;"">
                            <img src=""cid:logo@indiaoppi.com"" height=""65"" alt=""OPPI Logo"" style=""display: block; border: 0; outline: none; text-decoration: none;"" />
                        </td>
                    </tr>
                    <!-- Body Content -->
                    <tr>
                        <td style=""padding: 40px 40px 30px 40px; color: #222222; font-size: 15px; line-height: 1.6; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">
                            {bodyContent}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td align=""center"" style=""background: linear-gradient(90deg, #3dc5db, #2db4cc); background-color: #3dc5db; padding: 20px; color: #222222; font-size: 13px; font-weight: 500; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">
                            &copy; OPPI 2026. All rights reserved
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";

        // 5. Create HTML alternate view
        var htmlView = AlternateView.CreateAlternateViewFromString(htmlBody, Encoding.UTF8, "text/html");
        
        // 6. Embed the logo CID resource
        var logoPath = Path.Combine(_env.WebRootPath, "uploads", "Oppi-logo.png");
        if (File.Exists(logoPath))
        {
            var logoResource = new LinkedResource(logoPath)
            {
                ContentId = "logo@indiaoppi.com"
            };
            logoResource.ContentType.MediaType = "image/png";
            logoResource.ContentType.Name = Path.GetFileName(logoPath);
            logoResource.ContentDisposition.Inline = true;
            logoResource.ContentDisposition.DispositionType = "inline";
            htmlView.LinkedResources.Add(logoResource);
        }

        mail.AlternateViews.Add(htmlView);
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
            
            string plainTextBody = $@"Dear {recipientName},

Thank you for registering for the OPPI Excellence in Innovation Award for Healthcare Start-up of the year 2026.

To proceed with your application, please log in to the awards portal using your credentials:
http://innovationawards.indiaoppi.com/

For any technical assistance or queries related to the application process, please contact Ms. Clara Rodricks at clara.rodricks@indiaoppi.com or call +91 96190 80644.

We look forward to receiving your application.

Warm regards,
Team - OPPI Awards";

            mail.Body = plainTextBody;
            mail.IsBodyHtml = false;

            string htmlContent = $@"
<p style=""margin: 0 0 20px 0;"">Dear {recipientName},</p>
<p style=""margin: 0 0 20px 0;"">Thank you for registering for the <strong>OPPI Excellence in Innovation Award for Healthcare Start-up of the year 2026</strong>.</p>
<p style=""margin: 0 0 20px 0;"">To proceed with your application, please log in to the awards portal using your credentials:</p>
<p style=""margin: 0 0 25px 0; text-align: center;"">
    <a href=""http://innovationawards.indiaoppi.com/"" target=""_blank"" style=""display: inline-block; padding: 12px 28px; background-color: #165baf; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.15);"">Log in to Awards Portal</a>
</p>
<div style=""margin: 0 0 25px 0; font-size: 14px; color: #555555; border-left: 3px solid #2db4cc; padding-left: 12px; font-style: italic; line-height: 1.5;"">
    For any technical assistance or queries related to the application process, please contact Ms. Clara Rodricks at <a href=""mailto:clara.rodricks@indiaoppi.com"" style=""color: #165baf; text-decoration: underline;"">clara.rodricks@indiaoppi.com</a> or call <a href=""tel:+919619080644"" style=""color: #165baf; text-decoration: underline;"">+91 96190 80644</a>.
</div>
<p style=""margin: 0 0 30px 0;"">We look forward to receiving your application.</p>
<p style=""margin: 0; color: #666666;"">Warm regards,<br><strong style=""color: #222222;"">Team - OPPI Awards</strong></p>";

            PopulateEmailHtmlBody(mail, htmlContent);

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
            
            string plainTextBody = $@"Dear {recipientName},

Your password reset request has been received successfully.

To reset your password, please click the link below:
{resetLink}

For any technical assistance or queries related to the application process, please contact Ms. Clara Rodricks at clara.rodricks@indiaoppi.com or call +91 96190 80644.

Warm regards,
Team - OPPI Awards";

            mail.Body = plainTextBody;
            mail.IsBodyHtml = false;

            string htmlContent = $@"
<p style=""margin: 0 0 20px 0;"">Dear {recipientName},</p>
<p style=""margin: 0 0 20px 0;"">Your password reset request has been received successfully.</p>
<p style=""margin: 0 0 20px 0;"">To reset your password, please click the button below:</p>
<p style=""margin: 0 0 25px 0; text-align: center;"">
    <a href=""{resetLink}"" target=""_blank"" style=""display: inline-block; padding: 12px 28px; background-color: #165baf; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.15);"">Reset Password</a>
</p>
<div style=""margin: 0 0 25px 0; font-size: 14px; color: #555555; border-left: 3px solid #2db4cc; padding-left: 12px; font-style: italic; line-height: 1.5;"">
    For any technical assistance or queries related to the application process, please contact Ms. Clara Rodricks at <a href=""mailto:clara.rodricks@indiaoppi.com"" style=""color: #165baf; text-decoration: underline;"">clara.rodricks@indiaoppi.com</a> or call <a href=""tel:+919619080644"" style=""color: #165baf; text-decoration: underline;"">+91 96190 80644</a>.
</div>
<p style=""margin: 0; color: #666666;"">Warm regards,<br><strong style=""color: #222222;"">Team - OPPI Awards</strong></p>";

            PopulateEmailHtmlBody(mail, htmlContent);

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

            string htmlContent = "";
            if (isNewUser)
            {
                htmlContent = $@"
<p style=""margin: 0 0 20px 0;"">Dear {recipientName},</p>
<p style=""margin: 0 0 20px 0;"">You have been registered as a <strong>{roleType}</strong> on the OPPI Excellence in Innovation Award 2025 portal.</p>
<p style=""margin: 0 0 20px 0;"">Please find your login credentials below:</p>
<table cellspacing=""0"" cellpadding=""0"" border=""0"" style=""margin: 0 0 25px 0; width: 100%; background-color: #f9f9f9; border-radius: 6px; border: 1px solid #eeeeee;"">
    <tr>
        <td style=""padding: 12px 15px; border-bottom: 1px solid #eeeeee; font-weight: 600; width: 120px; color: #555555; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">Portal URL:</td>
        <td style=""padding: 12px 15px; border-bottom: 1px solid #eeeeee; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;""><a href=""http://innovationawards.indiaoppi.com/"" style=""color: #165baf; text-decoration: underline;"">http://innovationawards.indiaoppi.com/</a></td>
    </tr>
    <tr>
        <td style=""padding: 12px 15px; border-bottom: 1px solid #eeeeee; font-weight: 600; color: #555555; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">Email:</td>
        <td style=""padding: 12px 15px; border-bottom: 1px solid #eeeeee; font-family: monospace; font-size: 14px;"">{recipientEmail}</td>
    </tr>
    <tr>
        <td style=""padding: 12px 15px; font-weight: 600; color: #555555; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">Password:</td>
        <td style=""padding: 12px 15px; font-family: monospace; font-size: 14px; font-weight: 600; color: #222222;"">{password}</td>
    </tr>
</table>
<p style=""margin: 0 0 25px 0; text-align: center;"">
    <a href=""http://innovationawards.indiaoppi.com/"" target=""_blank"" style=""display: inline-block; padding: 12px 28px; background-color: #165baf; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.15);"">Access the Portal</a>
</p>
<p style=""margin: 0 0 30px 0;"">We recommend logging in and changing your password via the portal menu.</p>
<p style=""margin: 0; color: #666666;"">Regards,<br><strong style=""color: #222222;"">OPPI Excellence in Innovation Award Team</strong></p>";
            }
            else
            {
                string pwdText = string.IsNullOrWhiteSpace(password) 
                    ? "You can login using your existing password." 
                    : $"Your password has been updated to: <span style=\"font-family: monospace; font-weight: 600; color: #222222;\">{password}</span>";

                htmlContent = $@"
<p style=""margin: 0 0 20px 0;"">Dear {recipientName},</p>
<p style=""margin: 0 0 20px 0;"">Your account has been updated with the <strong>{roleType}</strong> role on the OPPI Excellence in Innovation Award 2025 portal.</p>
<p style=""margin: 0 0 20px 0;"">Please find your login details below:</p>
<table cellspacing=""0"" cellpadding=""0"" border=""0"" style=""margin: 0 0 25px 0; width: 100%; background-color: #f9f9f9; border-radius: 6px; border: 1px solid #eeeeee;"">
    <tr>
        <td style=""padding: 12px 15px; border-bottom: 1px solid #eeeeee; font-weight: 600; width: 120px; color: #555555; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">Portal URL:</td>
        <td style=""padding: 12px 15px; border-bottom: 1px solid #eeeeee; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;""><a href=""http://innovationawards.indiaoppi.com/"" style=""color: #165baf; text-decoration: underline;"">http://innovationawards.indiaoppi.com/</a></td>
    </tr>
    <tr>
        <td style=""padding: 12px 15px; border-bottom: 1px solid #eeeeee; font-weight: 600; color: #555555; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">Email:</td>
        <td style=""padding: 12px 15px; border-bottom: 1px solid #eeeeee; font-family: monospace; font-size: 14px;"">{recipientEmail}</td>
    </tr>
    <tr>
        <td style=""padding: 12px 15px; font-weight: 600; color: #555555; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">Password:</td>
        <td style=""padding: 12px 15px; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">{pwdText}</td>
    </tr>
</table>
<p style=""margin: 0 0 25px 0; text-align: center;"">
    <a href=""http://innovationawards.indiaoppi.com/"" target=""_blank"" style=""display: inline-block; padding: 12px 28px; background-color: #165baf; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.15);"">Access the Portal</a>
</p>
<p style=""margin: 0; color: #666666;"">Regards,<br><strong style=""color: #222222;"">OPPI Excellence in Innovation Award Team</strong></p>";
            }

            PopulateEmailHtmlBody(mail, htmlContent);

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
            
            string plainTextBody = $@"Dear {recipientName},

Thank you for submitting your application for the OPPI Excellence in Innovation Award for Healthcare Start-up of the year 2026.

Please note your application no. for future correspondence - {applicationId}

Your application will be reviewed by our validator and, upon successful validation, forwarded to the Jury for evaluation.

In the event that your application is not shortlisted, you will be notified via email.

We appreciate your participation and wish you the very best in the evaluation process.

Warm regards,
Team - OPPI Awards";

            mail.Body = plainTextBody;
            mail.IsBodyHtml = false;

            string htmlContent = $@"
<p style=""margin: 0 0 20px 0;"">Dear {recipientName},</p>
<p style=""margin: 0 0 20px 0;"">Thank you for submitting your application for the <strong>OPPI Excellence in Innovation Award for Healthcare Start-up of the year 2026</strong>.</p>
<div style=""margin: 0 0 25px 0; font-size: 16px; color: #165baf; background-color: #f0f7ff; padding: 12px 18px; border-radius: 6px; border: 1px solid #d0e4ff; display: inline-block; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"">
    <strong>Application Number:</strong> {applicationId}
</div>
<p style=""margin: 0 0 20px 0;"">Your application will be reviewed by our validator and, upon successful validation, forwarded to the Jury for evaluation.</p>
<p style=""margin: 0 0 20px 0;"">In the event that your application is not shortlisted, you will be notified via email.</p>
<p style=""margin: 0 0 30px 0;"">We appreciate your participation and wish you the very best in the evaluation process.</p>
<p style=""margin: 0; color: #666666;"">Warm regards,<br><strong style=""color: #222222;"">Team - OPPI Awards</strong></p>";

            PopulateEmailHtmlBody(mail, htmlContent);

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
