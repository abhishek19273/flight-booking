
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Star } from 'lucide-react';

const FeaturedDestinations = () => {
  const destinations = [
    {
      id: 1,
      city: 'Paris',
      country: 'France',
      price: 'from $599',
      image: 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
          <defs>
            <linearGradient id="parisGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#FF6B6B;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#4ECDC4;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#parisGradient)"/>
          <polygon points="200,50 150,150 250,150" fill="white" opacity="0.8"/>
          <rect x="190" y="150" width="20" height="100" fill="white" opacity="0.8"/>
          <text x="200" y="280" text-anchor="middle" fill="white" font-size="24" font-weight="bold">Paris</text>
        </svg>
      `),
      rating: 4.8,
      description: 'City of Light and Romance'
    },
    {
      id: 2,
      city: 'Tokyo',
      country: 'Japan',
      price: 'from $899',
      image: 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
          <defs>
            <linearGradient id="tokyoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#FF9A9E;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#FECFEF;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#tokyoGradient)"/>
          <circle cx="200" cy="80" r="30" fill="white" opacity="0.9"/>
          <rect x="150" y="120" width="100" height="120" fill="white" opacity="0.8"/>
          <rect x="170" y="140" width="15" height="15" fill="#FF6B6B"/>
          <rect x="215" y="140" width="15" height="15" fill="#FF6B6B"/>
          <text x="200" y="280" text-anchor="middle" fill="white" font-size="24" font-weight="bold">Tokyo</text>
        </svg>
      `),
      rating: 4.9,
      description: 'Modern Metropolis meets Tradition'
    },
    {
      id: 3,
      city: 'New York',
      country: 'USA',
      price: 'from $399',
      image: 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
          <defs>
            <linearGradient id="nyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#nyGradient)"/>
          <rect x="100" y="80" width="20" height="160" fill="white" opacity="0.9"/>
          <rect x="140" y="60" width="20" height="180" fill="white" opacity="0.8"/>
          <rect x="180" y="40" width="20" height="200" fill="white" opacity="0.9"/>
          <rect x="220" y="70" width="20" height="170" fill="white" opacity="0.8"/>
          <rect x="260" y="90" width="20" height="150" fill="white" opacity="0.9"/>
          <text x="200" y="280" text-anchor="middle" fill="white" font-size="24" font-weight="bold">New York</text>
        </svg>
      `),
      rating: 4.7,
      description: 'The City That Never Sleeps'
    },
    {
      id: 4,
      city: 'Dubai',
      country: 'UAE',
      price: 'from $699',
      image: 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
          <defs>
            <linearGradient id="dubaiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#dubaiGradient)"/>
          <polygon points="200,30 120,200 280,200" fill="white" opacity="0.9"/>
          <circle cx="200" cy="60" r="15" fill="#FFD700"/>
          <text x="200" y="280" text-anchor="middle" fill="white" font-size="24" font-weight="bold">Dubai</text>
        </svg>
      `),
      rating: 4.8,
      description: 'Luxury and Innovation Hub'
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Destinations</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover amazing places around the world with our exclusive flight deals and packages.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {destinations.map((destination) => (
          <Card key={destination.id} className="group cursor-pointer overflow-hidden border-0 bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="relative h-48 overflow-hidden">
              <img 
                src={destination.image} 
                alt={destination.city}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-semibold text-gray-800">
                {destination.price}
              </div>
              <div className="absolute bottom-4 left-4 flex items-center space-x-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs font-medium text-gray-800">{destination.rating}</span>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">{destination.country}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{destination.city}</h3>
              <p className="text-gray-600 text-sm mb-4">{destination.description}</p>
              <Button 
                variant="ghost" 
                className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
              >
                Explore Flights
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12">
        <Button 
          size="lg" 
          variant="outline"
          className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
        >
          View All Destinations
        </Button>
      </div>
    </section>
  );
};

export default FeaturedDestinations;
