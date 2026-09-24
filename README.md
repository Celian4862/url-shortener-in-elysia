# URL Shortener in Elysia

## Overview
A high-performance RESTful URL shortener API built to explore modern backend tooling and architecture. It takes a long URL, generates a unique 8-character Base62 string, and redirects users while tracking hit counts.

## Tech Stack
- **Elysia.js / Bun:** Ultra-fast runtime and web framework with built-in TypeBox request validation.
- **Redis:** Used for high-speed IP-based rate limiting and caching target URLs to minimize database reads.
- **SQLite:** Lightweight relational database for persistent storage.
- **Drizzle ORM:** Type-safe query builder providing near-raw SQL performance and safety.

## Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- [Bun](https://bun.sh)
- [Redis](https://redis.io)
- Git

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Celian4862/url-shortener-with-elysia.git](https://github.com/Celian4862/url-shortener-with-elysia.git)
   cd url-shortener-with-elysia
   ```
2. **Install dependencies**
	```bash
	bun install
	```
3. **Start the development server**
	```bash
	bun run dev
	```

The server will start at http://localhost:3000. You can view the interactive OpenAPI documentation by navigating to http://localhost:3000/openapi.
