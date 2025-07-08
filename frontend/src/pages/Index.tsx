
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Plane, Search, Star, Shield, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import FlightSearchForm from '@/components/FlightSearchForm';
import FeaturedDestinations from '@/components/FeaturedDestinations';
import HeroSection from '@/components/HeroSection';
import { FlightSearchParams } from '@/hooks/useFlightSearch';

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSearch = (searchParams: FlightSearchParams) => {
    // Navigate to search page with search parameters
    const params = new URLSearchParams({
      from: searchParams.from,
      to: searchParams.to,
      departDate: searchParams.departDate,
      ...(searchParams.returnDate && { returnDate: searchParams.returnDate }),
      adults: searchParams.passengers.adults.toString(),
      children: searchParams.passengers.children.toString(),
      infants: searchParams.passengers.infants.toString(),
      cabinClass: searchParams.cabinClass,
      tripType: searchParams.tripType,
    });
    navigate(`/search?${params.toString()}`);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Plane className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">SkyBound</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => navigate('/search')} className="text-gray-700 hover:text-blue-600 transition-colors">Search Flights</button>
              <button onClick={() => navigate('/tracking')} className="text-gray-700 hover:text-blue-600 transition-colors">Track Flights</button>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Hotels</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Cars</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Deals</a>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">
                    Welcome, {user.user_metadata?.first_name || user.email}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="text-gray-700 hover:text-blue-600"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/auth')}
                    className="text-gray-700 hover:text-blue-600"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => navigate('/auth')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Flight Search Section */}
      <section className="relative -mt-20 z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <FlightSearchForm onSearch={handleSearch} />
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose SkyBound?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience seamless flight booking with our advanced search, best price guarantee, and 24/7 support.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow border-0 bg-white/60 backdrop-blur-sm">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Search</h3>
            <p className="text-gray-600">
              Find the best flights with our intelligent search engine that compares prices across airlines.
            </p>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow border-0 bg-white/60 backdrop-blur-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Best Price Guarantee</h3>
            <p className="text-gray-600">
              We guarantee the best prices. Find a lower price elsewhere and we'll match it.
            </p>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow border-0 bg-white/60 backdrop-blur-sm">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 Support</h3>
            <p className="text-gray-600">
              Our customer support team is available around the clock to assist with your travel needs.
            </p>
          </Card>
        </div>
      </section>

      {/* Featured Destinations */}
      <FeaturedDestinations />

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 bg-white border-0 shadow-sm">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, index) => (
                    <Star key={index} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Amazing experience! The booking process was smooth and the customer service was exceptional."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold text-gray-900">John Smith</p>
                    <p className="text-sm text-gray-500">Verified Customer</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Plane className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-bold">SkyBound</span>
              </div>
              <p className="text-gray-400">
                Your trusted partner for seamless flight booking experiences worldwide.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Travel</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Flight Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Check-in</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Manage Booking</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Travel Guides</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SkyBound. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
