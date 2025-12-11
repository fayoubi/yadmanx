import dotenv from 'dotenv';
dotenv.config();
export const config = {
    // Server Configuration
    server: {
        port: parseInt(process.env.PORT || '3004', 10),
        env: process.env.NODE_ENV || 'development',
        corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
    },
    // Claude API Configuration
    claude: {
        apiKey: process.env.CLAUDE_API_KEY || '',
        model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
        maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '1024', 10),
        temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.7')
    },
    // Pricing Service Configuration
    pricingService: {
        url: process.env.PRICING_SERVICE_URL || 'http://localhost:3001',
        timeout: parseInt(process.env.PRICING_SERVICE_TIMEOUT || '10000', 10)
    },
    // Redis Configuration
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        sessionTTL: parseInt(process.env.SESSION_TTL || '1800', 10) // 30 minutes
    },
    // PostgreSQL Configuration
    postgres: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5435', 10),
        database: process.env.POSTGRES_DB || 'llm_quotes',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20', 10)
    },
    // Conversation Settings
    conversation: {
        maxRetries: parseInt(process.env.MAX_FIELD_RETRIES || '2', 10),
        defaultCoverageAmount: parseInt(process.env.DEFAULT_COVERAGE_AMOUNT || '500000', 10),
        quoteExpiryHours: parseInt(process.env.QUOTE_EXPIRY_HOURS || '48', 10)
    },
    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
    }
};
// Validation
export function validateConfig() {
    const requiredVars = [
        { name: 'CLAUDE_API_KEY', value: config.claude.apiKey }
    ];
    const missing = requiredVars.filter(v => !v.value);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.map(v => v.name).join(', ')}`);
    }
}
//# sourceMappingURL=index.js.map