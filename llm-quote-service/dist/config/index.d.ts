export declare const config: {
    server: {
        port: number;
        env: string;
        corsOrigins: string[];
    };
    claude: {
        apiKey: string;
        model: string;
        maxTokens: number;
        temperature: number;
    };
    pricingService: {
        url: string;
        timeout: number;
    };
    redis: {
        host: string;
        port: number;
        password: string | undefined;
        db: number;
        sessionTTL: number;
    };
    postgres: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
        max: number;
    };
    conversation: {
        maxRetries: number;
        defaultCoverageAmount: number;
        quoteExpiryHours: number;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
};
export declare function validateConfig(): void;
//# sourceMappingURL=index.d.ts.map