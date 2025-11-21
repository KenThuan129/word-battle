namespace WordBattle.API.Services;

public interface IJourneyService
{
    Task<List<JourneyLevelDto>> GetLevelsAsync(Guid playerId);
    Task<JourneyLevelDto?> GetLevelAsync(int levelId);
    Task StartLevelAsync(Guid playerId, int levelId);
    Task CompleteLevelAsync(Guid playerId, int levelId, int stars);
}

public class JourneyLevelDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string AIDifficulty { get; set; } = "easy";
    public bool IsUnlocked { get; set; }
    public int Stars { get; set; }
}

