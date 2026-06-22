using Microsoft.EntityFrameworkCore;
using OppiInnovationApi.Models;

namespace OppiInnovationApi.Services;

public class ReminderEmailBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<ReminderEmailBackgroundService> _logger;
    private readonly SemaphoreSlim _triggerSemaphore = new(0);

    public ReminderEmailBackgroundService(
        IServiceScopeFactory scopeFactory,
        IConfiguration config,
        ILogger<ReminderEmailBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _config = config;
        _logger = logger;
    }

    public void TriggerImmediateRun()
    {
        _logger.LogInformation("Reminder service manual trigger received.");
        _triggerSemaphore.Release();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Reminder email background service started.");

        // Read settings
        var settingsSection = _config.GetSection("ReminderSettings");
        var enabled = settingsSection.GetValue<bool>("Enabled", true);
        var intervalHours = settingsSection.GetValue<int>("IntervalHours", 24);

        if (intervalHours <= 0) intervalHours = 24;

        // Perform initial run after a short delay to let server start up
        try
        {
            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            // Re-read configuration in case it has been reloaded/updated
            var currentSettings = _config.GetSection("ReminderSettings");
            var isEnabled = currentSettings.GetValue<bool>("Enabled", enabled);
            
            if (isEnabled)
            {
                _logger.LogInformation("Running reminder email checks...");
                try
                {
                    await ProcessRemindersAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while executing reminder email checks.");
                }
            }
            else
            {
                _logger.LogInformation("Reminder email service is disabled in configuration.");
            }

            // Wait for either the periodic interval or a manual trigger semaphore release
            var checkInterval = TimeSpan.FromHours(intervalHours);
            _logger.LogInformation("Reminder email service waiting for next run in {Hours} hours...", intervalHours);

            try
            {
                // Wait on the semaphore or timeout
                await WaitAnyAsync(_triggerSemaphore, checkInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("Reminder email background service stopping.");
    }

    private static async Task WaitAnyAsync(SemaphoreSlim semaphore, TimeSpan timeout, CancellationToken cancellationToken)
    {
        using var timeoutCts = new CancellationTokenSource(timeout);
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);
        
        try
        {
            await semaphore.WaitAsync(linkedCts.Token);
        }
        catch (OperationCanceledException)
        {
            if (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            // Timeout reached, which is fine, we just want to run again
        }
    }

    public async Task ProcessRemindersAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InnovationDbContext>();
        var emailSvc = scope.ServiceProvider.GetRequiredService<EmailService>();
        var audit = scope.ServiceProvider.GetRequiredService<AuditService>();

        var settings = _config.GetSection("ReminderSettings");
        var minDaysSinceReg = settings.GetValue<int>("MinDaysSinceRegistration", 1);
        var minDaysBetweenReminders = settings.GetValue<int>("MinDaysBetweenReminders", 7);

        var minAgeDate = DateTime.UtcNow.AddDays(-minDaysSinceReg);
        var cutoffDate = DateTime.UtcNow.AddDays(-minDaysBetweenReminders);

        // 1. Processing Registered Applicants: Role is USER, active, not deleted, no applications, and created at least MinDaysSinceRegistration days ago
        var registeredUsers = await db.Users
            .Where(u => u.Role == "USER" && u.IsActive && !u.IsDeleted && u.CreatedAt <= minAgeDate)
            .Where(u => !db.Applications.Any(a => a.UserId == u.Id))
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Found {Count} registered users to evaluate for reminders.", registeredUsers.Count);

        foreach (var user in registeredUsers)
        {
            var alreadySentRecently = await db.AuditLogs
                .AnyAsync(l => l.UserId == user.Id && 
                               l.Action == "SEND_REGISTERED_REMINDER" && 
                               l.CreatedAt >= cutoffDate, 
                          cancellationToken);

            if (!alreadySentRecently)
            {
                _logger.LogInformation("Sending registered reminder email to: {Email}", user.Email);
                await emailSvc.SendRegisteredReminderEmailAsync(user.Email, $"{user.FirstName} {user.LastName}".Trim());
                await audit.LogAsync(user.Id, "SEND_REGISTERED_REMINDER", "User", user.Id, "Sent registered applicant reminder email");
            }
            else
            {
                _logger.LogInformation("Registered reminder already sent recently to: {Email}", user.Email);
            }
        }

        // 2. Processing Draft Applications: Applications with status DRAFT, created at least MinDaysSinceRegistration days ago, and user role is USER, active, not deleted
        var draftApplications = await db.Applications
            .Include(a => a.User)
            .Where(a => a.Status == "DRAFT" && 
                        a.CreatedAt <= minAgeDate && 
                        a.User.Role == "USER" && 
                        a.User.IsActive && 
                        !a.User.IsDeleted)
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Found {Count} draft applications to evaluate for reminders.", draftApplications.Count);

        foreach (var app in draftApplications)
        {
            var alreadySentRecently = await db.AuditLogs
                .AnyAsync(l => l.UserId == app.UserId && 
                               l.Action == "SEND_DRAFT_REMINDER" && 
                               l.CreatedAt >= cutoffDate, 
                          cancellationToken);

            if (!alreadySentRecently)
            {
                _logger.LogInformation("Sending draft application reminder email to: {Email}", app.User.Email);
                await emailSvc.SendDraftReminderEmailAsync(app.User.Email, $"{app.User.FirstName} {app.User.LastName}".Trim());
                await audit.LogAsync(app.UserId, "SEND_DRAFT_REMINDER", "Application", app.Id, "Sent draft application reminder email");
            }
            else
            {
                _logger.LogInformation("Draft application reminder already sent recently to: {Email}", app.User.Email);
            }
        }
    }
}
