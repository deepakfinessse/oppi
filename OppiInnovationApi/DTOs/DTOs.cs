namespace OppiInnovationApi.DTOs;

public class RegisterDto
{
    public string First_Name { get; set; } = null!;
    public string Last_Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Mobile { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? CaptchaId { get; set; }
    public double? ClickX { get; set; }
    public double? ClickY { get; set; }
}

public class LoginDto
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? CaptchaId { get; set; }
    public double? ClickX { get; set; }
    public double? ClickY { get; set; }
}

public class ForgotPasswordDto
{
    public string Email { get; set; } = null!;
    public string? CaptchaId { get; set; }
    public double? ClickX { get; set; }
    public double? ClickY { get; set; }
}

public class ChangePasswordDto
{
    public string Old_Password { get; set; } = null!;
    public string New_Password { get; set; } = null!;
    public string? CaptchaId { get; set; }
    public double? ClickX { get; set; }
    public double? ClickY { get; set; }
}

public class PersonalInfoDto
{
    public string? Company_Name { get; set; }
    public string? Designation { get; set; }
    public string? Category_Of_Work { get; set; }
    public string? Other_Category { get; set; }
    public string? Company_Website { get; set; }
    public string? Company_Brief { get; set; }
    public string? Innovation { get; set; }
    public string? Competitive_Analysis { get; set; }
    public string? Need_Analysis { get; set; }
    public string? Marketability { get; set; }
}

public class CompanyReachDto
{
    public string? Marketing_Strategy { get; set; }
    public string? App_Details { get; set; }
    public string? Website_Details { get; set; }
    public string? Social_Media { get; set; }
    public string? Physical_Outlets { get; set; }
    public string? Future_Expansion { get; set; }
}

public class CompanyDetailsDto
{
    public string? Customer_Benefit { get; set; }
    public string? Testimonial { get; set; }
    public string? Employee_Count { get; set; }
    public string? Board_Of_Directors { get; set; }
    public string? Investors_Details { get; set; }
    public string? Media_Mentions { get; set; }
    public string? Patents { get; set; }
    public string? Product_Benefits { get; set; }
}

public class JuryApprovalDto
{
    public int InnovationIpScore { get; set; }
    public int TeamStrengthScore { get; set; }
    public int BusinessPlanScore { get; set; }
    public int ImpactScore { get; set; }
    public bool IsDraft { get; set; }
    public string? Remarks { get; set; }
}

public class ValidatorApprovalDto
{
    public int InnovationIpScore { get; set; }
    public int TeamStrengthScore { get; set; }
    public int BusinessPlanScore { get; set; }
    public int ImpactScore { get; set; }
    public bool IsDraft { get; set; }
    public string? Remarks { get; set; }
}

public class UserUpdateDto
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Mobile { get; set; }
    public string Role { get; set; } = null!;
    public string? Password { get; set; }
}

public class ResetPasswordDto
{
    public string Token { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public class RejectionDto
{
    public string Remarks { get; set; } = null!;
}

public class AdminReviewUpdateDto
{
    public int InnovationIpScore { get; set; }
    public int TeamStrengthScore { get; set; }
    public int BusinessPlanScore { get; set; }
    public int ImpactScore { get; set; }
    public string? Remarks { get; set; }
}

public class AdminRemarksUpdateDto
{
    public string? Remarks { get; set; }
}

public class JuryReorderDto
{
    public int Id { get; set; }
    public int SortOrder { get; set; }
}


