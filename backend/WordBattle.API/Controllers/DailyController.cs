using Microsoft.AspNetCore.Mvc;
using WordBattle.API.Services;

namespace WordBattle.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DailyController : ControllerBase
{
    private readonly IDailyChallengeService _dailyChallengeService;
    
    public DailyController(IDailyChallengeService dailyChallengeService)
    {
        _dailyChallengeService = dailyChallengeService;
    }
    
    [HttpGet("today")]
    public async Task<IActionResult> GetTodayChallenges()
    {
        var challenges = await _dailyChallengeService.GetTodayChallengesAsync();
        return Ok(challenges);
    }
    
    [HttpGet("puzzle/{puzzleId}")]
    public async Task<IActionResult> GetPuzzle(Guid puzzleId)
    {
        var puzzle = await _dailyChallengeService.GetPuzzleAsync(puzzleId);
        if (puzzle == null)
        {
            return NotFound();
        }
        return Ok(puzzle);
    }
    
    [HttpPost("puzzle/{puzzleId}/complete")]
    public async Task<IActionResult> CompletePuzzle(Guid puzzleId, [FromQuery] Guid playerId)
    {
        await _dailyChallengeService.CompletePuzzleAsync(playerId, puzzleId);
        return Ok();
    }
}

