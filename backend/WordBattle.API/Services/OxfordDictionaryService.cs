using System.Net.Http.Json;

namespace WordBattle.API.Services;

public interface IOxfordDictionaryService
{
    Task<List<string>> GetWordListAsync(int? limit = null);
    Task<DictionaryEntry?> GetWordDefinitionAsync(string word);
}

public class OxfordDictionaryService : IOxfordDictionaryService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OxfordDictionaryService> _logger;
    private readonly string? _appId;
    private readonly string? _appKey;
    private const string OxfordApiBaseUrl = "https://od-api.oxforddictionaries.com/api/v2";

    public OxfordDictionaryService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<OxfordDictionaryService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        
        // Get Oxford Dictionary API credentials from configuration
        _appId = _configuration["OxfordDictionary:AppId"];
        _appKey = _configuration["OxfordDictionary:AppKey"];
        
        // Set up HTTP client with API credentials if available
        if (!string.IsNullOrEmpty(_appId) && !string.IsNullOrEmpty(_appKey))
        {
            _httpClient.DefaultRequestHeaders.Add("app_id", _appId);
            _httpClient.DefaultRequestHeaders.Add("app_key", _appKey);
        }
    }

    public async Task<List<string>> GetWordListAsync(int? limit = null)
    {
        // If no API key is configured, return empty list
        // The frontend will fall back to other word sources
        if (string.IsNullOrEmpty(_appId) || string.IsNullOrEmpty(_appKey))
        {
            _logger.LogWarning("Oxford Dictionary API credentials not configured. Returning empty word list.");
            return new List<string>();
        }

        try
        {
            // Note: Oxford Dictionary API doesn't have a direct "get all words" endpoint
            // We need to use alternative approaches:
            // 1. Use the words endpoint with filters (limited)
            // 2. Use a pre-compiled word list based on Oxford Dictionary
            // 3. Cache word list from a comprehensive source
            
            // For now, we'll return an empty list and log a message
            // In production, you would:
            // - Cache a comprehensive word list
            // - Use Oxford Dictionary API for validation/definitions
            // - Load from a pre-compiled Oxford-based word list file
            
            _logger.LogInformation("Oxford Dictionary API credentials configured but word list endpoint not available. Use validation endpoint for individual words.");
            
            // Return empty - the frontend will use fallback sources
            return new List<string>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching word list from Oxford Dictionary API");
            return new List<string>();
        }
    }

    public async Task<DictionaryEntry?> GetWordDefinitionAsync(string word)
    {
        if (string.IsNullOrEmpty(_appId) || string.IsNullOrEmpty(_appKey))
        {
            _logger.LogWarning("Oxford Dictionary API credentials not configured.");
            return null;
        }

        if (string.IsNullOrWhiteSpace(word))
        {
            return null;
        }

        try
        {
            var language = "en-gb";
            var wordId = word.ToLower();
            var url = $"{OxfordApiBaseUrl}/entries/{language}/{wordId}";

            var response = await _httpClient.GetAsync(url);
            
            if (response.IsSuccessStatusCode)
            {
                var data = await response.Content.ReadFromJsonAsync<OxfordDictionaryResponse>();
                if (data?.Results != null && data.Results.Length > 0)
                {
                    var result = data.Results[0];
                    var entry = result.LexicalEntries?[0];
                    var sense = entry?.Entries?[0]?.Senses?[0];
                    
                    return new DictionaryEntry
                    {
                        Word = word,
                        Definitions = sense?.Definitions?.ToList() ?? new List<string>(),
                        PartOfSpeech = entry?.LexicalCategory?.Text ?? "unknown",
                        Examples = sense?.Examples?.Select(e => e.Text).ToList() ?? new List<string>()
                    };
                }
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogDebug("Word '{Word}' not found in Oxford Dictionary", word);
            }
            else
            {
                _logger.LogWarning("Oxford Dictionary API returned status code {StatusCode} for word '{Word}'", 
                    response.StatusCode, word);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching word definition for '{Word}' from Oxford Dictionary API", word);
        }

        return null;
    }
}

public class DictionaryEntry
{
    public string Word { get; set; } = string.Empty;
    public List<string> Definitions { get; set; } = new();
    public string PartOfSpeech { get; set; } = string.Empty;
    public List<string> Examples { get; set; } = new();
}

// Oxford Dictionary API response models
public class OxfordDictionaryResponse
{
    public OxfordResult[]? Results { get; set; }
}

public class OxfordResult
{
    public OxfordLexicalEntry[]? LexicalEntries { get; set; }
}

public class OxfordLexicalEntry
{
    public OxfordLexicalCategory? LexicalCategory { get; set; }
    public OxfordEntry[]? Entries { get; set; }
}

public class OxfordLexicalCategory
{
    public string? Text { get; set; }
}

public class OxfordEntry
{
    public OxfordSense[]? Senses { get; set; }
}

public class OxfordSense
{
    public string[]? Definitions { get; set; }
    public OxfordExample[]? Examples { get; set; }
}

public class OxfordExample
{
    public string? Text { get; set; }
}

