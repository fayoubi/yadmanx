import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  agencyName: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
  licenseNumber: string;
  agencyName: string;
}

interface OTPResponse {
  agentId: string;
  otp: string;
  expiresAt: string;
  phone?: string;
}

interface AgentAuthContextType {
  agent: Agent | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  register: (data: RegisterData) => Promise<OTPResponse>;
  login: (countryCode: string, phoneNumber: string) => Promise<OTPResponse>;
  verifyOTP: (phoneNumber: string, code: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AgentAuthContext = createContext<AgentAuthContextType | undefined>(undefined);

export const useAgentAuth = () => {
  const context = useContext(AgentAuthContext);
  if (context === undefined) {
    throw new Error('useAgentAuth must be used within an AgentAuthProvider');
  }
  return context;
};

interface AgentAuthProviderProps {
  children: ReactNode;
}

const AGENT_SERVICE_URL = 'http://localhost:3003/api/v1';
const TOKEN_KEY = 'agent_token';
const AGENT_KEY = 'agent_data';

export const AgentAuthProvider: React.FC<AgentAuthProviderProps> = ({ children }) => {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedAgent = localStorage.getItem(AGENT_KEY);

      if (storedToken && storedAgent) {
        try {
          // Verify token is still valid by fetching agent info
          const response = await fetch(`${AGENT_SERVICE_URL}/agents/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const result = await response.json();
            const agentFromAPI = result.data || result;
            const agentData: Agent = {
              id: agentFromAPI.id,
              firstName: agentFromAPI.first_name || agentFromAPI.firstName,
              lastName: agentFromAPI.last_name || agentFromAPI.lastName,
              email: agentFromAPI.email,
              phone: agentFromAPI.phone || agentFromAPI.phone_number,
              licenseNumber: agentFromAPI.license_number || agentFromAPI.licenseNumber,
              agencyName: agentFromAPI.agency_name || agentFromAPI.agencyName || '',
            };
            setAgent(agentData);
            setToken(storedToken);
          } else if (response.status === 401) {
            // Only clear storage if token is actually invalid (401)
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(AGENT_KEY);
          } else {
            // For other errors (500, network issues, etc.), fall back to stored data
            try {
              const parsedAgent = JSON.parse(storedAgent);
              setAgent(parsedAgent);
              setToken(storedToken);
            } catch {
              // If parsing fails, clear everything
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(AGENT_KEY);
            }
          }
        } catch (err) {
          console.error('Token verification failed:', err);
          // Fall back to stored agent data if API fails
          try {
            const parsedAgent = JSON.parse(storedAgent);
            setAgent(parsedAgent);
            setToken(storedToken);
          } catch {
            // If parsing fails, clear everything
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(AGENT_KEY);
          }
        }
      }

      setIsLoading(false);
    };

    verifyToken();
  }, []);

  const register = async (data: RegisterData): Promise<OTPResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${AGENT_SERVICE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: data.phone,
          country_code: data.countryCode,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          license_number: data.licenseNumber,
          agency_name: data.agencyName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Registration failed');
      }

      const result = await response.json();

      // Handle response format from backend
      return {
        agentId: result.data?.agent?.id || result.agentId || result.agent_id || '',
        otp: result.data?.otp?.code || result.otp || '',
        expiresAt: result.data?.otp?.expires_at || result.expiresAt || result.expires_at || '',
        phone: data.phone,
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (countryCode: string, phoneNumber: string): Promise<OTPResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${AGENT_SERVICE_URL}/auth/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          country_code: countryCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Login failed');
      }

      const result = await response.json();

      // Handle response format from backend
      return {
        agentId: result.data?.agent?.id || result.agentId || result.agent_id || '',
        otp: result.data?.otp?.code || result.otp || '',
        expiresAt: result.data?.otp?.expires_at || result.expiresAt || result.expires_at || '',
        phone: phoneNumber,
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (phoneNumber: string, code: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${AGENT_SERVICE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          code: code,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid verification code');
      }

      const result = await response.json();
      const agentData: Agent = {
        id: result.agent.id,
        firstName: result.agent.first_name || result.agent.firstName,
        lastName: result.agent.last_name || result.agent.lastName,
        email: result.agent.email,
        phone: result.agent.phone || result.agent.phone_number,
        licenseNumber: result.agent.license_number || result.agent.licenseNumber,
        agencyName: result.agent.agency_name || result.agent.agencyName || '',
      };

      setAgent(agentData);
      setToken(result.token);

      // Store in localStorage
      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(AGENT_KEY, JSON.stringify(agentData));
    } catch (err: any) {
      const errorMessage = err.message || 'Verification failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAgent(null);
    setToken(null);
    setError(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AGENT_KEY);
  };

  const clearError = () => {
    setError(null);
  };

  const value: AgentAuthContextType = {
    agent,
    token,
    isAuthenticated: !!token && !!agent,
    isLoading,
    error,
    register,
    login,
    verifyOTP,
    logout,
    clearError,
  };

  return (
    <AgentAuthContext.Provider value={value}>
      {children}
    </AgentAuthContext.Provider>
  );
};
