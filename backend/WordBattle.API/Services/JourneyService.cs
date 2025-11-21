using WordBattle.API.Data;

namespace WordBattle.API.Services;

public class JourneyService : IJourneyService
{
    private readonly WordBattleDbContext _context;
    
    public JourneyService(WordBattleDbContext context)
    {
        _context = context;
    }
    
    public async Task<List<JourneyLevelDto>> GetLevelsAsync(Guid playerId)
    {
        // TODO: Implement level fetching logic
        await Task.CompletedTask;
        return new List<JourneyLevelDto>();
    }
    
    public async Task<JourneyLevelDto?> GetLevelAsync(int levelId)
    {
        // TODO: Implement level fetching logic
        await Task.CompletedTask;
        return null;
    }
    
    public async Task StartLevelAsync(Guid playerId, int levelId)
    {
        // TODO: Implement level start logic
        await Task.CompletedTask;
    }
    
    public async Task CompleteLevelAsync(Guid playerId, int levelId, int stars)
    {
        // TODO: Implement level completion logic
        await Task.CompletedTask;
    }
}

