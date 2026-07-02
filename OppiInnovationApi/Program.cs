using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.RateLimiting;
using System.Text;
using System.Security.Claims;
using FluentValidation;
using Serilog;
using OppiInnovationApi.Models;
using OppiInnovationApi.DTOs;
using OppiInnovationApi.Services;
using OppiInnovationApi.Middleware;
using OppiInnovationApi.Validators;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console().WriteTo.File("logs/innovation-.log", rollingInterval: RollingInterval.Day)
    .Enrich.FromLogContext().MinimumLevel.Information().CreateLogger();

try {
var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

// Allow file uploads up to 50MB through Kestrel (nginx must also be configured with client_max_body_size)
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 50 * 1024 * 1024; // 50 MB
});


var connStr = builder.Configuration.GetConnectionString("DefaultConnection") ?? Environment.GetEnvironmentVariable("DB_CONNECTION") ?? throw new Exception("DB_CONNECTION missing");
var jwtKey = builder.Configuration["JwtSettings:Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY") ?? throw new Exception("JWT_KEY missing");
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "OppiInnovation";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "OppiInnovationUsers";
var allowedOrigins = builder.Configuration["AllowedOrigins"] ?? Environment.GetEnvironmentVariable("ALLOWED_ORIGINS") ?? "http://localhost:5174";

builder.Services.AddDbContext<InnovationDbContext>(o => o.UseMySql(connStr, ServerVersion.AutoDetect(connStr)));
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<DomainService>();
builder.Services.AddScoped<AuditService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddSingleton<ReminderEmailBackgroundService>();
builder.Services.AddHostedService<ReminderEmailBackgroundService>(p => p.GetRequiredService<ReminderEmailBackgroundService>());
builder.Services.AddScoped<IValidator<RegisterDto>, RegisterValidator>();
builder.Services.AddScoped<IValidator<LoginDto>, LoginValidator>();

var azureStorageConn = builder.Configuration["AzureStorage:ConnectionString"] ?? Environment.GetEnvironmentVariable("AZURE_STORAGE_CONNECTION_STRING");
if (!string.IsNullOrEmpty(azureStorageConn))
{
    builder.Services.AddScoped<IStorageService, AzureBlobStorageService>();
}
else
{
    builder.Services.AddScoped<IStorageService, LocalFileStorageService>();
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o => {
    o.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true,
        ValidateIssuerSigningKey = true, ValidIssuer = jwtIssuer, ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        RoleClaimType = ClaimTypes.Role, NameClaimType = ClaimTypes.NameIdentifier
    };
});

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("CanReview", p => p.RequireRole("VALIDATOR", "JURY", "ADMIN"));

builder.Services.AddRateLimiter(o => {
    o.AddFixedWindowLimiter("auth", x => { x.PermitLimit = 10; x.Window = TimeSpan.FromMinutes(1); });
    o.AddFixedWindowLimiter("api", x => { x.PermitLimit = 60; x.Window = TimeSpan.FromMinutes(1); });
    o.RejectionStatusCode = 429;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(o => {
    o.AddPolicy("Dev", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
    o.AddPolicy("Prod", p => {
        if (allowedOrigins == "*") p.SetIsOriginAllowed(_ => true).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
        else p.WithOrigins(allowedOrigins.Split(',')).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
    });
});

var app = builder.Build();

// Run automatic DB migrations to add is_draft if missing
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<InnovationDbContext>();
        var conn = db.Database.GetDbConnection();
        await conn.OpenAsync();
        
        // 1. Check/Add is_draft to jury_reviews
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'jury_reviews' AND column_name = 'is_draft'";
            var count = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            if (count == 0)
            {
                using (var cmdAlter = conn.CreateCommand())
                {
                    cmdAlter.CommandText = "ALTER TABLE `jury_reviews` ADD COLUMN `is_draft` TINYINT(1) NOT NULL DEFAULT 0";
                    await cmdAlter.ExecuteNonQueryAsync();
                }
            }
        }
        
        // 2. Check/Add is_draft to validator_reviews
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'validator_reviews' AND column_name = 'is_draft'";
            var count = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            if (count == 0)
            {
                using (var cmdAlter = conn.CreateCommand())
                {
                    cmdAlter.CommandText = "ALTER TABLE `validator_reviews` ADD COLUMN `is_draft` TINYINT(1) NOT NULL DEFAULT 0";
                    await cmdAlter.ExecuteNonQueryAsync();
                }
            }
        }

        // 3. Check/Add remarks to jury_reviews
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'jury_reviews' AND column_name = 'remarks'";
            var count = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            if (count == 0)
            {
                using (var cmdAlter = conn.CreateCommand())
                {
                    cmdAlter.CommandText = "ALTER TABLE `jury_reviews` ADD COLUMN `remarks` TEXT NULL";
                    await cmdAlter.ExecuteNonQueryAsync();
                }
            }
        }

        // 4. Check/Add remarks to validator_reviews
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'validator_reviews' AND column_name = 'remarks'";
            var count = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            if (count == 0)
            {
                using (var cmdAlter = conn.CreateCommand())
                {
                    cmdAlter.CommandText = "ALTER TABLE `validator_reviews` ADD COLUMN `remarks` TEXT NULL";
                    await cmdAlter.ExecuteNonQueryAsync();
                }
            }
        }

        // 4b. Check/Add remarks to applications
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'applications' AND column_name = 'remarks'";
            var count = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            if (count == 0)
            {
                using (var cmdAlter = conn.CreateCommand())
                {
                    cmdAlter.CommandText = "ALTER TABLE `applications` ADD COLUMN `remarks` TEXT NULL";
                    await cmdAlter.ExecuteNonQueryAsync();
                }
            }
        }

        // 5. Check/Create jury_members table
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'jury_members'";
            var count = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            if (count == 0)
            {
                using (var cmdCreate = conn.CreateCommand())
                {
                    cmdCreate.CommandText = @"
                        CREATE TABLE `jury_members` (
                          `id` INT NOT NULL AUTO_INCREMENT,
                          `name` VARCHAR(255) NOT NULL,
                          `email` VARCHAR(255) NOT NULL,
                          `role` VARCHAR(500) NOT NULL,
                          `image_url` VARCHAR(1000) NULL,
                          `type` ENUM('VALIDATOR','JURY') NOT NULL DEFAULT 'JURY',
                          `sort_order` INT NOT NULL DEFAULT 0,
                          `created_at` DATETIME NOT NULL,
                          PRIMARY KEY (`id`)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
                    await cmdCreate.ExecuteNonQueryAsync();
                }
            }
            else
            {
                using (var cmdCol = conn.CreateCommand())
                {
                    cmdCol.CommandText = "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'jury_members' AND column_name = 'email'";
                    var colCount = Convert.ToInt32(await cmdCol.ExecuteScalarAsync());
                    if (colCount == 0)
                    {
                        using (var cmdAlter = conn.CreateCommand())
                        {
                            cmdAlter.CommandText = "ALTER TABLE `jury_members` ADD COLUMN `email` VARCHAR(255) NOT NULL DEFAULT 'temp@oppi.com'";
                            await cmdAlter.ExecuteNonQueryAsync();
                        }
                    }
                }
            }
        }

        // Seeding jury members and images
        var juryUploadsDir = Path.Combine(app.Environment.WebRootPath, "uploads", "jury");
        Directory.CreateDirectory(juryUploadsDir);
        
        var assetsDir = Path.Combine(Directory.GetCurrentDirectory(), "..", "innovationui", "src", "assets");
        if (Directory.Exists(assetsDir))
        {
            var filesToCopy = new[] {
                "Ashutosh-Pastor-with-round-bg.png",
                "meena-ganesh--with-round-bg.png",
                "Dr-Karthikeyan-Ponnalagu--with-round-bg.png",
                "director_new1--with-round-bg.png"
            };
            foreach (var f in filesToCopy)
            {
                var src = Path.Combine(assetsDir, f);
                var dest = Path.Combine(juryUploadsDir, f);
                if (File.Exists(src) && !File.Exists(dest))
                {
                    try
                    {
                        File.Copy(src, dest);
                    }
                    catch (Exception copyEx)
                    {
                        Console.WriteLine($"Image copy warning: {copyEx.Message}");
                    }
                }
            }

            // Copy logos and headers for emails
            var mainUploadsDir = Path.Combine(app.Environment.WebRootPath, "uploads");
            var logoFiles = new[] {
                "Oppi-logo.png",
                "OPPI-logo-black.png",
                "OPPI-logo-white.png",
                "innovation-header.jpg"
            };
            foreach (var f in logoFiles)
            {
                var src = Path.Combine(assetsDir, f);
                var dest = Path.Combine(mainUploadsDir, f);
                if (File.Exists(src) && !File.Exists(dest))
                {
                    try
                    {
                        File.Copy(src, dest);
                    }
                    catch (Exception copyEx)
                    {
                        Console.WriteLine($"Logo copy warning: {copyEx.Message}");
                    }
                }
            }
        }

        if (!db.JuryMembers.Any())
        {
            var seedData = new[]
            {
                new { Name = "Ashutosh Pastor", Email = "ashutosh@oppi.com", Role = "Sr. Manager and Head - Incubation, Foundation for Innovation & Technology Transfer, IIT Delhi", ImageUrl = "/uploads/jury/Ashutosh-Pastor-with-round-bg.png", Type = "VALIDATOR", SortOrder = 1 },
                new { Name = "Meena Ganesh", Email = "meena@oppi.com", Role = "Co-Founder & Chairperson Portea Medical, Trustee Bahaar Foundation", ImageUrl = "/uploads/jury/meena-ganesh--with-round-bg.png", Type = "JURY", SortOrder = 2 },
                new { Name = "Dr Karthikeyan Ponnalagu", Email = "karthikeyan@oppi.com", Role = "Engineering Director, AI and ML platforms, Amex India pvt Ltd", ImageUrl = "/uploads/jury/Dr-Karthikeyan-Ponnalagu--with-round-bg.png", Type = "JURY", SortOrder = 3 },
                new { Name = "Shubhini A. Saraf", Email = "shubhini@oppi.com", Role = "Director, National Institute of Pharmaceutical Education & Research (NIPER), Raebareli", ImageUrl = "/uploads/jury/director_new1--with-round-bg.png", Type = "JURY", SortOrder = 4 }
            };

            foreach (var s in seedData)
            {
                var userExists = db.Users.Any(u => u.Email == s.Email);
                if (!userExists)
                {
                    var parts = s.Name.Split(' ', 2);
                    var firstName = parts[0];
                    var lastName = parts.Length > 1 ? parts[1] : "";
                    
                    db.Users.Add(new User
                    {
                        FirstName = firstName,
                        LastName = lastName,
                        Email = s.Email,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("OppiJury2026!"),
                        Role = s.Type,
                        IsActive = true,
                        IsDeleted = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                db.JuryMembers.Add(new JuryMember
                {
                    Name = s.Name,
                    Email = s.Email,
                    Role = s.Role,
                    ImageUrl = s.ImageUrl,
                    Type = s.Type,
                    SortOrder = s.SortOrder,
                    CreatedAt = DateTime.UtcNow
                });
            }
            await db.SaveChangesAsync();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database migration/seeding error: {ex.Message}");
    }
}


app.UseMiddleware<GlobalExceptionMiddleware>();

var uploadsDir = Path.Combine(builder.Environment.WebRootPath, "uploads");
Directory.CreateDirectory(uploadsDir);

var templatesDir = Path.Combine(builder.Environment.WebRootPath, "templates");
Directory.CreateDirectory(templatesDir);
var blankFormPath = Path.Combine(templatesDir, "Blank_Application_Form.doc");
if (!File.Exists(blankFormPath))
{
    var rtfContent = @"{\rtf1\ansi\deff0
{\fonttbl{\f0\fnil\fcharset0 Arial;}}
{\colortbl ;\red0\green92\blue154;\red128\green128\blue128;}
\viewkind4\uc1\pard\lang1033\f0\fs28\b\cf1 OPPI Excellence in Innovation Award 2025\b0\cf0\fs24\par
\fs22\cf2 Blank Application Form Template for Reference\cf0\fs24\par
\par
This document is provided for your easy reference. You may fill out the details here before submitting them online at \b http://innovationawards.indiaoppi.com/\b0.\par
\par
\b\cf1 SECTION 1: PERSONAL & COMPANY INFORMATION\cf0\b0\par
--------------------------------------------------\par
1. Company Name:\par
   [__________________________________________________]\par
\par
2. Designation:\par
   [__________________________________________________]\par
\par
3. Category of Work:\par
   [__________________________________________________]\par
\par
4. Company Website:\par
   [__________________________________________________]\par
\par
5. Company Brief (Short Description):\par
   [__________________________________________________]\par
\par
6. Innovation Details (What makes it unique?):\par
   [__________________________________________________]\par
\par
7. Competitive Analysis:\par
   [__________________________________________________]\par
\par
8. Need Analysis & Marketability:\par
   [__________________________________________________]\par
\par
\par
\b\cf1 SECTION 2: COMPANY REACH & CHANNELS\cf0\b0\par
--------------------------------------------------\par
1. Marketing Strategy:\par
   [__________________________________________________]\par
\par
2. App/Website Details:\par
   [__________________________________________________]\par
\par
3. Social Media Presence:\par
   [__________________________________________________]\par
\par
4. Physical Outlets / Future Expansion:\par
   [__________________________________________________]\par
\par
\par
\b\cf1 SECTION 3: COMPANY DETAILS & IMPACT\cf0\b0\par
--------------------------------------------------\par
1. Customer Benefit:\par
   [__________________________________________________]\par
\par
2. Testimonials & Media Mentions:\par
   [__________________________________________________]\par
\par
3. Employee Count & Board of Directors:\par
   [__________________________________________________]\par
\par
4. Investors Details / Patents / Product Benefits:\par
   [__________________________________________________]\par
\par
\par
\b Note:\b0 Final submission must be completed online.\par
}";
    File.WriteAllText(blankFormPath, rtfContent);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsDir),
    RequestPath = "/uploads",
    OnPrepareResponse = ctx => {
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
    }
});

app.UseSerilogRequestLogging();
if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); app.UseCors("Dev"); }
else { app.UseHttpsRedirection(); app.UseCors("Prod"); }
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

static int? GetUid(HttpContext c) { var s = c.User.FindFirst(ClaimTypes.NameIdentifier)?.Value; return int.TryParse(s, out var id) ? id : null; }
static string GetIp(HttpContext c) => c.Connection.RemoteIpAddress?.ToString() ?? "?";

// ========== AUTH ==========
var auth = app.MapGroup("/auth").RequireRateLimiting("auth");

auth.MapPost("/register", async (RegisterDto dto, InnovationDbContext db,
    JwtService jwt, AuditService audit, IValidator<RegisterDto> v, HttpContext ctx, IServiceScopeFactory scopeFactory) =>
{
    var vr = await v.ValidateAsync(dto);
    if (!vr.IsValid) return Results.BadRequest(new { errors = vr.Errors.Select(e => e.ErrorMessage) });
    if (db.Users.Any(x => x.Email == dto.Email)) return Results.BadRequest(new { message = "Email already registered" });

    var user = new User { FirstName = dto.First_Name, LastName = dto.Last_Name, Email = dto.Email,
        Mobile = dto.Mobile, PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
        Role = "USER", CreatedAt = DateTime.UtcNow };
    db.Users.Add(user); await db.SaveChangesAsync();

    var at = jwt.GenerateAccessToken(user);
    var rt = await jwt.GenerateRefreshTokenAsync(user, ctx.Request.Headers.UserAgent);
    await audit.LogAsync(user.Id, "REGISTER", "User", user.Id, null, GetIp(ctx));

    // Send registration email safely in background
    var email = user.Email;
    var name = $"{user.FirstName} {user.LastName}";
    _ = Task.Run(async () =>
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var emailSvc = scope.ServiceProvider.GetRequiredService<EmailService>();
            await emailSvc.SendRegistrationEmailAsync(email, name);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to send registration email in background task for {Email}", email);
        }
    });

    return Results.Ok(new { access_token = at, refresh_token = rt,
        user = new { id = user.Id, first_name = user.FirstName, last_name = user.LastName,
            email = user.Email, mobile = user.Mobile } });
});

auth.MapPost("/login", async (LoginDto dto, InnovationDbContext db, JwtService jwt,
    AuditService audit, IValidator<LoginDto> v, HttpContext ctx) =>
{
    var vr = await v.ValidateAsync(dto);
    if (!vr.IsValid) return Results.BadRequest(new { errors = vr.Errors.Select(e => e.ErrorMessage) });
    var user = db.Users.FirstOrDefault(x => x.Email == dto.Email);
    if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
    { await audit.LogAsync(null, "LOGIN_FAILED", null, null, $"Email: {dto.Email}", GetIp(ctx));
      return Results.BadRequest(new { message = "Invalid credentials" }); }

    var at = jwt.GenerateAccessToken(user);
    var rt = await jwt.GenerateRefreshTokenAsync(user, ctx.Request.Headers.UserAgent);
    await audit.LogAsync(user.Id, "LOGIN", "User", user.Id, null, GetIp(ctx));

    return Results.Ok(new { access_token = at, refresh_token = rt,
        user = new { id = user.Id, first_name = user.FirstName, last_name = user.LastName,
            email = user.Email, mobile = user.Mobile, role = user.Role } });
});

auth.MapPost("/forgot-password", async (ForgotPasswordDto dto, InnovationDbContext db, JwtService jwt, HttpContext ctx, IServiceScopeFactory scopeFactory) =>
{
    var user = db.Users.FirstOrDefault(x => x.Email == dto.Email);
    if (user == null) return Results.BadRequest(new { message = "Email not found" });

    var name = $"{user.FirstName} {user.LastName}".Trim();
    if (string.IsNullOrWhiteSpace(name)) name = "User";

    var resetToken = jwt.GeneratePasswordResetToken(user);
    
    var origin = ctx.Request.Headers["Origin"].ToString();
    if (string.IsNullOrWhiteSpace(origin))
    {
        var referer = ctx.Request.Headers["Referer"].ToString();
        if (!string.IsNullOrWhiteSpace(referer) && System.Uri.TryCreate(referer, System.UriKind.Absolute, out var refererUri))
        {
            origin = $"{refererUri.Scheme}://{refererUri.Authority}";
        }
    }
    if (string.IsNullOrWhiteSpace(origin))
    {
        origin = "https://innovationawards.indiaoppi.com";
    }
    origin = origin.TrimEnd('/');
    var resetLink = $"{origin}/reset-password?token={Uri.EscapeDataString(resetToken)}";

    _ = Task.Run(async () =>
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var emailSvc = scope.ServiceProvider.GetRequiredService<EmailService>();
            await emailSvc.SendForgotPasswordEmailAsync(user.Email, name, resetLink);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to send forgot password email in background task for {Email}", user.Email);
        }
    });

    return Results.Ok(new { message = "Password reset link sent to email" });
});

auth.MapPost("/reset-password", async (ResetPasswordDto dto, InnovationDbContext db, JwtService jwt) =>
{
    if (string.IsNullOrWhiteSpace(dto.Token) || string.IsNullOrWhiteSpace(dto.Password))
    {
        return Results.BadRequest(new { message = "Token and password are required." });
    }
    
    if (dto.Password.Length < 8 ||
        !dto.Password.Any(char.IsUpper) ||
        !dto.Password.Any(char.IsLower) ||
        !dto.Password.Any(char.IsDigit))
    {
        return Results.BadRequest(new { message = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number." });
    }

    var principal = jwt.ValidatePasswordResetToken(dto.Token);
    if (principal == null)
    {
        return Results.BadRequest(new { message = "Invalid or expired password reset link." });
    }

    var email = principal.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
    if (string.IsNullOrEmpty(email))
    {
        return Results.BadRequest(new { message = "Invalid token claims." });
    }

    var user = db.Users.FirstOrDefault(x => x.Email == email);
    if (user == null)
    {
        return Results.BadRequest(new { message = "User not found." });
    }

    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Password has been reset successfully." });
});

auth.MapPost("/change-password", async (ChangePasswordDto dto, HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value); if (user == null) return Results.NotFound();
    if (!BCrypt.Net.BCrypt.Verify(dto.Old_Password, user.PasswordHash))
        return Results.BadRequest(new { message = "Current password is incorrect" });
    
    if (string.IsNullOrWhiteSpace(dto.New_Password) ||
        dto.New_Password.Length < 8 ||
        !dto.New_Password.Any(char.IsUpper) ||
        !dto.New_Password.Any(char.IsLower) ||
        !dto.New_Password.Any(char.IsDigit))
    {
        return Results.BadRequest(new { message = "New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number." });
    }

    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.New_Password);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Password changed" });
}).RequireAuthorization();

auth.MapPost("/refresh", async (HttpContext ctx, InnovationDbContext db, JwtService jwt) =>
{
    var body = await ctx.Request.ReadFromJsonAsync<Dictionary<string, string>>();
    var tk = body?.GetValueOrDefault("refresh_token");
    if (string.IsNullOrWhiteSpace(tk)) return Results.BadRequest(new { message = "refresh_token required" });
    var r = await jwt.RefreshAsync(tk); if (r == null) return Results.Unauthorized();
    return Results.Ok(new { access_token = r.Value.access, refresh_token = r.Value.refresh });
});

auth.MapPost("/logout", async (HttpContext ctx, JwtService jwt) =>
{
    var uid = GetUid(ctx); if (uid != null) await jwt.RevokeAllAsync(uid.Value);
    return Results.Ok(new { message = "Logged out" });
}).RequireAuthorization();

auth.MapGet("/me", async (HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var u = await db.Users.FindAsync(uid.Value); if (u == null) return Results.NotFound();
    return Results.Ok(new { id = u.Id, first_name = u.FirstName, last_name = u.LastName,
        email = u.Email, mobile = u.Mobile, role = u.Role });
}).RequireAuthorization();

// ========== APPLICATION ==========
var api = app.MapGroup("").RequireAuthorization().RequireRateLimiting("api");

api.MapPost("/application/create", async (HttpContext ctx, InnovationDbContext db, AuditService audit) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var existing = await db.Applications.FirstOrDefaultAsync(a => a.UserId == uid.Value);
    if (existing != null)
    {
        if (existing.Status == "SUBMITTED") return Results.BadRequest(new { message = "Already submitted", id = existing.Id });
        return Results.Ok(new { id = existing.Id, status = existing.Status });
    }
    var a = new Application { UserId = uid.Value, Status = "DRAFT", CreatedAt = DateTime.UtcNow };
    db.Applications.Add(a); await db.SaveChangesAsync();
    await audit.LogAsync(uid, "CREATE_APP", "Application", a.Id, null, GetIp(ctx));
    return Results.Ok(new { id = a.Id, status = a.Status });
});

api.MapGet("/application/mine", async (HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var a = await db.Applications.Include(x => x.PersonalInfo).Include(x => x.CompanyReach)
        .Include(x => x.CompanyDetail).Include(x => x.FileUploads)
        .FirstOrDefaultAsync(x => x.UserId == uid.Value);
    if (a == null) return Results.NotFound(new { message = "No application" });
    return Results.Ok(new { id = a.Id, status = a.Status, submitted_at = a.SubmittedAt, remarks = a.Remarks,
        personal_info = a.PersonalInfo == null ? null : new { a.PersonalInfo.CompanyName, a.PersonalInfo.Designation,
            a.PersonalInfo.CategoryOfWork, a.PersonalInfo.OtherCategory, a.PersonalInfo.CompanyWebsite,
            a.PersonalInfo.CompanyBrief, a.PersonalInfo.Innovation, a.PersonalInfo.CompetitiveAnalysis,
            a.PersonalInfo.NeedAnalysis, a.PersonalInfo.Marketability },
        company_reach = a.CompanyReach == null ? null : new { a.CompanyReach.MarketingStrategy, a.CompanyReach.AppDetails,
            a.CompanyReach.WebsiteDetails, a.CompanyReach.SocialMedia, a.CompanyReach.PhysicalOutlets, a.CompanyReach.FutureExpansion },
        company_detail = a.CompanyDetail == null ? null : new { a.CompanyDetail.CustomerBenefit, a.CompanyDetail.Testimonial,
            a.CompanyDetail.EmployeeCount, a.CompanyDetail.BoardOfDirectors, a.CompanyDetail.InvestorsDetails,
            a.CompanyDetail.MediaMentions, a.CompanyDetail.Patents, a.CompanyDetail.ProductBenefits },
        file_uploads = a.FileUploads.Select(f => new { f.Id, f.Section, f.FileName, f.FilePath, f.FileSize, f.FileType })
    });
});

api.MapGet("/application/review/{id}", async (int id, HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN" && user?.Role != "VALIDATOR" && user?.Role != "JURY") return Results.Forbid();

    var a = await db.Applications.Include(x => x.PersonalInfo).Include(x => x.CompanyReach)
        .Include(x => x.CompanyDetail).Include(x => x.FileUploads).Include(x => x.User)
        .FirstOrDefaultAsync(x => x.Id == id);
    if (a == null) return Results.NotFound(new { message = "Application not found" });

    var juryReviews = await db.JuryReviews
        .Where(jr => jr.ApplicationId == id)
        .Select(jr => new {
            jr.Id,
            jr.JuryId,
            jury_name = db.Users.Where(u => u.Id == jr.JuryId).Select(u => u.FirstName + " " + u.LastName).FirstOrDefault() ?? "Jury",
            jr.InnovationIpScore,
            jr.TeamStrengthScore,
            jr.BusinessPlanScore,
            jr.ImpactScore,
            jr.WeightedScore,
            jr.IsDraft,
            jr.Remarks,
            jr.CreatedAt
        })
        .ToListAsync();

    var validatorReviews = await db.ValidatorReviews
        .Where(vr => vr.ApplicationId == id)
        .Select(vr => new {
            vr.Id,
            vr.ValidatorId,
            validator_name = db.Users.Where(u => u.Id == vr.ValidatorId).Select(u => u.FirstName + " " + u.LastName).FirstOrDefault() ?? "Validator",
            vr.InnovationIpScore,
            vr.TeamStrengthScore,
            vr.BusinessPlanScore,
            vr.ImpactScore,
            vr.WeightedScore,
            vr.IsDraft,
            vr.Remarks,
            vr.CreatedAt
        })
        .ToListAsync();

    double avgScore = juryReviews.Where(r => !r.IsDraft).Any() ? juryReviews.Where(r => !r.IsDraft).Average(r => r.WeightedScore) : 0.0;

    return Results.Ok(new { id = a.Id, status = a.Status, submitted_at = a.SubmittedAt, remarks = a.Remarks,
        user_name = a.User?.FirstName + " " + a.User?.LastName, user_email = a.User?.Email, user_mobile = a.User?.Mobile,
        personal_info = a.PersonalInfo == null ? null : new { a.PersonalInfo.CompanyName, a.PersonalInfo.Designation,
            a.PersonalInfo.CategoryOfWork, a.PersonalInfo.OtherCategory, a.PersonalInfo.CompanyWebsite,
            a.PersonalInfo.CompanyBrief, a.PersonalInfo.Innovation, a.PersonalInfo.CompetitiveAnalysis,
            a.PersonalInfo.NeedAnalysis, a.PersonalInfo.Marketability },
        company_reach = a.CompanyReach == null ? null : new { a.CompanyReach.MarketingStrategy, a.CompanyReach.AppDetails,
            a.CompanyReach.WebsiteDetails, a.CompanyReach.SocialMedia, a.CompanyReach.PhysicalOutlets, a.CompanyReach.FutureExpansion },
        company_detail = a.CompanyDetail == null ? null : new { a.CompanyDetail.CustomerBenefit, a.CompanyDetail.Testimonial,
            a.CompanyDetail.EmployeeCount, a.CompanyDetail.BoardOfDirectors, a.CompanyDetail.InvestorsDetails,
            a.CompanyDetail.MediaMentions, a.CompanyDetail.Patents, a.CompanyDetail.ProductBenefits },
        file_uploads = a.FileUploads.Select(f => new { f.Id, f.Section, f.FileName, f.FilePath, f.FileSize, f.FileType }),
        jury_reviews = juryReviews,
        validator_reviews = validatorReviews,
        average_score = avgScore,
        jury_approval_count = juryReviews.Count(r => !r.IsDraft)
    });
});

// Page 1: Personal Info
api.MapPost("/application/page1/{appId}", async (int appId, PersonalInfoDto dto, InnovationDbContext db) =>
{
    var e = await db.PersonalInfos.FirstOrDefaultAsync(x => x.ApplicationId == appId);
    if (e == null) { db.PersonalInfos.Add(new PersonalInfo { ApplicationId = appId, CompanyName = dto.Company_Name,
        Designation = dto.Designation, CategoryOfWork = dto.Category_Of_Work, OtherCategory = dto.Other_Category,
        CompanyWebsite = dto.Company_Website, CompanyBrief = dto.Company_Brief, Innovation = dto.Innovation,
        CompetitiveAnalysis = dto.Competitive_Analysis, NeedAnalysis = dto.Need_Analysis, Marketability = dto.Marketability }); }
    else { e.CompanyName = dto.Company_Name; e.Designation = dto.Designation; e.CategoryOfWork = dto.Category_Of_Work;
        e.OtherCategory = dto.Other_Category; e.CompanyWebsite = dto.Company_Website; e.CompanyBrief = dto.Company_Brief;
        e.Innovation = dto.Innovation; e.CompetitiveAnalysis = dto.Competitive_Analysis;
        e.NeedAnalysis = dto.Need_Analysis; e.Marketability = dto.Marketability; }
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Page 1 saved" });
});

// Page 2: Company Reach
api.MapPost("/application/page2/{appId}", async (int appId, CompanyReachDto dto, InnovationDbContext db) =>
{
    var e = await db.CompanyReaches.FirstOrDefaultAsync(x => x.ApplicationId == appId);
    if (e == null) { db.CompanyReaches.Add(new CompanyReach { ApplicationId = appId, MarketingStrategy = dto.Marketing_Strategy,
        AppDetails = dto.App_Details, WebsiteDetails = dto.Website_Details, SocialMedia = dto.Social_Media,
        PhysicalOutlets = dto.Physical_Outlets, FutureExpansion = dto.Future_Expansion }); }
    else { e.MarketingStrategy = dto.Marketing_Strategy; e.AppDetails = dto.App_Details; e.WebsiteDetails = dto.Website_Details;
        e.SocialMedia = dto.Social_Media; e.PhysicalOutlets = dto.Physical_Outlets; e.FutureExpansion = dto.Future_Expansion; }
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Page 2 saved" });
});

// Page 3: Company Details
api.MapPost("/application/page3/{appId}", async (int appId, CompanyDetailsDto dto, InnovationDbContext db) =>
{
    var e = await db.CompanyDetails.FirstOrDefaultAsync(x => x.ApplicationId == appId);
    if (e == null) { db.CompanyDetails.Add(new CompanyDetail { ApplicationId = appId, CustomerBenefit = dto.Customer_Benefit,
        Testimonial = dto.Testimonial, EmployeeCount = dto.Employee_Count, BoardOfDirectors = dto.Board_Of_Directors,
        InvestorsDetails = dto.Investors_Details, MediaMentions = dto.Media_Mentions,
        Patents = dto.Patents, ProductBenefits = dto.Product_Benefits }); }
    else { e.CustomerBenefit = dto.Customer_Benefit; e.Testimonial = dto.Testimonial; e.EmployeeCount = dto.Employee_Count;
        e.BoardOfDirectors = dto.Board_Of_Directors; e.InvestorsDetails = dto.Investors_Details;
        e.MediaMentions = dto.Media_Mentions; e.Patents = dto.Patents; e.ProductBenefits = dto.Product_Benefits; }
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Page 3 saved" });
});

// File Uploads
api.MapPost("/application/upload/{appId}/{section}", async (int appId, string section, HttpRequest req, InnovationDbContext db, IStorageService storage) =>
{
    if (!req.HasFormContentType) return Results.BadRequest(new { message = "Invalid content type" });
    var form = await req.ReadFormAsync();
    var files = form.Files;
    if (files.Count == 0) return Results.BadRequest(new { message = "No files uploaded" });

    var existingCount = await db.FileUploads.CountAsync(f => f.ApplicationId == appId && f.Section == section);
    if (existingCount + files.Count > 5) return Results.BadRequest(new { message = "Maximum 5 files allowed per section" });

    var uploadedFiles = new List<object>();

    var existingNames = await db.FileUploads
        .Where(f => f.ApplicationId == appId && f.Section == section)
        .Select(f => f.FileName)
        .ToListAsync();

    var processedNames = new List<string>();

    foreach (var file in files)
    {
        if (file.Length > 8 * 1024 * 1024) return Results.BadRequest(new { message = $"File {file.FileName} exceeds 8MB limit" });
        
        var ext = Path.GetExtension(file.FileName).ToLower();
        var allowed = new[] { ".jpg", ".jpeg", ".jpe", ".png", ".pdf", ".asf", ".asx", ".wmv", ".wmx", ".wm", ".avi", ".divx", ".flv", ".mov", ".qt", ".mpeg", ".mpg", ".mpe", ".mp4", ".m4v", ".ogv", ".webm", ".mkv", ".3gp", ".3gpp", ".3g2", ".3gp2" };
        if (!allowed.Contains(ext)) return Results.BadRequest(new { message = $"File {file.FileName} type not allowed" });

        var rawFileName = Path.GetFileNameWithoutExtension(file.FileName);
        var cleanFileName = string.Concat(rawFileName.Split(Path.GetInvalidFileNameChars())).Replace(" ", "_");
        if (string.IsNullOrWhiteSpace(cleanFileName))
        {
            cleanFileName = "file";
        }

        var baseDisplayName = $"{cleanFileName}{ext}";
        var displayName = baseDisplayName;
        int counter = 1;
        while (existingNames.Contains(displayName) || processedNames.Contains(displayName))
        {
            displayName = $"{cleanFileName} {counter}{ext}";
            counter++;
        }
        processedNames.Add(displayName);

        // Generate a completely unique filename for the physical storage path
        var storageCleanName = string.Concat(Path.GetFileNameWithoutExtension(displayName).Split(Path.GetInvalidFileNameChars())).Replace(" ", "_");
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmssfff");
        var uniqueName = $"{storageCleanName}_{timestamp}_{Guid.NewGuid().ToString("N")[..6]}{ext}";
        
        var fUrl = await storage.UploadFileAsync(file, appId.ToString(), uniqueName);

        var fDb = new FileUpload { ApplicationId = appId, Section = section, FileName = displayName, FilePath = fUrl, FileSize = (int)file.Length, FileType = ext, CreatedAt = DateTime.UtcNow };
        db.FileUploads.Add(fDb);
        await db.SaveChangesAsync();
        uploadedFiles.Add(new { fDb.Id, fDb.FileName, fDb.FilePath });
    }

    return Results.Ok(new { message = "Files uploaded", files = uploadedFiles });
});

api.MapDelete("/application/upload/{fileId}", async (int fileId, InnovationDbContext db, IStorageService storage) =>
{
    var f = await db.FileUploads.FindAsync(fileId);
    if (f == null) return Results.NotFound();
    
    await storage.DeleteFileAsync(f.FilePath);
    
    db.FileUploads.Remove(f);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "File deleted" });
});

// Submit
api.MapPost("/application/submit/{appId}", async (int appId, InnovationDbContext db, HttpContext ctx, AuditService audit, IServiceScopeFactory scopeFactory) =>
{
    var a = await db.Applications.Include(x => x.User).FirstOrDefaultAsync(x => x.Id == appId);
    if (a == null) return Results.NotFound();
    if (a.Status == "SUBMITTED") return Results.BadRequest(new { message = "Already submitted" });
    
    a.Status = "SUBMITTED";
    a.SubmittedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    
    await audit.LogAsync(GetUid(ctx), "SUBMIT_APP", "Application", appId, null, GetIp(ctx));

    // Send application submission email in background
    var email = a.User.Email;
    var name = $"{a.User.FirstName} {a.User.LastName}".Trim();
    if (string.IsNullOrWhiteSpace(name)) name = "User";

    _ = Task.Run(async () =>
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var emailSvc = scope.ServiceProvider.GetRequiredService<EmailService>();
            await emailSvc.SendApplicationSubmissionEmailAsync(email, name, appId);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to send application submission email in background task for application {AppId}", appId);
        }
    });

    return Results.Ok(new { message = "Submitted" });
});

// ========== ADMIN ==========
api.MapGet("/admin/users", async (HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();
    var users = await db.Users.Select(u => new { 
        u.Id, 
        u.FirstName, 
        u.LastName, 
        u.Email, 
        u.Mobile, 
        u.Role, 
        u.CreatedAt,
        ApplicationStatus = db.Applications.Where(a => a.UserId == u.Id).Select(a => a.Status).FirstOrDefault()
    }).ToListAsync();
    return Results.Ok(users);
});

api.MapPost("/admin/reminders/trigger", async (HttpContext ctx, InnovationDbContext db, ReminderEmailBackgroundService reminderService) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    reminderService.TriggerImmediateRun();
    return Results.Ok(new { message = "Reminder email check triggered successfully" });
});

api.MapPut("/admin/users/{id}", async (int id, UserUpdateDto dto, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var admin = await db.Users.FindAsync(uid.Value);
    if (admin?.Role != "ADMIN") return Results.Forbid();

    var user = await db.Users.FindAsync(id);
    if (user == null) return Results.NotFound();

    // Check if email is already taken by another user
    if (db.Users.Any(u => u.Email == dto.Email && u.Id != id))
    {
        return Results.BadRequest(new { message = "Email is already in use by another user" });
    }

    user.FirstName = dto.FirstName;
    user.LastName = dto.LastName;
    user.Email = dto.Email;
    user.Mobile = dto.Mobile;
    user.Role = dto.Role;

    if (!string.IsNullOrWhiteSpace(dto.Password))
    {
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
    }

    await db.SaveChangesAsync();
    await audit.LogAsync(uid.Value, "ADMIN_UPDATE_USER", "User", id, $"Updated details and role to {dto.Role}", GetIp(ctx));
    return Results.Ok(new { message = "User updated successfully" });
});

api.MapGet("/admin/applications", async (HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();
    var apps = await db.Applications.Include(a => a.User).Include(a => a.PersonalInfo)
        .Select(a => new { a.Id, a.Status, submitted_at = a.SubmittedAt, user_name = a.User.FirstName + " " + a.User.LastName,
            user_email = a.User.Email, company = a.PersonalInfo != null ? a.PersonalInfo.CompanyName : null,
            validator_score = db.ValidatorReviews.Where(vr => vr.ApplicationId == a.Id && !vr.IsDraft).Select(vr => (double?)vr.WeightedScore).FirstOrDefault(),
            validator_name = db.ValidatorReviews.Where(vr => vr.ApplicationId == a.Id && !vr.IsDraft)
                .Select(vr => db.Users.Where(u => u.Id == vr.ValidatorId).Select(u => u.FirstName + " " + u.LastName).FirstOrDefault()).FirstOrDefault(),
            jury_approval_count = db.JuryReviews.Count(jr => jr.ApplicationId == a.Id && !jr.IsDraft),
            average_score = db.JuryReviews.Where(jr => jr.ApplicationId == a.Id && !jr.IsDraft).Average(jr => (double?)jr.WeightedScore) ?? 0.0,
            jury_reviews = db.JuryReviews.Where(jr => jr.ApplicationId == a.Id && !jr.IsDraft)
                .Select(jr => new {
                    jr.Id,
                    jr.JuryId,
                    jury_name = jr.Jury.FirstName + " " + jr.Jury.LastName,
                    jr.InnovationIpScore,
                    jr.TeamStrengthScore,
                    jr.BusinessPlanScore,
                    jr.ImpactScore,
                    jr.WeightedScore,
                    jr.Remarks
                }).ToList()
        })
        .ToListAsync();
    return Results.Ok(apps);
});

api.MapPost("/admin/jury", async (HttpRequest req, InnovationDbContext db, IStorageService storage, HttpContext ctx, AuditService audit, IServiceScopeFactory scopeFactory) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    if (!req.HasFormContentType) return Results.BadRequest(new { message = "Invalid content type" });
    var form = await req.ReadFormAsync();

    var name = form["name"].ToString();
    var email = form["email"].ToString();
    var password = form["password"].ToString();
    var role = form["role"].ToString();
    var type = form["type"].ToString();
    var sortOrderStr = form["sortOrder"].ToString();

    if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(role) || string.IsNullOrWhiteSpace(email))
    {
        return Results.BadRequest(new { message = "Name, Role, and Email are required." });
    }

    if (type != "VALIDATOR" && type != "JURY")
    {
        type = "JURY";
    }

    int sortOrder = 0;
    int.TryParse(sortOrderStr, out sortOrder);

    // Sync with users table
    var existingUser = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
    bool isNewUser = (existingUser == null);
    if (existingUser != null)
    {
        var alreadyLinked = await db.JuryMembers.AnyAsync(m => m.Email == email);
        if (alreadyLinked)
        {
            return Results.BadRequest(new { message = "This email is already registered as a Validator/Jury member." });
        }
        
        existingUser.Role = type;
        existingUser.IsActive = true;
        existingUser.IsDeleted = false;
        if (!string.IsNullOrWhiteSpace(password))
        {
            existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
        }
    }
    else
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            return Results.BadRequest(new { message = "Password is required to create login for new member." });
        }

        var parts = name.Split(' ', 2);
        var firstName = parts[0];
        var lastName = parts.Length > 1 ? parts[1] : "";

        var newUser = new User
        {
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = type,
            IsActive = true,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(newUser);
    }

    if (form.Files.Count == 0)
    {
        return Results.BadRequest(new { message = "Profile photo is required." });
    }

    string? imageUrl = null;
    if (form.Files.Count > 0)
    {
        var file = form.Files[0];
        if (file.Length > 5 * 1024 * 1024) return Results.BadRequest(new { message = "Image file exceeds 5MB limit" });
        var ext = Path.GetExtension(file.FileName).ToLower();
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        if (!allowed.Contains(ext)) return Results.BadRequest(new { message = "Image format not allowed" });
        
        var rawFileName = Path.GetFileNameWithoutExtension(file.FileName);
        var cleanFileName = string.Concat(rawFileName.Split(Path.GetInvalidFileNameChars())).Replace(" ", "_");
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
        var uniqueName = $"{cleanFileName}_{timestamp}{ext}";
        imageUrl = await storage.UploadFileAsync(file, "jury", uniqueName);
    }

    var member = new JuryMember
    {
        Name = name,
        Email = email,
        Role = role,
        Type = type,
        SortOrder = sortOrder,
        ImageUrl = imageUrl,
        CreatedAt = DateTime.UtcNow
    };

    db.JuryMembers.Add(member);
    await db.SaveChangesAsync();
    await audit.LogAsync(uid.Value, "ADMIN_CREATE_JURY", "JuryMember", member.Id, $"Added jury member: {name} ({type})", GetIp(ctx));

    // Send invitation email in background
    _ = Task.Run(async () =>
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var emailSvc = scope.ServiceProvider.GetRequiredService<EmailService>();
            await emailSvc.SendJuryInvitationEmailAsync(email, name, type, password, isNewUser);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to send jury invitation email in background task for {Email}", email);
        }
    });

    return Results.Ok(member);
});

api.MapPut("/admin/jury/{id}", async (int id, HttpRequest req, InnovationDbContext db, IStorageService storage, HttpContext ctx, AuditService audit, IServiceScopeFactory scopeFactory) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    var member = await db.JuryMembers.FindAsync(id);
    if (member == null) return Results.NotFound();

    if (!req.HasFormContentType) return Results.BadRequest(new { message = "Invalid content type" });
    var form = await req.ReadFormAsync();

    var name = form["name"].ToString();
    var email = form["email"].ToString();
    var password = form["password"].ToString();
    var role = form["role"].ToString();
    var type = form["type"].ToString();
    var sortOrderStr = form["sortOrder"].ToString();

    if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(role) || string.IsNullOrWhiteSpace(email))
    {
        return Results.BadRequest(new { message = "Name, Role, and Email are required." });
    }

    if (type != "VALIDATOR" && type != "JURY")
    {
        type = "JURY";
    }

    int sortOrder = 0;
    int.TryParse(sortOrderStr, out sortOrder);

    // Sync with users table
    var oldEmail = member.Email;
    if (email != oldEmail && await db.Users.AnyAsync(u => u.Email == email))
    {
        return Results.BadRequest(new { message = "The new email is already taken by another user." });
    }

    var associatedUser = await db.Users.FirstOrDefaultAsync(u => u.Email == oldEmail);
    bool isNewUser = (associatedUser == null);
    bool passwordOrEmailChanged = !string.IsNullOrWhiteSpace(password) || email != oldEmail;

    if (associatedUser != null)
    {
        var parts = name.Split(' ', 2);
        associatedUser.FirstName = parts[0];
        associatedUser.LastName = parts.Length > 1 ? parts[1] : "";
        associatedUser.Email = email;
        associatedUser.Role = type;
        
        if (!string.IsNullOrWhiteSpace(password))
        {
            associatedUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
        }
    }
    else
    {
        var parts = name.Split(' ', 2);
        var firstName = parts[0];
        var lastName = parts.Length > 1 ? parts[1] : "";

        var newUser = new User
        {
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(string.IsNullOrWhiteSpace(password) ? "OppiJury2026!" : password),
            Role = type,
            IsActive = true,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(newUser);
    }

    member.Name = name;
    member.Email = email;
    member.Role = role;
    member.Type = type;
    member.SortOrder = sortOrder;

    if (form.Files.Count == 0 && string.IsNullOrEmpty(member.ImageUrl))
    {
        return Results.BadRequest(new { message = "Profile photo is required." });
    }

    if (form.Files.Count > 0)
    {
        var file = form.Files[0];
        if (file.Length > 5 * 1024 * 1024) return Results.BadRequest(new { message = "Image file exceeds 5MB limit" });
        var ext = Path.GetExtension(file.FileName).ToLower();
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        if (!allowed.Contains(ext)) return Results.BadRequest(new { message = "Image format not allowed" });
        
        // Delete old image if exists
        if (!string.IsNullOrEmpty(member.ImageUrl))
        {
            await storage.DeleteFileAsync(member.ImageUrl);
        }

        var rawFileName = Path.GetFileNameWithoutExtension(file.FileName);
        var cleanFileName = string.Concat(rawFileName.Split(Path.GetInvalidFileNameChars())).Replace(" ", "_");
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
        var uniqueName = $"{cleanFileName}_{timestamp}{ext}";
        member.ImageUrl = await storage.UploadFileAsync(file, "jury", uniqueName);
    }

    await db.SaveChangesAsync();
    await audit.LogAsync(uid.Value, "ADMIN_UPDATE_JURY", "JuryMember", id, $"Updated jury member: {name} ({type})", GetIp(ctx));

    // Send email updates if it was a new user, or if password/email was updated
    if (isNewUser || passwordOrEmailChanged)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var emailSvc = scope.ServiceProvider.GetRequiredService<EmailService>();
                await emailSvc.SendJuryInvitationEmailAsync(email, name, type, password, isNewUser);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Failed to send jury invitation email update in background task for {Email}", email);
            }
        });
    }

    return Results.Ok(member);
});

api.MapPut("/admin/jury/reorder", async (List<JuryReorderDto> items, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    if (items == null || !items.Any()) return Results.BadRequest(new { message = "No items provided." });

    foreach (var item in items)
    {
        var member = await db.JuryMembers.FindAsync(item.Id);
        if (member != null)
        {
            member.SortOrder = item.SortOrder;
        }
    }

    await db.SaveChangesAsync();
    await audit.LogAsync(uid.Value, "ADMIN_REORDER_JURY", "JuryMember", null, "Reordered jury board members", GetIp(ctx));

    return Results.Ok(new { message = "Jury order updated successfully" });
});

api.MapDelete("/admin/jury/{id}", async (int id, InnovationDbContext db, IStorageService storage, HttpContext ctx, AuditService audit) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    var member = await db.JuryMembers.FindAsync(id);
    if (member == null) return Results.NotFound();

    var associatedUser = await db.Users.FirstOrDefaultAsync(u => u.Email == member.Email);
    if (associatedUser != null)
    {
        associatedUser.IsDeleted = true;
        associatedUser.IsActive = false;
    }

    if (!string.IsNullOrEmpty(member.ImageUrl))
    {
        await storage.DeleteFileAsync(member.ImageUrl);
    }

    db.JuryMembers.Remove(member);
    await db.SaveChangesAsync();
    await audit.LogAsync(uid.Value, "ADMIN_DELETE_JURY", "JuryMember", id, $"Deleted jury member: {member.Name}", GetIp(ctx));

    return Results.Ok(new { message = "Jury member deleted successfully" });
});

api.MapPut("/admin/application/{id}/remarks", async (int id, AdminRemarksUpdateDto dto, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    var app = await db.Applications.FindAsync(id);
    if (app == null) return Results.NotFound(new { message = "Application not found" });

    app.Remarks = dto.Remarks;
    await db.SaveChangesAsync();
    await audit.LogAsync(uid.Value, "ADMIN_UPDATE_APPLICATION_REMARKS", "Application", id, $"Remarks updated to: {dto.Remarks}", GetIp(ctx));

    return Results.Ok(new { message = "Remarks updated successfully" });
});

api.MapPut("/admin/validator-review/{id}", async (int id, AdminReviewUpdateDto dto, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    var review = await db.ValidatorReviews.FindAsync(id);
    if (review == null) return Results.NotFound(new { message = "Validator review not found" });

    if (dto.InnovationIpScore < 1 || dto.InnovationIpScore > 5 ||
        dto.TeamStrengthScore < 1 || dto.TeamStrengthScore > 5 ||
        dto.BusinessPlanScore < 1 || dto.BusinessPlanScore > 5 ||
        dto.ImpactScore < 1 || dto.ImpactScore > 5)
    {
        return Results.BadRequest(new { message = "All scores must be between 1 and 5." });
    }

    if (string.IsNullOrWhiteSpace(dto.Remarks))
    {
        return Results.BadRequest(new { message = "Remarks are mandatory." });
    }

    double weightedScore = dto.InnovationIpScore * 0.25 + dto.TeamStrengthScore * 0.25 + dto.BusinessPlanScore * 0.25 + dto.ImpactScore * 0.25;

    review.InnovationIpScore = dto.InnovationIpScore;
    review.TeamStrengthScore = dto.TeamStrengthScore;
    review.BusinessPlanScore = dto.BusinessPlanScore;
    review.ImpactScore = dto.ImpactScore;
    review.WeightedScore = weightedScore;
    review.Remarks = dto.Remarks;

    await db.SaveChangesAsync();
    await audit.LogAsync(uid.Value, "ADMIN_UPDATE_VALIDATOR_REVIEW", "ValidatorReview", id, $"Admin updated scores for application {review.ApplicationId}: IP={dto.InnovationIpScore}, Team={dto.TeamStrengthScore}, Biz={dto.BusinessPlanScore}, Impact={dto.ImpactScore}", GetIp(ctx));

    return Results.Ok(new { message = "Validator review updated successfully", weightedScore });
});

api.MapPut("/admin/jury-review/{id}", async (int id, AdminReviewUpdateDto dto, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();

    var review = await db.JuryReviews.FindAsync(id);
    if (review == null) return Results.NotFound(new { message = "Jury review not found" });

    if (dto.InnovationIpScore < 1 || dto.InnovationIpScore > 5 ||
        dto.TeamStrengthScore < 1 || dto.TeamStrengthScore > 5 ||
        dto.BusinessPlanScore < 1 || dto.BusinessPlanScore > 5 ||
        dto.ImpactScore < 1 || dto.ImpactScore > 5)
    {
        return Results.BadRequest(new { message = "All scores must be between 1 and 5." });
    }

    if (string.IsNullOrWhiteSpace(dto.Remarks))
    {
        return Results.BadRequest(new { message = "Remarks are mandatory." });
    }

    double weightedScore = dto.InnovationIpScore * 0.3 + dto.TeamStrengthScore * 0.2 + dto.BusinessPlanScore * 0.2 + dto.ImpactScore * 0.3;

    review.InnovationIpScore = dto.InnovationIpScore;
    review.TeamStrengthScore = dto.TeamStrengthScore;
    review.BusinessPlanScore = dto.BusinessPlanScore;
    review.ImpactScore = dto.ImpactScore;
    review.WeightedScore = weightedScore;
    review.Remarks = dto.Remarks;

    await db.SaveChangesAsync();
    await audit.LogAsync(uid.Value, "ADMIN_UPDATE_JURY_REVIEW", "JuryReview", id, $"Admin updated scores for application {review.ApplicationId}: IP={dto.InnovationIpScore}, Team={dto.TeamStrengthScore}, Biz={dto.BusinessPlanScore}, Impact={dto.ImpactScore}", GetIp(ctx));

    return Results.Ok(new { message = "Jury review updated successfully", weightedScore });
});

// ========== VALIDATOR ==========
api.MapGet("/validator/applications", async (HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "VALIDATOR" && user?.Role != "ADMIN") return Results.Forbid();
    var apps = await db.Applications.Include(a => a.User).Include(a => a.PersonalInfo)
        .Where(a => a.Status == "SUBMITTED" || 
                    (a.Status == "UNDER_VALIDATOR_REVIEW" && a.ValidatorId == uid.Value) ||
                    db.ValidatorReviews.Any(vr => vr.ApplicationId == a.Id && vr.ValidatorId == uid.Value && !vr.IsDraft))
        .Select(a => new { a.Id, a.Status, submitted_at = a.SubmittedAt, user_name = a.User.FirstName + " " + a.User.LastName,
            user_email = a.User.Email, company = a.PersonalInfo != null ? a.PersonalInfo.CompanyName : null,
            is_approved = db.ValidatorReviews.Any(vr => vr.ApplicationId == a.Id && vr.ValidatorId == uid.Value && !vr.IsDraft),
            draft_scores = db.ValidatorReviews
                .Where(vr => vr.ApplicationId == a.Id && vr.ValidatorId == uid.Value && vr.IsDraft)
                .Select(vr => new { vr.InnovationIpScore, vr.TeamStrengthScore, vr.BusinessPlanScore, vr.ImpactScore, vr.Remarks })
                .FirstOrDefault()
        })
        .ToListAsync();
    return Results.Ok(apps);
});

api.MapPost("/validator/approve/{appId}", async (int appId, ValidatorApprovalDto dto, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    try
    {
        var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
        var a = await db.Applications.FindAsync(appId); if (a == null) return Results.NotFound();

        if (!dto.IsDraft)
        {
            if (string.IsNullOrWhiteSpace(dto.Remarks))
            {
                return Results.BadRequest(new { message = "Remarks are mandatory for approval." });
            }

            if (dto.InnovationIpScore < 1 || dto.InnovationIpScore > 5 ||
                dto.TeamStrengthScore < 1 || dto.TeamStrengthScore > 5 ||
                dto.BusinessPlanScore < 1 || dto.BusinessPlanScore > 5 ||
                dto.ImpactScore < 1 || dto.ImpactScore > 5)
            {
                return Results.BadRequest(new { message = "All scores must be between 1 and 5." });
            }
        }
        else
        {
            if (dto.InnovationIpScore < 0 || dto.InnovationIpScore > 5 ||
                dto.TeamStrengthScore < 0 || dto.TeamStrengthScore > 5 ||
                dto.BusinessPlanScore < 0 || dto.BusinessPlanScore > 5 ||
                dto.ImpactScore < 0 || dto.ImpactScore > 5)
            {
                return Results.BadRequest(new { message = "Draft scores must be between 0 and 5." });
            }
        }

        double weightedScore = dto.InnovationIpScore * 0.25 + dto.TeamStrengthScore * 0.25 + dto.BusinessPlanScore * 0.25 + dto.ImpactScore * 0.25;

        var review = await db.ValidatorReviews.FirstOrDefaultAsync(vr => vr.ApplicationId == appId && vr.ValidatorId == uid.Value);
        if (review == null)
        {
            review = new ValidatorReview
            {
                ApplicationId = appId,
                ValidatorId = uid.Value,
                CreatedAt = DateTime.UtcNow
            };
            db.ValidatorReviews.Add(review);
        }

        review.InnovationIpScore = dto.InnovationIpScore;
        review.TeamStrengthScore = dto.TeamStrengthScore;
        review.BusinessPlanScore = dto.BusinessPlanScore;
        review.ImpactScore = dto.ImpactScore;
        review.WeightedScore = weightedScore;
        review.IsDraft = dto.IsDraft;
        review.Remarks = dto.Remarks;

        if (dto.IsDraft)
        {
            a.Status = "UNDER_VALIDATOR_REVIEW";
            a.ValidatorId = uid;
            a.ValidatorActionAt = DateTime.UtcNow;
        }
        else
        {
            a.Status = "VALIDATOR_APPROVED";
            a.ValidatorId = uid;
            a.ValidatorActionAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        await audit.LogAsync(uid, dto.IsDraft ? "VALIDATOR_SAVE_DRAFT" : "VALIDATOR_APPROVE", "Application", appId, $"Scores: IP={dto.InnovationIpScore}, Team={dto.TeamStrengthScore}, Biz={dto.BusinessPlanScore}, Impact={dto.ImpactScore}, Weighted={weightedScore}", GetIp(ctx));
        return Results.Ok(new { message = dto.IsDraft ? "Draft review saved successfully" : "Approved with scores recorded" });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.ToString());
    }
});

api.MapPost("/validator/reject/{appId}", async (int appId, RejectionDto dto, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    var a = await db.Applications.FindAsync(appId); if (a == null) return Results.NotFound();
    if (string.IsNullOrWhiteSpace(dto.Remarks))
    {
        return Results.BadRequest(new { message = "Remarks are mandatory for rejection." });
    }
    a.Status = "VALIDATOR_REJECTED"; a.ValidatorId = GetUid(ctx); a.ValidatorActionAt = DateTime.UtcNow;
    a.Remarks = dto.Remarks;
    await db.SaveChangesAsync();
    await audit.LogAsync(GetUid(ctx), "VALIDATOR_REJECT", "Application", appId, $"Remarks: {dto.Remarks}", GetIp(ctx));
    return Results.Ok(new { message = "Rejected" });
});

// ========== JURY ==========
api.MapGet("/jury/applications", async (HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "JURY" && user?.Role != "ADMIN") return Results.Forbid();
 
    var reviewedAppIds = await db.JuryReviews
        .Where(jr => jr.JuryId == uid.Value && !jr.IsDraft)
        .Select(jr => jr.ApplicationId)
        .ToListAsync();
 
    var apps = await db.Applications.Include(a => a.User).Include(a => a.PersonalInfo)
        .Where(a => 
            ((a.Status == "VALIDATOR_APPROVED" || a.Status == "UNDER_JURY_REVIEW") && !reviewedAppIds.Contains(a.Id))
            || reviewedAppIds.Contains(a.Id)
        )
        .Select(a => new { a.Id, a.Status, submitted_at = a.SubmittedAt, user_name = a.User.FirstName + " " + a.User.LastName,
            company = a.PersonalInfo != null ? a.PersonalInfo.CompanyName : null,
            is_approved = reviewedAppIds.Contains(a.Id),
            draft_scores = db.JuryReviews
                .Where(jr => jr.ApplicationId == a.Id && jr.JuryId == uid.Value && jr.IsDraft)
                .Select(jr => new { jr.InnovationIpScore, jr.TeamStrengthScore, jr.BusinessPlanScore, jr.ImpactScore, jr.Remarks })
                .FirstOrDefault()
        })
        .ToListAsync();
    return Results.Ok(apps);
});
 
api.MapPost("/jury/approve/{appId}", async (int appId, JuryApprovalDto dto, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "JURY") return Results.Forbid();
 
    var a = await db.Applications.FindAsync(appId); if (a == null) return Results.NotFound();
    if (a.Status != "VALIDATOR_APPROVED" && a.Status != "UNDER_JURY_REVIEW")
    {
        return Results.BadRequest(new { message = "Application is not in a valid state for jury review." });
    }
 
    var existingReview = await db.JuryReviews.FirstOrDefaultAsync(jr => jr.ApplicationId == appId && jr.JuryId == uid.Value);
    if (existingReview != null && !existingReview.IsDraft)
    {
        return Results.BadRequest(new { message = "You have already approved/reviewed this application." });
    }
 
    if (!dto.IsDraft)
    {
        if (string.IsNullOrWhiteSpace(dto.Remarks))
        {
            return Results.BadRequest(new { message = "Remarks are mandatory for approval." });
        }

        if (dto.InnovationIpScore < 1 || dto.InnovationIpScore > 5 ||
            dto.TeamStrengthScore < 1 || dto.TeamStrengthScore > 5 ||
            dto.BusinessPlanScore < 1 || dto.BusinessPlanScore > 5 ||
            dto.ImpactScore < 1 || dto.ImpactScore > 5)
        {
            return Results.BadRequest(new { message = "All scores must be between 1 and 5." });
        }
    }
    else
    {
        if (dto.InnovationIpScore < 0 || dto.InnovationIpScore > 5 ||
            dto.TeamStrengthScore < 0 || dto.TeamStrengthScore > 5 ||
            dto.BusinessPlanScore < 0 || dto.BusinessPlanScore > 5 ||
            dto.ImpactScore < 0 || dto.ImpactScore > 5)
        {
            return Results.BadRequest(new { message = "Draft scores must be between 0 and 5." });
        }
    }
 
    double weightedScore = dto.InnovationIpScore * 0.3 + dto.TeamStrengthScore * 0.2 + dto.BusinessPlanScore * 0.2 + dto.ImpactScore * 0.3;
 
    var review = existingReview;
    if (review == null)
    {
        review = new JuryReview
        {
            ApplicationId = appId,
            JuryId = uid.Value,
            CreatedAt = DateTime.UtcNow
        };
        db.JuryReviews.Add(review);
    }
 
    review.InnovationIpScore = dto.InnovationIpScore;
    review.TeamStrengthScore = dto.TeamStrengthScore;
    review.BusinessPlanScore = dto.BusinessPlanScore;
    review.ImpactScore = dto.ImpactScore;
    review.WeightedScore = weightedScore;
    review.IsDraft = dto.IsDraft;
    review.Remarks = dto.Remarks;
 
    var existingFinalizedReviewsCount = await db.JuryReviews.CountAsync(jr => jr.ApplicationId == appId && jr.JuryId != uid.Value && !jr.IsDraft);
    int totalApprovals = existingFinalizedReviewsCount + (dto.IsDraft ? 0 : 1);
 
    if (totalApprovals >= 3)
    {
        a.Status = "JURY_APPROVED";
        a.JuryId = uid.Value;
        a.JuryActionAt = DateTime.UtcNow;
    }
    else
    {
        a.Status = "UNDER_JURY_REVIEW";
    }
 
    await db.SaveChangesAsync();
    await audit.LogAsync(uid.Value, dto.IsDraft ? "JURY_SAVE_DRAFT" : "JURY_APPROVE", "Application", appId, $"Scores: IP={dto.InnovationIpScore}, Team={dto.TeamStrengthScore}, Biz={dto.BusinessPlanScore}, Impact={dto.ImpactScore}, Weighted={weightedScore}", GetIp(ctx));
 
    return Results.Ok(new { message = dto.IsDraft ? "Draft review saved successfully" : "Approval and scores recorded successfully", approvalsCount = totalApprovals });
});

api.MapPost("/jury/reject/{appId}", async (int appId, RejectionDto dto, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    return Results.BadRequest(new { message = "Jury members are not allowed to reject applications." });
});

app.MapGet("/jury-members", async (InnovationDbContext db) =>
{
    var members = await db.JuryMembers
        .OrderBy(m => m.SortOrder)
        .ThenBy(m => m.Name)
        .Select(m => new { m.Id, m.Name, m.Email, m.Role, m.ImageUrl, m.Type, m.SortOrder })
        .ToListAsync();
    return Results.Ok(members);
});

app.Run();

} catch (Exception ex) { Log.Fatal(ex, "Fatal"); }
finally { Log.CloseAndFlush(); }
