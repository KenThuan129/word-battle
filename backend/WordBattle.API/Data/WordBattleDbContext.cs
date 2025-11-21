using Microsoft.EntityFrameworkCore;
using WordBattle.API.Models;

namespace WordBattle.API.Data;

public class WordBattleDbContext : DbContext
{
    public WordBattleDbContext(DbContextOptions<WordBattleDbContext> options)
        : base(options)
    {
    }
    
    public DbSet<Player> Players { get; set; }
    public DbSet<PlayerStats> PlayerStats { get; set; }
    public DbSet<WordBankEntry> WordBankEntries { get; set; }
    public DbSet<PowerUp> PowerUps { get; set; }
    public DbSet<GameSession> GameSessions { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<Player>(entity =>
        {
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasOne(e => e.Stats)
                  .WithOne(e => e.Player)
                  .HasForeignKey<PlayerStats>(e => e.PlayerId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
        
        modelBuilder.Entity<WordBankEntry>(entity =>
        {
            entity.HasIndex(e => new { e.PlayerId, e.Word }).IsUnique();
        });
    }
}

