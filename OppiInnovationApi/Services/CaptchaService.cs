using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Extensions.Caching.Memory;

namespace OppiInnovationApi.Services;

public interface ICaptchaService
{
    (string id, string svgBase64, string instruction) GenerateCaptcha();
    bool ValidateCaptcha(string? id, double? clickX, double? clickY);
}

public class CaptchaService : ICaptchaService
{
    private readonly IMemoryCache _cache;
    private static readonly Random _random = new();

    private static readonly List<(string name, string hex)> Colors = new()
    {
        ("red", "#ef4444"),
        ("blue", "#3b82f6"),
        ("green", "#10b981"),
        ("purple", "#8b5cf6"),
        ("orange", "#f97316")
    };

    private static readonly List<string> ShapeTypes = new() { "circle", "square", "triangle" };

    public CaptchaService(IMemoryCache cache)
    {
        _cache = cache;
    }

    public (string id, string svgBase64, string instruction) GenerateCaptcha()
    {
        var id = Guid.NewGuid().ToString();

        // 1. Determine positions for the 3 shapes
        // Use 3 distinct sectors to ensure they never overlap
        var sectors = new List<int> { 0, 1, 2 };
        sectors = sectors.OrderBy(_ => _random.Next()).ToList();

        var positions = new List<(int x, int y)>();
        // Sector 1: x from 25 to 50
        positions.Add((_random.Next(25, 51), _random.Next(20, 45)));
        // Sector 2: x from 80 to 110
        positions.Add((_random.Next(80, 111), _random.Next(20, 45)));
        // Sector 3: x from 140 to 170
        positions.Add((_random.Next(140, 171), _random.Next(20, 45)));

        // 2. Select distinct colors
        var shuffledColors = Colors.OrderBy(_ => _random.Next()).Take(3).ToList();

        // 3. Define the shapes
        var shapes = new List<CaptchaShape>();
        for (int i = 0; i < 3; i++)
        {
            var sectorIndex = sectors[i];
            var (x, y) = positions[sectorIndex];
            shapes.Add(new CaptchaShape
            {
                Type = ShapeTypes[i],
                ColorName = shuffledColors[i].name,
                ColorHex = shuffledColors[i].hex,
                X = x,
                Y = y
            });
        }

        // 4. Select a target shape
        var targetShape = shapes[_random.Next(shapes.Count)];
        var instruction = $"Click on the {targetShape.ColorName} {targetShape.Type}";

        // 5. Store target coordinates in memory cache for 5 minutes
        _cache.Set($"captcha_{id}", $"{targetShape.X},{targetShape.Y}", TimeSpan.FromMinutes(5));

        // 6. Generate SVG
        var width = 200;
        var height = 65;
        var svgBuilder = new StringBuilder();
        svgBuilder.Append($"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{width}\" height=\"{height}\" viewBox=\"0 0 {width} {height}\" style=\"border: 1px solid #cbd5e1; border-radius: 8px; user-select: none;\">");

        // Subtle background grid/gradient
        svgBuilder.Append("<defs>");
        svgBuilder.Append("<linearGradient id=\"clickGrad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">");
        svgBuilder.Append("<stop offset=\"0%\" style=\"stop-color:#f8fafc;stop-opacity:1\" />");
        svgBuilder.Append("<stop offset=\"100%\" style=\"stop-color:#f1f5f9;stop-opacity:1\" />");
        svgBuilder.Append("</linearGradient>");
        svgBuilder.Append("</defs>");
        svgBuilder.Append("<rect width=\"100%\" height=\"100%\" fill=\"url(#clickGrad)\" />");

        // Add some noise grid lines
        for (int x = 15; x < width; x += 20)
        {
            svgBuilder.Append($"<line x1=\"{x}\" y1=\"0\" x2=\"{x + _random.Next(-3, 4)}\" y2=\"{height}\" stroke=\"#e2e8f0\" stroke-width=\"0.5\" />");
        }
        for (int y = 10; y < height; y += 15)
        {
            svgBuilder.Append($"<line x1=\"0\" y1=\"{y}\" x2=\"{width}\" y2=\"{y + _random.Next(-3, 4)}\" stroke=\"#e2e8f0\" stroke-width=\"0.5\" />");
        }

        // Add random noise lines
        string[] noiseColors = { "#cbd5e1", "#e2e8f0", "#94a3b8" };
        for (int i = 0; i < 3; i++)
        {
            var x1 = _random.Next(5, width - 5);
            var y1 = _random.Next(5, height - 5);
            var x2 = _random.Next(5, width - 5);
            var y2 = _random.Next(5, height - 5);
            var strokeCol = noiseColors[_random.Next(noiseColors.Length)];
            svgBuilder.Append($"<line x1=\"{x1}\" y1=\"{y1}\" x2=\"{x2}\" y2=\"{y2}\" stroke=\"{strokeCol}\" stroke-width=\"1\" opacity=\"0.5\" />");
        }

        // Draw the 3 shapes
        foreach (var shape in shapes)
        {
            if (shape.Type == "circle")
            {
                svgBuilder.Append($"<circle cx=\"{shape.X}\" cy=\"{shape.Y}\" r=\"12\" fill=\"{shape.ColorHex}\" stroke=\"#ffffff\" stroke-width=\"1\" />");
            }
            else if (shape.Type == "square")
            {
                svgBuilder.Append($"<rect x=\"{shape.X - 11}\" y=\"{shape.Y - 11}\" width=\"22\" height=\"22\" rx=\"2\" fill=\"{shape.ColorHex}\" stroke=\"#ffffff\" stroke-width=\"1\" />");
            }
            else if (shape.Type == "triangle")
            {
                svgBuilder.Append($"<polygon points=\"{shape.X},{shape.Y - 13} {shape.X - 13},{shape.Y + 11} {shape.X + 13},{shape.Y + 11}\" fill=\"{shape.ColorHex}\" stroke=\"#ffffff\" stroke-width=\"1\" />");
            }
        }

        // Draw some visual noise dots
        for (int i = 0; i < 15; i++)
        {
            var cx = _random.Next(0, width);
            var cy = _random.Next(0, height);
            var r = _random.Next(1, 3);
            svgBuilder.Append($"<circle cx=\"{cx}\" cy=\"{cy}\" r=\"{r}\" fill=\"#94a3b8\" opacity=\"0.3\" />");
        }

        svgBuilder.Append("</svg>");

        var base64Svg = Convert.ToBase64String(Encoding.UTF8.GetBytes(svgBuilder.ToString()));
        var dataUri = $"data:image/svg+xml;base64,{base64Svg}";

        return (id, dataUri, instruction);
    }

    public bool ValidateCaptcha(string? id, double? clickX, double? clickY)
    {
        if (string.IsNullOrWhiteSpace(id) || clickX == null || clickY == null)
        {
            return false;
        }

        var key = $"captcha_{id}";
        if (_cache.TryGetValue<string>(key, out var targetCoords))
        {
            _cache.Remove(key); // Clear immediately

            var parts = targetCoords.Split(',');
            if (parts.Length == 2 && 
                double.TryParse(parts[0], out var tx) && 
                double.TryParse(parts[1], out var ty))
            {
                // Verify if click is within tolerance radius of 20px
                var dx = clickX.Value - tx;
                var dy = clickY.Value - ty;
                var distance = Math.Sqrt(dx * dx + dy * dy);
                return distance <= 20.0;
            }
        }

        return false;
    }

    private class CaptchaShape
    {
        public string Type { get; set; } = null!;
        public string ColorName { get; set; } = null!;
        public string ColorHex { get; set; } = null!;
        public int X { get; set; }
        public int Y { get; set; }
    }
}
