using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WordBattle.API.Models;

public class PowerUp
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    public Guid PlayerId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty; // letter_swap, peek, wild_card, etc.
    
    [MaxLength(20)]
    public string Rarity { get; set; } = "common"; // common, rare, epic, legendary
    
    public DateTime? UsedAt { get; set; }
    
    // Navigation
    [ForeignKey(nameof(PlayerId))]
    public Player Player { get; set; } = null!;
}

