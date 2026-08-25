using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using Fsdotnet.Api.Features.Regex;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Fsdotnet.Api.Tests.Features.Regex;

public sealed class RegexEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly Uri Endpoint = new("/api/v1/regex/test", UriKind.Relative);

    private async Task<RegexTestResponse> PostAsync(RegexTestRequest request)
    {
        using var client = factory.CreateClient();
        using var response = await client.PostAsJsonAsync(Endpoint, request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<RegexTestResponse>();
        Assert.NotNull(body);
        return body;
    }

    [Fact]
    public async Task Returns_matches_with_positions()
    {
        var body = await PostAsync(new RegexTestRequest(@"\d+", "a12 b345", null));

        Assert.True(body.Success);
        Assert.Collection(
            body.Matches,
            first =>
            {
                Assert.Equal("12", first.Value);
                Assert.Equal(1, first.Index);
            },
            second =>
            {
                Assert.Equal("345", second.Value);
                Assert.Equal(5, second.Index);
            });
    }

    [Fact]
    public async Task Returns_named_groups()
    {
        var body = await PostAsync(new RegexTestRequest(@"(?<year>\d{4})-(?<month>\d{2})", "2026-08", null));

        var match = Assert.Single(body.Matches);
        Assert.Contains(match.Groups, group => group.Name == "year" && group.Value == "2026");
        Assert.Contains(match.Groups, group => group.Name == "month" && group.Value == "08");
    }

    [Fact]
    public async Task Does_not_report_group_zero_separately()
    {
        var body = await PostAsync(new RegexTestRequest("(a)(b)", "ab", null));

        var match = Assert.Single(body.Matches);
        Assert.DoesNotContain(match.Groups, group => group.Name == "0");
        Assert.Equal(2, match.Groups.Count);
    }

    /// <summary>
    /// .NET'e özgü yapılar bu ucun var olma sebebi: JavaScript motoru bunları
    /// çalıştıramaz, taklit etmek de yanlış cevap verirdi.
    /// </summary>
    [Theory]
    [InlineData(@"\A\d+\z", "123", true)]
    [InlineData(@"(?i)MERHABA", "merhaba", true)]
    [InlineData(@"^(?<open>\()+(?<-open>\))+(?(open)(?!))$", "((()))", true)]
    public async Task Runs_dotnet_only_constructs(string pattern, string input, bool expected)
    {
        var body = await PostAsync(new RegexTestRequest(pattern, input, null));

        Assert.True(body.Success, body.Error);
        Assert.Equal(expected, body.Matches.Count > 0);
    }

    /// <summary>
    /// <c>\d</c> .NET'te Unicode rakamlarını da yakalar; JavaScript'te
    /// (<c>u</c> bayrağı olmadan) yalnızca ASCII. Aracın iki motoru yan yana
    /// göstermesinin sebebi tam olarak bu tür sessiz farklar.
    /// </summary>
    [Fact]
    public async Task Digit_class_matches_unicode_digits()
    {
        var body = await PostAsync(new RegexTestRequest(@"^\d+$", "٤٢", null));

        Assert.True(body.Success);
        Assert.Single(body.Matches);
    }

    [Fact]
    public async Task Ignore_case_is_culture_sensitive_unless_invariant()
    {
        var original = CultureInfo.DefaultThreadCurrentCulture;
        try
        {
            /* Sunucu kültürü Türkçe olduğunda `I` ile `i` eşleşmez: büyük `I`
               küçük `ı`ya karşılık gelir. `CultureInvariant` bunu kapatır. */
            CultureInfo.DefaultThreadCurrentCulture = new CultureInfo("tr-TR");

            var cultured = await PostAsync(
                new RegexTestRequest("^FILE$", "file", new RegexTestOptions(IgnoreCase: true)));
            var invariant = await PostAsync(
                new RegexTestRequest("^FILE$", "file", new RegexTestOptions(IgnoreCase: true, CultureInvariant: true)));

            Assert.Empty(cultured.Matches);
            Assert.Single(invariant.Matches);
        }
        finally
        {
            CultureInfo.DefaultThreadCurrentCulture = original;
        }
    }

    [Fact]
    public async Task Invalid_pattern_is_data_not_an_error_status()
    {
        var body = await PostAsync(new RegexTestRequest("(unclosed", "x", null));

        Assert.False(body.Success);
        Assert.NotNull(body.Error);
        Assert.Empty(body.Matches);
    }

    [Fact]
    public async Task Catastrophic_backtracking_times_out_instead_of_hanging()
    {
        var body = await PostAsync(new RegexTestRequest(
            "^(a+)+$",
            new string('a', 40) + "!",
            null));

        Assert.False(body.Success);
        Assert.NotNull(body.Error);
        Assert.Contains("timed out", body.Error, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData(2_001, 1)]
    [InlineData(1, 100_001)]
    public async Task Rejects_oversized_input(int patternLength, int inputLength)
    {
        using var client = factory.CreateClient();
        var request = new RegexTestRequest(new string('a', patternLength), new string('b', inputLength), null);

        using var response = await client.PostAsJsonAsync(Endpoint, request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Truncates_beyond_the_match_limit()
    {
        var body = await PostAsync(new RegexTestRequest("a", new string('a', 600), null));

        Assert.True(body.Truncated);
        Assert.Equal(500, body.Matches.Count);
    }
}
