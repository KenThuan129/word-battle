using WordBattle.API.Models;

namespace WordBattle.API.Services;

public interface IGameService
{
    Task<GameSession> StartGameAsync(Guid playerId, string mode, string? aiDifficulty = null);
    Task<MoveResult> SubmitMoveAsync(Guid gameId, MoveRequest request);
    Task<MoveDto> GetAIMoveAsync(Guid gameId);
    Task EndGameAsync(Guid gameId);
}

public class MoveResult
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public GameSession? GameSession { get; set; }
}

public class MoveDto
{
    public List<PositionDto> Positions { get; set; } = new();
    public string Word { get; set; } = string.Empty;
    public string Direction { get; set; } = "horizontal";
    public int Score { get; set; }
}

public class PositionDto
{
    public int Row { get; set; }
    public int Col { get; set; }
}

