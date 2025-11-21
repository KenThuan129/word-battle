using System.ComponentModel.DataAnnotations;

namespace WordBattle.API.Models;

public class GameSession
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    public Guid PlayerId { get; set; }
    
    [MaxLength(20)]
    public string Mode { get; set; } = "journey"; // journey, arena, daily, pvp
    
    [MaxLength(20)]
    public string Status { get; set; } = "waiting"; // waiting, playing, finished
    
    public string GameStateJson { get; set; } = string.Empty; // Serialized game state
    
    public DateTime CreatedAt { get; set; }
    public DateTime? LastMoveAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    
    public Guid? WinnerId { get; set; }
}

