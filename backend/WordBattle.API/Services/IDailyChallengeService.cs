namespace WordBattle.API.Services;

public interface IDailyChallengeService
{
    Task<DailyChallengeDto> GetTodayChallengesAsync();
    Task<ChallengePuzzleDto?> GetPuzzleAsync(Guid puzzleId);
    Task CompletePuzzleAsync(Guid playerId, Guid puzzleId);
}

public class DailyChallengeDto
{
    public DateTime Date { get; set; }
    public List<ChallengePuzzleDto> Puzzles { get; set; } = new();
}

public class ChallengePuzzleDto
{
    public Guid Id { get; set; }
    public int Order { get; set; }
    public string Difficulty { get; set; } = "easy";
    public string Type { get; set; } = "standard";
}

