using Microsoft.AspNetCore.Mvc;
using WordBattle.API.Services;

namespace WordBattle.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameController : ControllerBase
{
    private readonly IGameService _gameService;
    
    public GameController(IGameService gameService)
    {
        _gameService = gameService;
    }
    
    [HttpPost("start")]
    public async Task<IActionResult> StartGame([FromBody] StartGameRequest request)
    {
        var game = await _gameService.StartGameAsync(request.PlayerId, request.Mode, request.AIDifficulty);
        return Ok(game);
    }
    
    [HttpPost("{gameId}/move")]
    public async Task<IActionResult> SubmitMove(Guid gameId, [FromBody] MoveRequestDto request)
    {
        var result = await _gameService.SubmitMoveAsync(gameId, request);
        if (!result.Success)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
    
    [HttpGet("{gameId}/ai-move")]
    public async Task<IActionResult> GetAIMove(Guid gameId)
    {
        var move = await _gameService.GetAIMoveAsync(gameId);
        return Ok(move);
    }
    
    [HttpPost("{gameId}/end")]
    public async Task<IActionResult> EndGame(Guid gameId)
    {
        await _gameService.EndGameAsync(gameId);
        return Ok();
    }
}

public class StartGameRequest
{
    public Guid PlayerId { get; set; }
    public string Mode { get; set; } = "journey";
    public string? AIDifficulty { get; set; }
}

