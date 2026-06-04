using FluentValidation;
using OppiInnovationApi.DTOs;

namespace OppiInnovationApi.Validators;

public class RegisterValidator : AbstractValidator<RegisterDto>
{
    public RegisterValidator()
    {
        RuleFor(x => x.First_Name).NotEmpty().MinimumLength(2).MaximumLength(100);
        RuleFor(x => x.Last_Name).NotEmpty().MinimumLength(2).MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Mobile).NotEmpty().Matches(@"^\d{10}$").WithMessage("Must be 10 digits");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8)
            .Matches(@"[A-Z]").WithMessage("Need uppercase")
            .Matches(@"[a-z]").WithMessage("Need lowercase")
            .Matches(@"\d").WithMessage("Need digit");
    }
}

public class LoginValidator : AbstractValidator<LoginDto>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}
