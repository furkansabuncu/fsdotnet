using Fsdotnet.Api.Infrastructure;

namespace Fsdotnet.Api.Features.Health;

public sealed record HealthResponse(string Status, string Version);

/// <summary>
/// Dağıtım doğrulaması ve uptime kontrolü — aynı zamanda dikey dilim deseninin
/// çalışan en küçük örneği.
/// </summary>
public sealed class HealthEndpoint : IEndpoint
{
    private static readonly string Version =
        typeof(HealthEndpoint).Assembly.GetName().Version?.ToString(3) ?? "0.0.0";

    public void Map(IEndpointRouteBuilder routes) =>
        routes.MapGet("/health", () => new HealthResponse("ok", Version))
            .WithName("Health")
            .WithSummary("Liveness probe");
}
