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

var connStr = builder.Configuration.GetConnectionString("DefaultConnection") ?? Environment.GetEnvironmentVariable("DB_CONNECTION") ?? throw new Exception("DB_CONNECTION missing");
var jwtKey = builder.Configuration["JwtSettings:Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY") ?? throw new Exception("JWT_KEY missing");
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "OppiInnovation";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "OppiInnovationUsers";
var allowedOrigins = builder.Configuration["AllowedOrigins"] ?? Environment.GetEnvironmentVariable("ALLOWED_ORIGINS") ?? "http://localhost:5174";

builder.Services.AddDbContext<InnovationDbContext>(o => o.UseMySql(connStr, ServerVersion.AutoDetect(connStr)));
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<DomainService>();
builder.Services.AddScoped<AuditService>();
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
app.UseMiddleware<GlobalExceptionMiddleware>();

var uploadsDir = Path.Combine(builder.Environment.WebRootPath, "uploads");
Directory.CreateDirectory(uploadsDir);

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

auth.MapPost("/register", async (RegisterDto dto, InnovationDbContext db, DomainService ds,
    JwtService jwt, AuditService audit, IValidator<RegisterDto> v, HttpContext ctx) =>
{
    var vr = await v.ValidateAsync(dto);
    if (!vr.IsValid) return Results.BadRequest(new { errors = vr.Errors.Select(e => e.ErrorMessage) });
    if (!ds.IsAllowed(dto.Email)) return Results.BadRequest(new { message = "Domain not allowed. Only authorized domains can register." });
    if (db.Users.Any(x => x.Email == dto.Email)) return Results.BadRequest(new { message = "Email already registered" });

    var user = new User { FirstName = dto.First_Name, LastName = dto.Last_Name, Email = dto.Email,
        Mobile = dto.Mobile, PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
        Role = "USER", CreatedAt = DateTime.UtcNow };
    db.Users.Add(user); await db.SaveChangesAsync();

    var at = jwt.GenerateAccessToken(user);
    var rt = await jwt.GenerateRefreshTokenAsync(user, ctx.Request.Headers.UserAgent);
    await audit.LogAsync(user.Id, "REGISTER", "User", user.Id, null, GetIp(ctx));

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

auth.MapPost("/forgot-password", async (ForgotPasswordDto dto, InnovationDbContext db) =>
{
    var user = db.Users.FirstOrDefault(x => x.Email == dto.Email);
    if (user == null) return Results.BadRequest(new { message = "Email not found" });
    // In production, send email with temp password. For now, generate and return it.
    var newPwd = Guid.NewGuid().ToString()[..8] + "A1!";
    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPwd);
    await db.SaveChangesAsync();
    return Results.Ok(new { message = "New password generated", temp_password = newPwd });
});

auth.MapPost("/change-password", async (ChangePasswordDto dto, HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value); if (user == null) return Results.NotFound();
    if (!BCrypt.Net.BCrypt.Verify(dto.Old_Password, user.PasswordHash))
        return Results.BadRequest(new { message = "Current password is incorrect" });
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
    return Results.Ok(new { id = a.Id, status = a.Status, submitted_at = a.SubmittedAt,
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
            vr.CreatedAt
        })
        .ToListAsync();

    double avgScore = juryReviews.Any() ? juryReviews.Average(r => r.WeightedScore) : 0.0;

    return Results.Ok(new { id = a.Id, status = a.Status, submitted_at = a.SubmittedAt,
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
        jury_approval_count = juryReviews.Count
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

    foreach (var file in files)
    {
        if (file.Length > 8 * 1024 * 1024) return Results.BadRequest(new { message = $"File {file.FileName} exceeds 8MB limit" });
        
        var ext = Path.GetExtension(file.FileName).ToLower();
        var allowed = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".mp4", ".mov" };
        if (!allowed.Contains(ext)) return Results.BadRequest(new { message = $"File {file.FileName} type not allowed" });

        var uniqueName = $"{Guid.NewGuid()}{ext}";
        var fUrl = await storage.UploadFileAsync(file, appId.ToString(), uniqueName);

        var fDb = new FileUpload { ApplicationId = appId, Section = section, FileName = file.FileName, FilePath = fUrl, FileSize = (int)file.Length, FileType = ext, CreatedAt = DateTime.UtcNow };
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
api.MapPost("/application/submit/{appId}", async (int appId, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    var a = await db.Applications.FindAsync(appId);
    if (a == null) return Results.NotFound(); if (a.Status == "SUBMITTED") return Results.BadRequest(new { message = "Already submitted" });
    a.Status = "SUBMITTED"; a.SubmittedAt = DateTime.UtcNow; await db.SaveChangesAsync();
    await audit.LogAsync(GetUid(ctx), "SUBMIT_APP", "Application", appId, null, GetIp(ctx));
    return Results.Ok(new { message = "Submitted" });
});

// ========== ADMIN ==========
api.MapGet("/admin/users", async (HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();
    var users = await db.Users.Select(u => new { u.Id, u.FirstName, u.LastName, u.Email, u.Mobile, u.Role, u.CreatedAt }).ToListAsync();
    return Results.Ok(users);
});

api.MapGet("/admin/applications", async (HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "ADMIN") return Results.Forbid();
    var apps = await db.Applications.Include(a => a.User).Include(a => a.PersonalInfo)
        .Select(a => new { a.Id, a.Status, a.SubmittedAt, user_name = a.User.FirstName + " " + a.User.LastName,
            user_email = a.User.Email, company = a.PersonalInfo != null ? a.PersonalInfo.CompanyName : null,
            validator_score = db.ValidatorReviews.Where(vr => vr.ApplicationId == a.Id).Select(vr => (double?)vr.WeightedScore).FirstOrDefault(),
            validator_name = db.ValidatorReviews.Where(vr => vr.ApplicationId == a.Id)
                .Select(vr => db.Users.Where(u => u.Id == vr.ValidatorId).Select(u => u.FirstName + " " + u.LastName).FirstOrDefault()).FirstOrDefault(),
            jury_approval_count = db.JuryReviews.Count(jr => jr.ApplicationId == a.Id),
            average_score = db.JuryReviews.Where(jr => jr.ApplicationId == a.Id).Average(jr => (double?)jr.WeightedScore) ?? 0.0 })
        .ToListAsync();
    return Results.Ok(apps);
});

// ========== VALIDATOR ==========
api.MapGet("/validator/applications", async (HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "VALIDATOR" && user?.Role != "ADMIN") return Results.Forbid();
    var apps = await db.Applications.Include(a => a.User).Include(a => a.PersonalInfo)
        .Where(a => a.Status == "SUBMITTED")
        .Select(a => new { a.Id, a.Status, a.SubmittedAt, user_name = a.User.FirstName + " " + a.User.LastName,
            user_email = a.User.Email, company = a.PersonalInfo != null ? a.PersonalInfo.CompanyName : null })
        .ToListAsync();
    return Results.Ok(apps);
});

api.MapPost("/validator/approve/{appId}", async (int appId, ValidatorApprovalDto dto, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var a = await db.Applications.FindAsync(appId); if (a == null) return Results.NotFound();

    if (dto.InnovationIpScore < 1 || dto.InnovationIpScore > 5 ||
        dto.TeamStrengthScore < 1 || dto.TeamStrengthScore > 5 ||
        dto.BusinessPlanScore < 1 || dto.BusinessPlanScore > 5 ||
        dto.ImpactScore < 1 || dto.ImpactScore > 5)
    {
        return Results.BadRequest(new { message = "All scores must be between 1 and 5." });
    }

    double weightedScore = dto.InnovationIpScore * 0.25 + dto.TeamStrengthScore * 0.25 + dto.BusinessPlanScore * 0.25 + dto.ImpactScore * 0.25;

    var review = new ValidatorReview
    {
        ApplicationId = appId,
        ValidatorId = uid.Value,
        InnovationIpScore = dto.InnovationIpScore,
        TeamStrengthScore = dto.TeamStrengthScore,
        BusinessPlanScore = dto.BusinessPlanScore,
        ImpactScore = dto.ImpactScore,
        WeightedScore = weightedScore,
        CreatedAt = DateTime.UtcNow
    };
    db.ValidatorReviews.Add(review);

    a.Status = "VALIDATOR_APPROVED"; a.ValidatorId = uid; a.ValidatorActionAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    await audit.LogAsync(uid, "VALIDATOR_APPROVE", "Application", appId, $"Scores: IP={dto.InnovationIpScore}, Team={dto.TeamStrengthScore}, Biz={dto.BusinessPlanScore}, Impact={dto.ImpactScore}, Weighted={weightedScore}", GetIp(ctx));
    return Results.Ok(new { message = "Approved with scores recorded" });
});

api.MapPost("/validator/reject/{appId}", async (int appId, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    var a = await db.Applications.FindAsync(appId); if (a == null) return Results.NotFound();
    a.Status = "VALIDATOR_REJECTED"; a.ValidatorId = GetUid(ctx); a.ValidatorActionAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    await audit.LogAsync(GetUid(ctx), "VALIDATOR_REJECT", "Application", appId, null, GetIp(ctx));
    return Results.Ok(new { message = "Rejected" });
});

// ========== JURY ==========
api.MapGet("/jury/applications", async (HttpContext ctx, InnovationDbContext db) =>
{
    var uid = GetUid(ctx); if (uid == null) return Results.Unauthorized();
    var user = await db.Users.FindAsync(uid.Value);
    if (user?.Role != "JURY" && user?.Role != "ADMIN") return Results.Forbid();

    var reviewedAppIds = await db.JuryReviews
        .Where(jr => jr.JuryId == uid.Value)
        .Select(jr => jr.ApplicationId)
        .ToListAsync();

    var apps = await db.Applications.Include(a => a.User).Include(a => a.PersonalInfo)
        .Where(a => (a.Status == "VALIDATOR_APPROVED" || a.Status == "UNDER_JURY_REVIEW") && !reviewedAppIds.Contains(a.Id))
        .Select(a => new { a.Id, a.Status, a.SubmittedAt, user_name = a.User.FirstName + " " + a.User.LastName,
            company = a.PersonalInfo != null ? a.PersonalInfo.CompanyName : null })
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
    if (existingReview != null)
    {
        return Results.BadRequest(new { message = "You have already approved/reviewed this application." });
    }

    if (dto.InnovationIpScore < 1 || dto.InnovationIpScore > 5 ||
        dto.TeamStrengthScore < 1 || dto.TeamStrengthScore > 5 ||
        dto.BusinessPlanScore < 1 || dto.BusinessPlanScore > 5 ||
        dto.ImpactScore < 1 || dto.ImpactScore > 5)
    {
        return Results.BadRequest(new { message = "All scores must be between 1 and 5." });
    }

    double weightedScore = (dto.InnovationIpScore + dto.TeamStrengthScore + dto.BusinessPlanScore + dto.ImpactScore) / 4.0;

    var review = new JuryReview
    {
        ApplicationId = appId,
        JuryId = uid.Value,
        InnovationIpScore = dto.InnovationIpScore,
        TeamStrengthScore = dto.TeamStrengthScore,
        BusinessPlanScore = dto.BusinessPlanScore,
        ImpactScore = dto.ImpactScore,
        WeightedScore = weightedScore,
        CreatedAt = DateTime.UtcNow
    };
    db.JuryReviews.Add(review);

    var existingReviewsCount = await db.JuryReviews.CountAsync(jr => jr.ApplicationId == appId);
    int totalApprovals = existingReviewsCount + 1; // including current review

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
    await audit.LogAsync(uid.Value, "JURY_APPROVE", "Application", appId, $"Scores: IP={dto.InnovationIpScore}, Team={dto.TeamStrengthScore}, Biz={dto.BusinessPlanScore}, Impact={dto.ImpactScore}, Weighted={weightedScore}", GetIp(ctx));

    return Results.Ok(new { message = "Approval and scores recorded successfully", approvalsCount = totalApprovals });
});

api.MapPost("/jury/reject/{appId}", async (int appId, InnovationDbContext db, HttpContext ctx, AuditService audit) =>
{
    var a = await db.Applications.FindAsync(appId); if (a == null) return Results.NotFound();
    a.Status = "JURY_REJECTED"; a.JuryId = GetUid(ctx); a.JuryActionAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    await audit.LogAsync(GetUid(ctx), "JURY_REJECT", "Application", appId, null, GetIp(ctx));
    return Results.Ok(new { message = "Final Rejected" });
});

app.Run();
} catch (Exception ex) { Log.Fatal(ex, "Fatal"); }
finally { Log.CloseAndFlush(); }
