import { createClient } from 'redis';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
export class RedisService {
    client;
    isConnected = false;
    constructor() {
        this.client = createClient({
            socket: {
                host: config.redis.host,
                port: config.redis.port
            },
            password: config.redis.password,
            database: config.redis.db
        });
        this.client.on('error', (err) => {
            logger.error('Redis client error', { error: err });
        });
        this.client.on('connect', () => {
            logger.info('Redis client connected');
            this.isConnected = true;
        });
        this.client.on('disconnect', () => {
            logger.warn('Redis client disconnected');
            this.isConnected = false;
        });
    }
    /**
     * Connect to Redis
     */
    async connect() {
        if (!this.isConnected) {
            await this.client.connect();
        }
    }
    /**
     * Disconnect from Redis
     */
    async disconnect() {
        if (this.isConnected) {
            await this.client.quit();
        }
    }
    /**
     * Save conversation state
     */
    async saveConversation(state) {
        try {
            const key = `conversation:${state.sessionId}`;
            const value = JSON.stringify(state);
            await this.client.setEx(key, config.redis.sessionTTL, value);
            logger.debug('Conversation saved to Redis', { sessionId: state.sessionId });
        }
        catch (error) {
            logger.error('Error saving conversation to Redis', { error, sessionId: state.sessionId });
            throw error;
        }
    }
    /**
     * Get conversation state
     */
    async getConversation(sessionId) {
        try {
            const key = `conversation:${sessionId}`;
            const value = await this.client.get(key);
            if (!value) {
                logger.debug('Conversation not found in Redis', { sessionId });
                return null;
            }
            const state = JSON.parse(value);
            // Convert date strings back to Date objects
            state.startedAt = new Date(state.startedAt);
            state.lastActivityAt = new Date(state.lastActivityAt);
            state.conversationHistory = state.conversationHistory.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }));
            logger.debug('Conversation retrieved from Redis', { sessionId });
            return state;
        }
        catch (error) {
            logger.error('Error getting conversation from Redis', { error, sessionId });
            return null;
        }
    }
    /**
     * Delete conversation
     */
    async deleteConversation(sessionId) {
        try {
            const key = `conversation:${sessionId}`;
            await this.client.del(key);
            logger.debug('Conversation deleted from Redis', { sessionId });
        }
        catch (error) {
            logger.error('Error deleting conversation from Redis', { error, sessionId });
            throw error;
        }
    }
    /**
     * Extend conversation TTL
     */
    async extendConversation(sessionId) {
        try {
            const key = `conversation:${sessionId}`;
            await this.client.expire(key, config.redis.sessionTTL);
            logger.debug('Conversation TTL extended', { sessionId });
        }
        catch (error) {
            logger.error('Error extending conversation TTL', { error, sessionId });
            throw error;
        }
    }
    /**
     * Check if connected
     */
    isReady() {
        return this.isConnected;
    }
}
//# sourceMappingURL=RedisService.js.map