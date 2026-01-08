import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAgentAuth } from '../../context/AgentAuthContext';

interface AuthenticatedHeaderProps {
  context: 'dashboard' | 'enrollment';
}

const AuthenticatedHeader: React.FC<AuthenticatedHeaderProps> = ({ context }) => {
  const { agent, isAuthenticated, logout } = useAgentAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/agent/login');
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.open('/', '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="bg-primary-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex justify-between items-center">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo - Always opens in new window */}
            <a
              href="/"
              onClick={handleLogoClick}
              className="flex items-center space-x-2"
            >
              <Shield className="h-6 w-6 text-white" />
              <span className="text-xl font-bold text-white">YadmanX</span>
            </a>

            {/* Navigation */}
            <nav className="flex items-center space-x-6">
              {/* Dashboard Link - Always uses React Router */}
              <Link
                to="/agent/dashboard"
                className="text-white font-medium hover:text-white/90 transition-colors"
              >
                Dashboard
              </Link>

              {/* About Link - Context-dependent */}
              {context === 'enrollment' ? (
                <a
                  href="/about"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-white/90 transition-colors"
                >
                  About
                </a>
              ) : (
                <Link
                  to="/about"
                  className="text-white hover:text-white/90 transition-colors"
                >
                  About
                </Link>
              )}

              {/* Contact Link - Context-dependent */}
              {context === 'enrollment' ? (
                <a
                  href="/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-white/90 transition-colors"
                >
                  Contact
                </a>
              ) : (
                <Link
                  to="/contact"
                  className="text-white hover:text-white/90 transition-colors"
                >
                  Contact
                </Link>
              )}
            </nav>
          </div>

          {/* Right side - Agent Info and Logout OR Login Button */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && agent ? (
              <>
                <div className="text-white text-sm font-medium">
                  {agent.firstName} {agent.lastName} | Lic# {agent.licenseNumber}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white border-2 border-white rounded-md hover:bg-white hover:text-primary-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/agent/login"
                className="bg-white text-primary-900 hover:bg-primary-50 px-6 py-2 rounded-lg font-semibold transition-colors shadow-sm"
              >
                Agent Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AuthenticatedHeader;
