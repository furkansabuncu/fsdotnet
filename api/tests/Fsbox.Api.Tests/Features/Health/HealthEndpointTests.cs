using System.Net;
using System.Net.Http.Json;
using Fsbox.Api.Features.Health;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Fsbox.Api.Tests.Features.Health;

public sealed class HealthEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Returns_ok_with_version()
    {
        using var client = factory.CreateClient();

        using var response = await client.GetAsync(new Uri("/api/v1/health", UriKind.Relative));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<HealthResponse>();
        Assert.NotNull(body);
        Assert.Equal("ok", body.Status);
        Assert.NotEmpty(body.Version);
    }

    /// <summary>
    /// Endpoint'ler yansımayla kaydedilir; yanlış bir filtre sessizce hiçbir uç
    /// eklemez ve API 404 verirdi. Bu test o sessiz hatayı yakalar.
    /// </summary>
    [Fact]
    public async Task Unknown_route_returns_not_found()
    {
        using var client = factory.CreateClient();

        using var response = await client.GetAsync(new Uri("/api/v1/nope", UriKind.Relative));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
