using WordBattle.API.Models;

namespace WordBattle.API.Services;

public interface IAIService
{
    Task<MoveDto> CalculateMoveAsync(GameSession gameSession);
}

