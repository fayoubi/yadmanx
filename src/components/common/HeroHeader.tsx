import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';

interface HeroHeaderProps {
  title?: string;
  subtitle?: string;
  description?: string;
  showButtons?: boolean;
}

const HeroHeader: React.FC<HeroHeaderProps> = ({
  title = "YadmanX",
  subtitle = "Your Insurance Solution",
  description = "Get instant quotes and start your application in minutes.",
  showButtons = true
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-primary-900 text-white">
      {/* Top Navigation Bar */}
      <div className="border-b border-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">YadmanX</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-white/80 hover:text-white transition-colors">
                Get Quote
              </Link>
              <Link to="/ai-quote" className="text-white/80 hover:text-white transition-colors flex items-center gap-1">
                <span>AI Assistant</span>
                <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold">NEW</span>
              </Link>
              <Link to="/about" className="text-white/80 hover:text-white transition-colors">
                About
              </Link>
              <Link to="/contact" className="text-white/80 hover:text-white transition-colors">
                Contact
              </Link>
              <Link
                to="/agent/login"
                className="bg-white text-primary-900 hover:bg-primary-100 px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Agent Login
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Hero Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {title}
          </h1>
          <p className="text-xl md:text-2xl text-primary-100 mb-4">
            {subtitle}
          </p>
          <p className="text-lg text-primary-200 mb-8 max-w-3xl mx-auto">
            {description}
          </p>
          {showButtons && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="bg-accent-500 hover:bg-accent-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center"
              >
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="border-2 border-white text-white hover:bg-white hover:text-primary-900 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Request Demo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroHeader;
