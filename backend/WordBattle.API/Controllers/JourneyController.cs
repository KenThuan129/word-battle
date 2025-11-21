using Microsoft.AspNetCore.Mvc;
using WordBattle.API.Services;

namespace WordBattle.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JourneyController : ControllerBase
{
    private readonly IJourneyService _journeyService;
    
    public JourneyController(IJourneyService journeyService)
    {
        _journeyService = journeyService;
    }
    
    [HttpGet("levels")]
    public async Task<IActionResult> GetLevels([FromQuery] Guid playerId)
    {
        var levels = await _journeyService.GetLevelsAsync(playerId);
        return Ok(levels);
    }
    
    [HttpGet("level/{levelId}")]
    public async Task<IActionResult> GetLevel(int levelId)
    {
        var level = await _journeyService.GetLevelAsync(levelId);
        if (level == null)
        {
            return NotFound();
        }
        return Ok(level);
    }
    
    [HttpPost("level/{levelId}/start")]
    public async Task<IActionResult> StartLevel(int levelId, [FromQuery] Guid playerId)
    {
        await _journeyService.StartLevelAsync(playerId, levelId);
        return Ok();
    }
    
    [HttpPost("level/{levelId}/complete")]
    public async Task<IActionResult> CompleteLevel(int levelId, [FromQuery] Guid playerId, [FromBody] CompleteLevelRequest request)
    {
        await _journeyService.CompleteLevelAsync(playerId, levelId, request.Stars);
        return Ok();
    }
}

public class CompleteLevelRequest
{
    public int Stars { get; set; }
}

