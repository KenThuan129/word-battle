using Microsoft.AspNetCore.Mvc;
using WordBattle.API.Services;

namespace WordBattle.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WordBankController : ControllerBase
{
    private readonly IWordBankService _wordBankService;
    
    public WordBankController(IWordBankService wordBankService)
    {
        _wordBankService = wordBankService;
    }
    
    [HttpGet]
    public async Task<IActionResult> GetWordBank([FromQuery] Guid playerId)
    {
        var words = await _wordBankService.GetWordBankAsync(playerId);
        return Ok(words);
    }
    
    [HttpPost("{word}/favorite")]
    public async Task<IActionResult> ToggleFavorite([FromQuery] Guid playerId, string word)
    {
        await _wordBankService.ToggleFavoriteAsync(playerId, word);
        return Ok();
    }
}

