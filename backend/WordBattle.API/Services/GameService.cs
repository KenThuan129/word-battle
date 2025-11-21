using Microsoft.EntityFrameworkCore;
using WordBattle.API.Data;
using WordBattle.API.Models;

namespace WordBattle.API.Services;

public class GameService : IGameService
{
    private readonly WordBattleDbContext _context;
    private readonly IAIService _aiService;
    
    public GameService(WordBattleDbContext context, IAIService aiService)
    {
        _context = context;
        _aiService = aiService;
    }
    
    public async Task<GameSession> StartGameAsync(Guid playerId, string mode, string? aiDifficulty = null)
    {
        // TODO: Initialize game state
        var gameSession = new GameSession
        {
            Id = Guid.NewGuid(),
            PlayerId = playerId,
            Mode = mode,
            Status = "playing",
            CreatedAt = DateTime.UtcNow,
            GameStateJson = "{}" // TODO: Serialize actual game state
        };
        
        _context.GameSessions.Add(gameSession);
        await _context.SaveChangesAsync();
        
        return gameSession;
    }
    
    public async Task<MoveResult> SubmitMoveAsync(Guid gameId, MoveRequestDto request)
    {
        var gameSession = await _context.GameSessions.FindAsync(gameId);
        if (gameSession == null)
        {
            return new MoveResult { Success = false, Error = "Game not found" };
        }
        
        // TODO: Validate and apply move
        // TODO: Update game state
        
        gameSession.LastMoveAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        
        return new MoveResult
        {
            Success = true,
            GameSession = gameSession
        };
    }
    
    public async Task<MoveDto> GetAIMoveAsync(Guid gameId)
    {
        var gameSession = await _context.GameSessions.FindAsync(gameId);
        if (gameSession == null)
        {
            throw new Exception("Game not found");
        }
        
        // TODO: Get AI move
        return await _aiService.CalculateMoveAsync(gameSession);
    }
    
    public async Task EndGameAsync(Guid gameId)
    {
        var gameSession = await _context.GameSessions.FindAsync(gameId);
        if (gameSession != null)
        {
            gameSession.Status = "finished";
            gameSession.FinishedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }
}

