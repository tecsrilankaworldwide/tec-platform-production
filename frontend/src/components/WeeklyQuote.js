import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Quote, Sparkles, Calendar } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WeeklyQuote = ({ placement = 'sidebar' }) => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuote();
  }, []);

  const loadQuote = async () => {
    try {
      const response = await axios.get(`${API}/quotes/weekly`);
      setQuote(response.data);
    } catch (error) {
      console.error('Failed to load weekly quote:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse p-6 rounded-3xl" style={{background: 'var(--pastel-lavender)'}}>
        <div className="h-4 bg-purple-200 rounded mb-3 w-3/4"></div>
        <div className="h-4 bg-purple-200 rounded mb-2 w-full"></div>
        <div className="h-4 bg-purple-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!quote) return null;

  // Sidebar version (vertical, compact)
  if (placement === 'sidebar') {
    return (
      <div 
        className="rounded-3xl p-6 shadow-lg border-3 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #E6E6FA 0%, #FFD6E8 100%)',
          borderColor: 'var(--vibrant-purple)'
        }}
        data-testid="weekly-quote-sidebar"
      >
        {/* Decorative Quote Icon */}
        <div className="absolute -top-3 -right-3 w-20 h-20 rounded-full flex items-center justify-center opacity-20" style={{background: 'var(--vibrant-purple)'}}>
          <Quote className="w-12 h-12 text-white" />
        </div>

        {/* Week Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md" style={{background: 'var(--vibrant-purple)'}}>
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{color: 'var(--vibrant-purple)'}}>
              Week {quote.cycle_week} of 12
            </p>
            <p className="text-xs" style={{color: 'var(--text-muted)'}}>
              {quote.theme}
            </p>
          </div>
        </div>

        {/* Quote Text */}
        <div className="mb-4 relative z-10">
          <Quote className="w-6 h-6 mb-2" style={{color: 'var(--vibrant-purple)'}} />
          <p className="text-base leading-relaxed italic font-medium" style={{color: 'var(--text-heading)'}}>
            "{quote.quote}"
          </p>
        </div>

        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t-2" style={{borderColor: 'var(--pastel-purple)'}}>
          <span className="text-3xl">{quote.image}</span>
          <div>
            <p className="font-extrabold text-sm" style={{color: 'var(--text-heading)', fontFamily: 'var(--font-primary)'}}>
              {quote.author}
            </p>
            <p className="text-xs" style={{color: 'var(--text-muted)'}}>
              {quote.title}
            </p>
          </div>
        </div>

        {/* Sparkle decoration */}
        <div className="absolute bottom-3 right-3">
          <Sparkles className="w-5 h-5" style={{color: 'var(--vibrant-pink)'}} />
        </div>
      </div>
    );
  }

  // Banner version (horizontal, for top of page)
  return (
    <div 
      className="rounded-3xl p-8 shadow-xl border-3 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #E6E6FA 0%, #D4F4E7 50%, #FFD6E8 100%)',
        borderColor: 'var(--vibrant-purple)'
      }}
      data-testid="weekly-quote-banner"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
        <Quote className="w-full h-full" style={{color: 'var(--vibrant-purple)'}} />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Author Avatar/Image */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-xl border-4 border-white" style={{background: 'var(--vibrant-purple)'}}>
            <span className="text-5xl md:text-6xl">{quote.image}</span>
          </div>
        </div>

        {/* Quote Content */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="px-4 py-2 rounded-full shadow-md" style={{background: 'white'}}>
              <span className="text-sm font-extrabold uppercase tracking-wider" style={{color: 'var(--vibrant-purple)', fontFamily: 'var(--font-primary)'}}>
                💎 Week {quote.cycle_week} Wisdom
              </span>
            </div>
            <span className="text-sm font-semibold" style={{color: 'var(--text-muted)'}}>
              {quote.theme}
            </span>
          </div>

          <p className="text-2xl md:text-3xl font-bold italic mb-4 leading-relaxed" style={{color: 'var(--text-heading)', fontFamily: 'var(--font-primary)'}}>
            "{quote.quote}"
          </p>

          <div className="flex items-center gap-3">
            <div className="w-1 h-12 rounded-full" style={{background: 'var(--vibrant-pink)'}}></div>
            <div>
              <p className="font-extrabold text-lg" style={{color: 'var(--text-heading)', fontFamily: 'var(--font-primary)'}}>
                — {quote.author}
              </p>
              <p className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>
                {quote.title}
              </p>
            </div>
          </div>
        </div>

        {/* Week indicator */}
        <div className="flex-shrink-0 text-center">
          <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-lg" style={{background: 'white'}}>
            <Calendar className="w-6 h-6 mb-1" style={{color: 'var(--vibrant-purple)'}} />
            <span className="text-xs font-bold" style={{color: 'var(--vibrant-purple)'}}>
              {quote.cycle_week}/12
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyQuote;
