using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Fsbox.Api.Infrastructure;

public static class EndpointExtensions
{
    /// <summary>Tüm sürümlü uçların ortak öneki.</summary>
    public const string ApiPrefix = "/api/v1";

    public static IServiceCollection AddEndpoints(this IServiceCollection services)
    {
        var descriptors = typeof(IEndpoint).Assembly
            .DefinedTypes
            .Where(type => type is { IsAbstract: false, IsInterface: false }
                           && type.IsAssignableTo(typeof(IEndpoint)))
            .Select(type => ServiceDescriptor.Transient(typeof(IEndpoint), type));

        services.TryAddEnumerable(descriptors);
        return services;
    }

    public static WebApplication MapEndpoints(this WebApplication app)
    {
        var routes = app.MapGroup(ApiPrefix);

        foreach (var endpoint in app.Services.GetRequiredService<IEnumerable<IEndpoint>>())
        {
            endpoint.Map(routes);
        }

        return app;
    }
}
