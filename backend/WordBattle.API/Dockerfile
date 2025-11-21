FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["WordBattle.API.csproj", "./"]
RUN dotnet restore "WordBattle.API.csproj"
COPY . .
WORKDIR "/src"
RUN dotnet build "WordBattle.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "WordBattle.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "WordBattle.API.dll"]

