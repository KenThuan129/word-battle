using Microsoft.AspNetCore.Mvc;
using WordBattle.API.Services;

namespace WordBattle.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DictionaryController : ControllerBase
{
    private readonly IOxfordDictionaryService _oxfordDictionaryService;
    
    public DictionaryController(IOxfordDictionaryService oxfordDictionaryService)
    {
        _oxfordDictionaryService = oxfordDictionaryService;
    }
    
    /// <summary>
    /// Get word list from Oxford Dictionary
    /// Note: Oxford Dictionary API doesn't provide a direct word list endpoint,
    /// so this will return an empty list and the frontend should use fallback sources.
    /// </summary>
    [HttpGet("oxford/words")]
    public async Task<IActionResult> GetOxfordWords([FromQuery] int? limit = null)
    {
        var words = await _oxfordDictionaryService.GetWordListAsync(limit);
        
        // If no words returned (likely because API key not configured),
        // return empty array so frontend uses fallback
        return Ok(new { words, source = "oxford" });
    }
    
    /// <summary>
    /// Get word definition from Oxford Dictionary
    /// </summary>
    [HttpGet("oxford/{word}")]
    public async Task<IActionResult> GetOxfordDefinition(string word)
    {
        if (string.IsNullOrWhiteSpace(word))
        {
            return BadRequest(new { error = "Word is required" });
        }
        
        var entry = await _oxfordDictionaryService.GetWordDefinitionAsync(word);
        
        if (entry == null)
        {
            return NotFound(new { error = "Word not found in Oxford Dictionary" });
        }
        
        return Ok(entry);
    }
    
    /// <summary>
    /// Validate if a word exists in Oxford Dictionary
    /// </summary>
    [HttpGet("oxford/validate/{word}")]
    public async Task<IActionResult> ValidateWord(string word)
    {
        if (string.IsNullOrWhiteSpace(word))
        {
            return BadRequest(new { valid = false, error = "Word is required" });
        }
        
        var entry = await _oxfordDictionaryService.GetWordDefinitionAsync(word);
        
        return Ok(new { valid = entry != null, word });
    }
}

