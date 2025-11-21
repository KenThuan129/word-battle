using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WordBattle.API.Models;

public class WordBankEntry
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    public Guid PlayerId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Word { get; set; } = string.Empty;
    
    public string Definition { get; set; } = string.Empty;
    
    [MaxLength(20)]
    public string PartOfSpeech { get; set; } = string.Empty;
    
    [MaxLength(20)]
    public string Difficulty { get; set; } = "common";
    
    // Collection
    [MaxLength(20)]
    public string Source { get; set; } = "played"; // played, encountered, bonus
    public DateTime DiscoveredAt { get; set; }
    
    // Usage stats
    public int TimesUsed { get; set; }
    public int TimesEncountered { get; set; }
    public DateTime? LastUsedAt { get; set; }
    
    // Learning
    public bool IsMastered { get; set; }
    public bool IsFavorite { get; set; }
    
    // Navigation
    [ForeignKey(nameof(PlayerId))]
    public Player Player { get; set; } = null!;
}

