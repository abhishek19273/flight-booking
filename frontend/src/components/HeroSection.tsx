
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-purple-900/60 z-10"></div>
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600">
              <defs>
                <linearGradient id="skyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" />
                  <stop offset="50%" style="stop-color:#4169E1;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#191970;stop-opacity:1" />
                </linearGradient>
              </defs>
              <rect width="1200" height="600" fill="url(#skyGradient)"/>
              <circle cx="200" cy="150" r="3" fill="white" opacity="0.6"/>
              <circle cx="400" cy="100" r="2" fill="white" opacity="0.4"/>
              <circle cx="600" cy="200" r="2.5" fill="white" opacity="0.5"/>
              <circle cx="800" cy="120" r="2" fill="white" opacity="0.7"/>
              <circle cx="1000" cy="180" r="3" fill="white" opacity="0.3"/>
              <path d="M 100 300 Q 300 250 500 300 T 900 300" stroke="white" stroke-width="2" fill="none" opacity="0.3"/>
              <path d="M 200 400 Q 400 350 600 400 T 1000 400" stroke="white" stroke-width="1.5" fill="none" opacity="0.2"/>
            </svg>
          `)}`
        }}
      ></div>

      {/* Content */}
      <div className="relative z-20 text-center text-white px-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-center space-x-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
          ))}
          <span className="ml-2 text-yellow-400 font-medium">Rated #1 Flight Booking Platform</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Discover Your Next
          <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Adventure
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-2xl mx-auto leading-relaxed">
          Book flights to over 1,000 destinations worldwide with our best price guarantee and seamless booking experience.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 text-lg px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105">
            Start Your Journey
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button variant="ghost" size="lg" className="text-white border-white hover:bg-white/10 text-lg px-8 py-3 rounded-xl">
            Explore Destinations
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/20">
          <div>
            <div className="text-3xl font-bold text-blue-300">1M+</div>
            <div className="text-blue-100">Happy Travelers</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-300">500+</div>
            <div className="text-blue-100">Airlines</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-300">1000+</div>
            <div className="text-blue-100">Destinations</div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse hidden lg:block"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-white/10 rounded-full animate-pulse hidden lg:block"></div>
      <div className="absolute top-40 right-20 w-12 h-12 bg-white/10 rounded-full animate-pulse hidden lg:block"></div>
    </section>
  );
};

export default HeroSection;
