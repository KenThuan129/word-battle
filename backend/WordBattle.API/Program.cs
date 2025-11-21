using Microsoft.EntityFrameworkCore;
using WordBattle.API.Data;
using WordBattle.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<WordBattleDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Redis
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
});

// Services
builder.Services.AddScoped<IGameService, GameService>();
builder.Services.AddScoped<IAIService, AIService>();
builder.Services.AddScoped<IWordBankService, WordBankService>();
builder.Services.AddScoped<IJourneyService, JourneyService>();
builder.Services.AddScoped<IDailyChallengeService, DailyChallengeService>();

// Oxford Dictionary Service
builder.Services.AddHttpClient<IOxfordDictionaryService, OxfordDictionaryService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();

