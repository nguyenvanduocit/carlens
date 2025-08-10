# Contributing to Carlens

Thank you for your interest in contributing to Carlens! We welcome contributions from the community and appreciate your help in making this project better.

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please be respectful and inclusive in all interactions.

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- [MongoDB](https://www.mongodb.com/) >= 6.0
- Node.js >= 18.0.0 (for compatibility)
- Git

### Development Setup

1. **Fork the repository**
   - Click the "Fork" button at the top right of the repository page
   - Clone your fork locally:
   ```bash
   git clone git@github.com:nguyenvanduocit/carlens.git
   cd carlens
   ```

2. **Set up your development environment**
   ```bash
   # Install dependencies
   bun install
   
   # Copy environment file
   cp packages/server/.env.example packages/server/.env
   # Edit .env with your MongoDB connection details
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Start development servers**
   ```bash
   # Start backend server
   bun run server
   
   # In another terminal, start frontend development
   bun run dev:client
   ```

## 🛠️ Development Guidelines

### Project Structure

This is a monorepo with the following packages:
- `packages/server/` - Fastify backend API
- `packages/webapp/` - Vue 3 frontend application  
- `packages/shared-types/` - Shared TypeScript types
- `packages/sync/` - MongoDB synchronization utility

### Code Standards

#### TypeScript
- Use TypeScript for all new code
- Maintain strict type safety
- Use shared types from `@carlens/shared-types` where applicable
- Follow existing naming conventions

#### Frontend (Vue 3)
- Use Composition API exclusively
- Follow Vue 3 best practices and conventions
- Use existing composables and utilities
- Implement responsive design with Tailwind CSS
- Use Vue ECharts for data visualization

#### Backend (Fastify)
- Follow RESTful API conventions
- Use proper HTTP status codes
- Implement error handling
- Use MongoDB time-series collections for telemetry data
- Maintain API documentation

#### Code Style
- Use existing ESLint and Prettier configurations
- Run linting before submitting: `bun run lint`
- Run type checking: `bun run type-check`
- Follow existing code patterns and conventions

### Commit Guidelines

We use conventional commits for clear and consistent commit messages:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(dashboard): add real-time telemetry charts
fix(api): handle MongoDB connection errors properly
docs(readme): update installation instructions
```

## 📋 Pull Request Process

1. **Before submitting:**
   - Ensure all tests pass: `bun run test` (if available)
   - Run linting: `bun run lint`
   - Run type checking: `bun run type-check`
   - Update documentation if needed

2. **Submit your PR:**
   - Use a clear, descriptive title
   - Fill out the PR template completely
   - Link to any related issues
   - Add screenshots for UI changes

3. **Review process:**
   - Maintain discussion in the PR comments
   - Address all feedback promptly
   - Keep your branch updated with the main branch
   - Be patient - reviews take time!

## 🐛 Bug Reports

When reporting bugs, please include:

- **Description**: Clear description of the issue
- **Steps to reproduce**: Detailed steps to recreate the bug
- **Expected behavior**: What should have happened
- **Actual behavior**: What actually happened
- **Environment**: OS, browser, Bun/Node versions
- **Screenshots**: If applicable
- **Console logs**: Any relevant error messages

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) when creating issues.

## 💡 Feature Requests

For new features:

- Check existing issues to avoid duplicates
- Clearly describe the feature and its benefits
- Explain the use case and user story
- Consider implementation complexity
- Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)

## 🧪 Testing

- Write tests for new functionality
- Update existing tests when modifying code
- Ensure all tests pass before submitting PR
- Include both unit and integration tests where appropriate

## 📚 Documentation

- Update documentation for any changes
- Include JSDoc comments for functions and classes
- Update API documentation for endpoint changes
- Keep README.md current with new features

## 🔍 Code Review Guidelines

### For Reviewers:
- Be constructive and specific in feedback
- Focus on code quality, performance, and maintainability
- Check for proper error handling and security considerations
- Verify tests are adequate and passing

### For Contributors:
- Respond to feedback promptly and professionally
- Ask questions if feedback is unclear
- Make requested changes in separate commits
- Update the PR description if scope changes

## 🏷️ Release Process

Releases are managed by maintainers and follow semantic versioning:
- **Major**: Breaking changes
- **Minor**: New features, backwards compatible
- **Patch**: Bug fixes, backwards compatible

## ❓ Questions?

- Check existing [issues](https://github.com/nguyenvanduocit/carlens/issues) and [discussions](https://github.com/nguyenvanduocit/carlens/discussions)
- Start a new discussion for general questions
- Create an issue for bugs or feature requests
- Reach out to maintainers for urgent matters

Thank you for contributing to Carlens! 🚗✨