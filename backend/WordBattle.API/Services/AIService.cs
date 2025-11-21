using WordBattle.API.Models;

namespace WordBattle.API.Services;

public class AIService : IAIService
{
    public async Task<MoveDto> CalculateMoveAsync(GameSession gameSession)
    {
        // TODO: Implement AI decision logic
        // For now, return a placeholder
        await Task.CompletedTask;
        
        return new MoveDto
        {
            Word = "test",
            Direction = "horizontal",
            Positions = new List<PositionDto>(),
            Score = 0
        };
    }
}

