using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WordBattle.API.Models;

public class PlayerStats
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    public Guid PlayerId { get; set; }
    
    public int GamesPlayed { get; set; }
    public int GamesWon { get; set; }
    public int TotalWordsPlayed { get; set; }
    public int UniqueWordsPlayed { get; set; }
    
    [MaxLength(100)]
    public string LongestWord { get; set; } = string.Empty;
    
    public int HighestSingleWordScore { get; set; }
    public int HighestGameScore { get; set; }
    
    // Navigation
    [ForeignKey(nameof(PlayerId))]
    public Player Player { get; set; } = null!;
}

