# Configuration Files Explained

This document provides detailed explanations of all configuration files in the MultiGenQA project to help teammates understand how the project is set up and configured.

## Frontend Configuration

### package.json

This file configures the Node.js project for the React TypeScript frontend application.

**Key Sections:**

#### Scripts
- `start`: Starts development server with hot reload at http://localhost:3000
- `build`: Creates optimized production bundle in `/build` directory
- `test`: Runs Jest tests in watch mode for development
- `test:coverage`: Generates test coverage report
- `test:ci`: Runs tests once for CI/CD pipelines
- `lint`: Checks TypeScript files for code quality issues
- `lint:fix`: Automatically fixes linting errors where possible
- `type-check`: Verifies TypeScript types without emitting files
- `format`: Formats code with Prettier
- `analyze`: Analyzes bundle size and composition

#### Dependencies (Production)
- `react` & `react-dom`: Core React framework for building UI
- `react-scripts`: Create React App build tools and configuration
- `typescript`: TypeScript compiler for type safety
- `axios`: HTTP client for API requests to backend
- `lucide-react`: Modern icon library

#### DevDependencies (Development Only)
- `@testing-library/*`: Testing utilities for React components
- `@typescript-eslint/*`: ESLint rules and parser for TypeScript
- `eslint-plugin-*`: Additional ESLint rules for React, accessibility, etc.
- `prettier`: Code formatter for consistent style
- `husky`: Git hooks manager for automated quality checks
- `lint-staged`: Run linters only on staged files
- `@playwright/test`: End-to-end testing framework

#### Tool Configurations
- **ESLint**: Extends Create React App's built-in rules
- **Prettier**: Configured for 2-space indentation, single quotes, 100-char line width
- **Browserslist**: Targets modern browsers in development, broader compatibility in production
- **Jest**: Requires 70% code coverage across all metrics
- **Husky**: Runs linting on commit, type-checking and tests on push

### tsconfig.json

TypeScript compiler configuration optimized for React development.

**Key Settings:**

#### Compilation
- `target: "es5"`: Compiles to ES5 for broad browser compatibility
- `lib`: Includes DOM and ES6 type definitions
- `jsx: "react-jsx"`: Uses React 17+ JSX transform (no need to import React)

#### Type Checking
- `strict: true`: Enables all strict type checking options
- `noFallthroughCasesInSwitch`: Prevents accidental switch fallthrough
- `forceConsistentCasingInFileNames`: Ensures consistent file naming

#### Module System
- `module: "esnext"`: Uses latest ES module syntax
- `moduleResolution: "node"`: Uses Node.js resolution strategy
- `esModuleInterop: true`: Enables CommonJS/ES module interoperability

#### Build Optimization
- `isolatedModules: true`: Each file can be transpiled independently
- `noEmit: true`: No file emission (handled by react-scripts)
- `skipLibCheck: true`: Skip checking declaration files for faster builds

## Docker Configuration

### Dockerfile.frontend

Multi-stage Docker build for the React frontend.

**Stage 1: Builder**
- Uses `node:18-alpine` base image for small footprint
- Installs native build dependencies (python3, make, g++)
- Copies package files first for better Docker layer caching
- Runs `npm ci` for exact dependency installation
- Sets production environment variables
- Builds optimized React bundle
- Removes source maps and unnecessary files

**Stage 2: Production**
- Uses `nginx:alpine` for lightweight web server
- Creates non-root user for security
- Copies built application from builder stage
- Configures nginx with custom settings
- Sets up proper file permissions
- Creates custom error pages
- Exposes ports 80, 443, and 8080
- Includes health check endpoint
- Runs nginx in non-daemon mode

**Security Features:**
- Non-root user execution
- Minimal base image (Alpine Linux)
- Regular security updates
- Proper file permissions
- Custom error pages

### Dockerfile.backend

Multi-stage Docker build for the Python Flask backend.

**Stage 1: Builder**
- Uses `python:3.11-slim` for Python 3.11 support
- Installs build dependencies (gcc, g++, libpq-dev)
- Creates virtual environment for dependency isolation
- Installs Python packages with pip

**Stage 2: Production**
- Uses clean `python:3.11-slim` base
- Creates non-root user `appuser`
- Installs only runtime dependencies (libpq5, curl)
- Copies virtual environment from builder
- Sets up application directory with proper permissions
- Exposes port 5001 for Flask application
- Includes health check via `/api/health` endpoint
- Runs with Gunicorn WSGI server for production

**Gunicorn Configuration:**
- 4 worker processes for handling concurrent requests
- gthread worker class with 2 threads each
- 1000 max requests per worker (prevents memory leaks)
- Preload application for better performance
- Logs to stdout/stderr for container logging

**Security Features:**
- Non-root user execution
- Minimal base image
- Security updates installed
- Virtual environment isolation
- Health monitoring

## Key Benefits

### Development Experience
- **Hot Reload**: Instant feedback during development
- **Type Safety**: TypeScript catches errors at compile time
- **Code Quality**: ESLint and Prettier ensure consistent, high-quality code
- **Testing**: Comprehensive testing setup with coverage requirements
- **Git Hooks**: Automated quality checks prevent bad code from being committed

### Production Deployment
- **Docker**: Consistent deployment across environments
- **Multi-stage Builds**: Small, optimized container images
- **Security**: Non-root users, minimal base images, regular updates
- **Performance**: Nginx for static files, Gunicorn for Python app
- **Monitoring**: Health checks and proper logging

### Team Collaboration
- **Consistent Formatting**: Prettier ensures uniform code style
- **Pre-commit Hooks**: Catch issues before they reach the repository
- **TypeScript**: Self-documenting code with type annotations
- **Testing Requirements**: High coverage standards maintain code quality
- **Modern Tooling**: Industry-standard tools and practices

This configuration provides a robust, scalable, and maintainable foundation for the MultiGenQA application.