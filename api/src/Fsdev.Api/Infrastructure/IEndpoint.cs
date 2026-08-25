namespace Fsdev.Api.Infrastructure;

/// <summary>
/// Bir dikey dilimin HTTP yüzü.
/// </summary>
/// <remarks>
/// Her araç kendi endpoint'ini tanımlar ve <see cref="EndpointExtensions.AddEndpoints"/>
/// tarafından yansımayla bulunur; <c>Program.cs</c> hiçbir aracı ismen tanımaz.
/// Bu, frontend'deki tool registry'nin backend karşılığıdır (ADR-0002, ADR-0003).
/// </remarks>
public interface IEndpoint
{
    void Map(IEndpointRouteBuilder routes);
}
