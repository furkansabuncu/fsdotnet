using System.Threading.RateLimiting;
using Fsdotnet.Api.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

const string WebCorsPolicy = "web";

builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddEndpoints();

// ADR-0001 gereği buraya yalnızca gerçek bir parser/derleyici gerektiren araçlar
// gelir. Yani her endpoint tanımı gereği düşmanca girdi ayrıştırır ve açıkça
// sınırlandırılmalıdır.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 60,
                Window = TimeSpan.FromMinutes(1),
            }));
});

builder.Services.AddCors(options => options.AddPolicy(WebCorsPolicy, policy => policy
    .WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
    .AllowAnyHeader()
    .AllowAnyMethod()));

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors(WebCorsPolicy);
app.UseRateLimiter();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapEndpoints();

await app.RunAsync();

/// <summary>
/// Entegrasyon testlerinin <c>WebApplicationFactory&lt;Program&gt;</c> ile
/// uygulamayı ayağa kaldırabilmesi için gereken açık tip.
/// </summary>
public partial class Program;
