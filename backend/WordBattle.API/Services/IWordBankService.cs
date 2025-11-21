using WordBattle.API.Models;

namespace WordBattle.API.Services;

public interface IWordBankService
{
    Task<List<WordBankEntry>> GetWordBankAsync(Guid playerId);
    Task<WordBankEntry?> AddWordAsync(Guid playerId, string word, string source);
    Task UpdateWordUsageAsync(Guid playerId, string word);
    Task ToggleFavoriteAsync(Guid playerId, string word);
}

