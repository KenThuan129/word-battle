using Microsoft.EntityFrameworkCore;
using WordBattle.API.Data;
using WordBattle.API.Models;

namespace WordBattle.API.Services;

public class WordBankService : IWordBankService
{
    private readonly WordBattleDbContext _context;
    
    public WordBankService(WordBattleDbContext context)
    {
        _context = context;
    }
    
    public async Task<List<WordBankEntry>> GetWordBankAsync(Guid playerId)
    {
        return await _context.WordBankEntries
            .Where(e => e.PlayerId == playerId)
            .OrderBy(e => e.Word)
            .ToListAsync();
    }
    
    public async Task<WordBankEntry?> AddWordAsync(Guid playerId, string word, string source)
    {
        var existing = await _context.WordBankEntries
            .FirstOrDefaultAsync(e => e.PlayerId == playerId && e.Word == word.ToLower());
        
        if (existing != null)
        {
            return existing;
        }
        
        var entry = new WordBankEntry
        {
            Id = Guid.NewGuid(),
            PlayerId = playerId,
            Word = word.ToLower(),
            Source = source,
            DiscoveredAt = DateTime.UtcNow,
            Difficulty = "common" // TODO: Determine difficulty
        };
        
        _context.WordBankEntries.Add(entry);
        await _context.SaveChangesAsync();
        
        return entry;
    }
    
    public async Task UpdateWordUsageAsync(Guid playerId, string word)
    {
        var entry = await _context.WordBankEntries
            .FirstOrDefaultAsync(e => e.PlayerId == playerId && e.Word == word.ToLower());
        
        if (entry != null)
        {
            entry.TimesUsed++;
            entry.LastUsedAt = DateTime.UtcNow;
            
            if (entry.TimesUsed >= 5)
            {
                entry.IsMastered = true;
            }
            
            await _context.SaveChangesAsync();
        }
    }
    
    public async Task ToggleFavoriteAsync(Guid playerId, string word)
    {
        var entry = await _context.WordBankEntries
            .FirstOrDefaultAsync(e => e.PlayerId == playerId && e.Word == word.ToLower());
        
        if (entry != null)
        {
            entry.IsFavorite = !entry.IsFavorite;
            await _context.SaveChangesAsync();
        }
    }
}

