using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;

namespace OppiInnovationApi.Services;

public interface ICaptchaService
{
    (string id, string svgBase64) GenerateCaptcha();
    bool ValidateCaptcha(string? id, string? answer);
}

public class CaptchaService : ICaptchaService
{
    private readonly IMemoryCache _cache;
    private readonly IConfiguration _config;
    private static readonly Random _random = new();
    private const string Chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz23456789"; // Exclude ambiguous chars (0, O, 1, I, l)

    public CaptchaService(IMemoryCache cache, IConfiguration config)
    {
        _cache = cache;
        _config = config;
    }

    private string GetEncryptionKey()
    {
        return _config["JwtSettings:Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY") ?? "FallbackCaptchaSecretKey1234567890";
    }

    private string Encrypt(string plainText, string key)
    {
        byte[] keyBytes = SHA256.HashData(Encoding.UTF8.GetBytes(key));
        
        using var aes = Aes.Create();
        aes.Key = keyBytes;
        aes.GenerateIV();
        
        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream();
        ms.Write(aes.IV, 0, aes.IV.Length);
        
        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        using (var sw = new StreamWriter(cs))
        {
            sw.Write(plainText);
        }
        
        return Convert.ToBase64String(ms.ToArray())
            .Replace('+', '-')
            .Replace('/', '_')
            .Replace("=", ""); // URL-safe base64
    }

    private string? Decrypt(string cipherText, string key)
    {
        try
        {
            string base64 = cipherText.Replace('-', '+').Replace('_', '/');
            switch (base64.Length % 4)
            {
                case 2: base64 += "=="; break;
                case 3: base64 += "="; break;
            }
            
            byte[] fullCipher = Convert.FromBase64String(base64);
            byte[] keyBytes = SHA256.HashData(Encoding.UTF8.GetBytes(key));
            
            using var aes = Aes.Create();
            aes.Key = keyBytes;
            
            byte[] iv = new byte[aes.BlockSize / 8];
            byte[] cipherBytes = new byte[fullCipher.Length - iv.Length];
            
            Array.Copy(fullCipher, 0, iv, 0, iv.Length);
            Array.Copy(fullCipher, iv.Length, cipherBytes, 0, cipherBytes.Length);
            
            aes.IV = iv;
            
            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            using var ms = new MemoryStream(cipherBytes);
            using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
            using var sr = new StreamReader(cs);
            
            return sr.ReadToEnd();
        }
        catch
        {
            return null;
        }
    }

    public (string id, string svgBase64) GenerateCaptcha()
    {
        // Generate a 5-character random code
        var codeBuilder = new StringBuilder();
        for (int i = 0; i < 5; i++)
        {
            codeBuilder.Append(Chars[_random.Next(Chars.Length)]);
        }
        var code = codeBuilder.ToString();

        // Expire in 5 minutes
        var expiration = DateTime.UtcNow.AddMinutes(5).Ticks.ToString();
        var plainText = $"{code}|{expiration}";
        
        var key = GetEncryptionKey();
        var id = Encrypt(plainText, key);

        // Generate SVG
        var width = 160;
        var height = 50;
        var svgBuilder = new StringBuilder();
        svgBuilder.Append($"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{width}\" height=\"{height}\" viewBox=\"0 0 {width} {height}\" style=\"border: 1px solid #cbd5e1; border-radius: 8px; user-select: none;\">");
        
        // Background - subtle gradient
        svgBuilder.Append("<defs>");
        svgBuilder.Append("<linearGradient id=\"grad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">");
        svgBuilder.Append("<stop offset=\"0%\" style=\"stop-color:#f8fafc;stop-opacity:1\" />");
        svgBuilder.Append("<stop offset=\"100%\" style=\"stop-color:#f1f5f9;stop-opacity:1\" />");
        svgBuilder.Append("</linearGradient>");
        svgBuilder.Append("</defs>");
        svgBuilder.Append("<rect width=\"100%\" height=\"100%\" fill=\"url(#grad)\" />");

        // Draw background grid lines for visual noise
        for (int x = 10; x < width; x += 15)
        {
            svgBuilder.Append($"<line x1=\"{x}\" y1=\"0\" x2=\"{x + _random.Next(-5, 5)}\" y2=\"{height}\" stroke=\"#cbd5e1\" stroke-width=\"0.5\" />");
        }
        for (int y = 10; y < height; y += 10)
        {
            svgBuilder.Append($"<line x1=\"0\" y1=\"{y}\" x2=\"{width}\" y2=\"{y + _random.Next(-5, 5)}\" stroke=\"#cbd5e1\" stroke-width=\"0.5\" />");
        }

        // Add distinct noise lines
        string[] colors = { "#2563eb", "#16a34a", "#dc2626", "#d97706", "#4b5563", "#7c3aed", "#0891b2" };
        for (int i = 0; i < 4; i++)
        {
            var x1 = _random.Next(5, width - 5);
            var y1 = _random.Next(5, height - 5);
            var x2 = _random.Next(5, width - 5);
            var y2 = _random.Next(5, height - 5);
            var color = colors[_random.Next(colors.Length)];
            svgBuilder.Append($"<line x1=\"{x1}\" y1=\"{y1}\" x2=\"{x2}\" y2=\"{y2}\" stroke=\"{color}\" stroke-width=\"1.5\" opacity=\"0.4\" />");
        }

        // Draw rotated characters
        for (int i = 0; i < code.Length; i++)
        {
            var character = code[i];
            var fontSize = _random.Next(24, 30);
            var angle = _random.Next(-25, 25);
            var x = 15 + i * 28 + _random.Next(-3, 3);
            var y = 35 + _random.Next(-3, 3);
            var color = colors[_random.Next(colors.Length)];
            
            // Render rotated letter in SVG
            svgBuilder.Append($"<text x=\"{x}\" y=\"{y}\" font-family=\"Courier New, monospace\" font-size=\"{fontSize}\" font-weight=\"bold\" fill=\"{color}\" transform=\"rotate({angle} {x} {y})\">{character}</text>");
        }

        // Add subtle background noise dots
        for (int i = 0; i < 20; i++)
        {
            var cx = _random.Next(0, width);
            var cy = _random.Next(0, height);
            var r = _random.Next(1, 3);
            var color = colors[_random.Next(colors.Length)];
            svgBuilder.Append($"<circle cx=\"{cx}\" cy=\"{cy}\" r=\"{r}\" fill=\"{color}\" opacity=\"0.25\" />");
        }

        svgBuilder.Append("</svg>");

        var base64Svg = Convert.ToBase64String(Encoding.UTF8.GetBytes(svgBuilder.ToString()));
        var dataUri = $"data:image/svg+xml;base64,{base64Svg}";

        return (id, dataUri);
    }

    public bool ValidateCaptcha(string? id, string? answer)
    {
        if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(answer))
        {
            return false;
        }

        var key = GetEncryptionKey();
        var decrypted = Decrypt(id, key);
        if (string.IsNullOrWhiteSpace(decrypted))
        {
            return false;
        }

        var parts = decrypted.Split('|');
        if (parts.Length != 2)
        {
            return false;
        }

        var expectedCode = parts[0];
        if (!long.TryParse(parts[1], out var expirationTicks))
        {
            return false;
        }

        var expiration = new DateTime(expirationTicks, DateTimeKind.Utc);
        if (DateTime.UtcNow > expiration)
        {
            return false; // Expired
        }

        // Replay attack prevention: track recently verified captcha ids in memory cache for their remaining lifetime
        var cacheKey = $"used_captcha_{id.GetHashCode()}";
        if (_cache.TryGetValue(cacheKey, out _))
        {
            return false; // Already validated once
        }
        
        var remainingTime = expiration - DateTime.UtcNow;
        if (remainingTime.TotalSeconds > 0)
        {
            _cache.Set(cacheKey, true, remainingTime);
        }

        return string.Equals(expectedCode, answer.Trim(), StringComparison.Ordinal);
    }
}
