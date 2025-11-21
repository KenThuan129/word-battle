using System.ComponentModel.DataAnnotations;

namespace WordBattle.API.Models;

public class Player
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
    
    // Progression
    public int JourneyLevel { get; set; }
    public int TotalStars { get; set; }
    public bool PvEArenaUnlocked { get; set; }
    public string CurrentArenaRank { get; set; } = "Bronze";
    
    // Daily Challenges
    public int Keys { get; set; }
    public int CurrentStreak { get; set; }
    public DateTime? LastChallengeDate { get; set; }
    
    // Inventory
    public int Coins { get; set; }
    
    // Navigation
    public PlayerStats? Stats { get; set; }
    public List<WordBankEntry> WordBankEntries { get; set; } = new();
    public List<PowerUp> PowerUps { get; set; } = new();
}

