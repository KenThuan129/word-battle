# Contributing to Word Battle

Thank you for your interest in contributing to Word Battle! 🎮

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/WordBattle.git
   cd WordBattle
   ```

3. **Set up the development environment**
   - Follow the setup instructions in the main `README.md`
   - Make sure all services (frontend, backend, mobile) can run locally

## 📝 Development Guidelines

### Code Style

- **TypeScript/JavaScript**: Use ESLint configuration provided
- **C#**: Follow standard C# conventions
- **React**: Use functional components with hooks
- **React Native**: Follow React Native best practices

### Commit Messages

Use clear, descriptive commit messages:
```
feat: Add daily challenge feature
fix: Resolve word validation edge case
docs: Update API documentation
refactor: Optimize AI move calculation
```

### Pull Request Process

1. Create a feature branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes
3. Test your changes thoroughly
4. Update documentation if needed
5. Submit a pull request with:
   - Clear description of changes
   - Screenshots (if UI changes)
   - Reference to related issues

## 🧪 Testing

- Test your changes in all environments (web, mobile)
- Ensure AI logic works correctly
- Verify word validation behaves as expected
- Test with different difficulty levels

## 📋 Project Structure

### Frontend (`frontend/`)
- `app/` - Next.js App Router pages
- `components/` - React components
- `lib/` - Game logic and utilities
- `stores/` - Zustand state management

### Backend (`backend/WordBattle.API/`)
- `Controllers/` - API endpoints
- `Services/` - Business logic
- `Models/` - Data models
- `Data/` - DbContext

### Mobile (`mobile/`)
- `src/screens/` - Screen components
- `src/components/` - React Native components
- `src/lib/` - Shared game logic
- `src/stores/` - Shared state management

## 🐛 Reporting Bugs

1. Check if the bug already exists in issues
2. Create a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, browser, etc.)

## 💡 Feature Requests

We welcome feature requests! Please create an issue describing:
- The feature you'd like to see
- Why it would be useful
- How it might work

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

