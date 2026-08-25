using System.Diagnostics;
using System.Text.RegularExpressions;
using Fsdotnet.Api.Infrastructure;

namespace Fsdotnet.Api.Features.Regex;

public sealed record RegexTestRequest(string Pattern, string Input, RegexTestOptions? Options);

public sealed record RegexTestOptions(
    bool IgnoreCase = false,
    bool Multiline = false,
    bool Singleline = false,
    bool IgnorePatternWhitespace = false,
    bool ExplicitCapture = false,
    /// <summary>
    /// <c>RegexOptions.IgnoreCase</c> varsayılan olarak GEÇERLİ KÜLTÜRÜ
    /// kullanır. Türkçe kültürde <c>"file"</c> ile <c>"FILE"</c> eşleşmez
    /// (i↔İ, I↔ı). Bu bayrak sonucu kültürden bağımsız kılar; hangi
    /// davranışın istendiği çağırana ait olduğu için varsayılan yapılmadı.
    /// </summary>
    bool CultureInvariant = false);

public sealed record RegexGroupResult(string Name, bool Success, int Index, int Length, string Value);

public sealed record RegexMatchResult(int Index, int Length, string Value, IReadOnlyList<RegexGroupResult> Groups);

public sealed record RegexTestResponse(
    bool Success,
    IReadOnlyList<RegexMatchResult> Matches,
    /// <summary>Desen derlenmediyse .NET'in kendi mesajı; aksi hâlde null.</summary>
    string? Error,
    /// <summary>Sonuç <see cref="MatchLimit"/> nedeniyle kesildi mi.</summary>
    bool Truncated,
    long ElapsedMilliseconds);

/// <summary>
/// .NET normal ifade motorunu olduğu gibi çalıştırır.
/// </summary>
/// <remarks>
/// Bu, sunucuda çalışması ZORUNLU olan tek araç: JavaScript'in <c>RegExp</c>'i
/// .NET değil. Denge grupları, koşullu desenler, <c>\A</c>/<c>\z</c>,
/// satır içi seçenekler ve <c>\d</c>'nin Unicode davranışı yalnızca gerçek
/// motorda doğru sonuç verir — taklit etmek yanlış cevap üretmek olurdu
/// (ADR-0001).
/// </remarks>
public sealed class RegexEndpoint : IEndpoint
{
    /// <summary>Geri izleme patlamalarına karşı sert sınır.</summary>
    private static readonly TimeSpan MatchTimeout = TimeSpan.FromMilliseconds(250);

    private const int MaxPatternLength = 2_000;
    private const int MaxInputLength = 100_000;
    private const int MatchLimit = 500;

    public void Map(IEndpointRouteBuilder routes) =>
        routes.MapPost("/regex/test", Handle)
            .WithName("RegexTest")
            .WithSummary("Run a pattern through the .NET regex engine")
            .Produces<RegexTestResponse>()
            .ProducesProblem(StatusCodes.Status400BadRequest);

    private static IResult Handle(RegexTestRequest request)
    {
        /* Boyut sınırları BOZUK İSTEK sayılır (400). Derlenmeyen desen ise
           sayılmaz: bu aracın işi zaten deseni denemek, hatayı göstermek
           normal sonucudur — 200 ile veri olarak dönüyor. */
        if (request.Pattern.Length > MaxPatternLength)
        {
            return Results.Problem(
                $"Pattern exceeds {MaxPatternLength} characters.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        if (request.Input.Length > MaxInputLength)
        {
            return Results.Problem(
                $"Input exceeds {MaxInputLength} characters.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var options = ToRegexOptions(request.Options);
        var stopwatch = Stopwatch.StartNew();

        System.Text.RegularExpressions.Regex regex;
        try
        {
            regex = new System.Text.RegularExpressions.Regex(request.Pattern, options, MatchTimeout);
        }
        catch (ArgumentException error)
        {
            return Results.Ok(new RegexTestResponse(false, [], error.Message, false, stopwatch.ElapsedMilliseconds));
        }

        var matches = new List<RegexMatchResult>();
        var truncated = false;

        try
        {
            foreach (Match match in regex.Matches(request.Input))
            {
                if (matches.Count >= MatchLimit)
                {
                    truncated = true;
                    break;
                }

                matches.Add(new RegexMatchResult(
                    match.Index,
                    match.Length,
                    match.Value,
                    // 0 numaralı grup eşleşmenin kendisi; ayrıca listelenmiyor.
                    [.. match.Groups.Values
                        .Where(group => group.Name != "0")
                        .Select(group => new RegexGroupResult(
                            group.Name,
                            group.Success,
                            group.Index,
                            group.Length,
                            group.Value))]));
            }
        }
        catch (RegexMatchTimeoutException)
        {
            return Results.Ok(new RegexTestResponse(
                false,
                [],
                $"Pattern timed out after {MatchTimeout.TotalMilliseconds:0} ms — it backtracks catastrophically on this input.",
                false,
                stopwatch.ElapsedMilliseconds));
        }

        return Results.Ok(new RegexTestResponse(true, matches, null, truncated, stopwatch.ElapsedMilliseconds));
    }

    private static RegexOptions ToRegexOptions(RegexTestOptions? options)
    {
        if (options is null)
        {
            return RegexOptions.None;
        }

        var result = RegexOptions.None;
        if (options.IgnoreCase) result |= RegexOptions.IgnoreCase;
        if (options.Multiline) result |= RegexOptions.Multiline;
        if (options.Singleline) result |= RegexOptions.Singleline;
        if (options.IgnorePatternWhitespace) result |= RegexOptions.IgnorePatternWhitespace;
        if (options.ExplicitCapture) result |= RegexOptions.ExplicitCapture;
        if (options.CultureInvariant) result |= RegexOptions.CultureInvariant;
        return result;
    }
}
