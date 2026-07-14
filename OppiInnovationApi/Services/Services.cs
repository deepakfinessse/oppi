using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OppiInnovationApi.Models;

namespace OppiInnovationApi.Services;

public class JwtService
{
    private readonly InnovationDbContext _db;
    private readonly IConfiguration _config;
    public JwtService(InnovationDbContext db, IConfiguration config) { _db = db; _config = config; }

    public string GenerateAccessToken(User user)
    {
        var key = _config["JwtSettings:Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY") ?? throw new Exception("JWT_KEY missing");
        var claims = new[] {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role ?? "USER"),
            new Claim("userId", user.Id.ToString())
        };
        var token = new JwtSecurityToken(
            _config["JwtSettings:Issuer"] ?? Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "OppiInnovation",
            _config["JwtSettings:Audience"] ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "OppiInnovationUsers",
            claims,
            expires: DateTime.UtcNow.AddMinutes(30),
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<string> GenerateRefreshTokenAsync(User user, string? deviceInfo = null)
    {
        var existing = await _db.RefreshTokens.Where(rt => rt.UserId == user.Id && rt.RevokedAt == null).ToListAsync();
        foreach (var rt in existing) rt.RevokedAt = DateTime.UtcNow;
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        _db.RefreshTokens.Add(new RefreshToken { UserId = user.Id, Token = token,
            ExpiresAt = DateTime.UtcNow.AddDays(30), CreatedAt = DateTime.UtcNow, DeviceInfo = deviceInfo });
        await _db.SaveChangesAsync();
        return token;
    }

    public async Task<(string access, string refresh)?> RefreshAsync(string refreshToken)
    {
        var stored = await _db.RefreshTokens.Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);
        if (stored == null || stored.RevokedAt != null || DateTime.UtcNow >= stored.ExpiresAt) return null;
        stored.RevokedAt = DateTime.UtcNow;
        var at = GenerateAccessToken(stored.User);
        var rt = await GenerateRefreshTokenAsync(stored.User, stored.DeviceInfo);
        return (at, rt);
    }

    public async Task RevokeAllAsync(int userId)
    {
        var tokens = await _db.RefreshTokens.Where(rt => rt.UserId == userId && rt.RevokedAt == null).ToListAsync();
        foreach (var rt in tokens) rt.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public string GeneratePasswordResetToken(User user)
    {
        var key = _config["JwtSettings:Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY") ?? throw new Exception("JWT_KEY missing");
        var claims = new[] {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("purpose", "password_reset")
        };
        var token = new JwtSecurityToken(
            _config["JwtSettings:Issuer"] ?? Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "OppiInnovation",
            _config["JwtSettings:Audience"] ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "OppiInnovationUsers",
            claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public ClaimsPrincipal? ValidatePasswordResetToken(string token)
    {
        var key = _config["JwtSettings:Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY") ?? throw new Exception("JWT_KEY missing");
        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _config["JwtSettings:Issuer"] ?? Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "OppiInnovation",
                ValidAudience = _config["JwtSettings:Audience"] ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "OppiInnovationUsers",
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
            var purposeClaim = principal.FindFirst("purpose")?.Value;
            if (purposeClaim != "password_reset") return null;

            return principal;
        }
        catch
        {
            return null;
        }
    }
}

public class DomainService
{
    private readonly InnovationDbContext _db;
    public DomainService(InnovationDbContext db) { _db = db; }

    public bool IsAllowed(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@')) return false;
        var domain = email.Split('@')[1].Trim().ToLower();
        return _db.AllowedDomains.Any(x => x.IsActive && x.Domain.ToLower() == domain);
    }
}

public class AuditService
{
    private readonly InnovationDbContext _db;
    public AuditService(InnovationDbContext db) { _db = db; }

    public async Task LogAsync(int? userId, string action, string? entityType = null, int? entityId = null, string? details = null, string? ip = null)
    {
        _db.AuditLogs.Add(new AuditLog { UserId = userId, Action = action, EntityType = entityType,
            EntityId = entityId, Details = details, IpAddress = ip, CreatedAt = DateTime.UtcNow });
        await _db.SaveChangesAsync();
    }
}

public interface IStorageService
{
    Task<string> UploadFileAsync(IFormFile file, string subFolder, string uniqueName);
    Task DeleteFileAsync(string fileUrl);
}

public class LocalFileStorageService : IStorageService
{
    private readonly IWebHostEnvironment _env;
    public LocalFileStorageService(IWebHostEnvironment env) { _env = env; }

    public async Task<string> UploadFileAsync(IFormFile file, string subFolder, string uniqueName)
    {
        if (subFolder.Contains("..") || subFolder.Contains(":") || subFolder.Contains("\\") ||
            uniqueName.Contains("..") || uniqueName.Contains(":") || uniqueName.Contains("\\"))
        {
            throw new ArgumentException("Invalid characters or path traversal attempt detected.");
        }
        var uploadsDir = Path.GetFullPath(Path.Combine(_env.WebRootPath, "uploads", subFolder));
        var webRootFullPath = Path.GetFullPath(_env.WebRootPath);
        if (!uploadsDir.StartsWith(webRootFullPath, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Path traversal attempt detected.");
        }
        Directory.CreateDirectory(uploadsDir);
        var filePath = Path.Combine(uploadsDir, uniqueName);
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }
        return $"/uploads/{subFolder}/{uniqueName}";
    }

    public Task DeleteFileAsync(string fileUrl)
    {
        if (string.IsNullOrWhiteSpace(fileUrl)) return Task.CompletedTask;
        if (fileUrl.Contains("..") || fileUrl.Contains(":") || fileUrl.Contains("\\"))
        {
            throw new ArgumentException("Invalid path or path traversal attempt detected.");
        }
        var localPath = Path.GetFullPath(Path.Combine(_env.WebRootPath, fileUrl.TrimStart('/')));
        var webRootFullPath = Path.GetFullPath(_env.WebRootPath);
        if (!localPath.StartsWith(webRootFullPath, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Path traversal attempt detected.");
        }
        if (File.Exists(localPath)) File.Delete(localPath);
        return Task.CompletedTask;
    }
}

public class AzureBlobStorageService : IStorageService
{
    private readonly string _connectionString;
    private readonly string _containerName = "innovation-uploads";

    public AzureBlobStorageService(IConfiguration config)
    {
        _connectionString = config["AzureStorage:ConnectionString"] ?? Environment.GetEnvironmentVariable("AZURE_STORAGE_CONNECTION_STRING")!;
    }

    public async Task<string> UploadFileAsync(IFormFile file, string subFolder, string uniqueName)
    {
        var blobServiceClient = new Azure.Storage.Blobs.BlobServiceClient(_connectionString);
        var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);
        await containerClient.CreateIfNotExistsAsync(Azure.Storage.Blobs.Models.PublicAccessType.Blob);
        
        var blobClient = containerClient.GetBlobClient($"{subFolder}/{uniqueName}");
        using var stream = file.OpenReadStream();
        await blobClient.UploadAsync(stream, new Azure.Storage.Blobs.Models.BlobHttpHeaders { ContentType = file.ContentType });
        
        return blobClient.Uri.ToString();
    }

    public async Task DeleteFileAsync(string fileUrl)
    {
        try
        {
            var uri = new Uri(fileUrl);
            var blobServiceClient = new Azure.Storage.Blobs.BlobServiceClient(_connectionString);
            var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);
            var blobName = string.Join("", uri.Segments.Skip(2));
            var blobClient = containerClient.GetBlobClient(blobName);
            await blobClient.DeleteIfExistsAsync();
        }
        catch { /* Ignore errors on delete */ }
    }
}
