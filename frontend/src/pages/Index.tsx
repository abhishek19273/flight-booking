import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import FlightSearchForm from '@/components/FlightSearchForm';
import FeaturedDestinations from '@/components/FeaturedDestinations';
import HeroSection from '@/components/HeroSection';
import { FlightSearchParams } from '@/types';
import { Button } from '@/components/ui/button';
import { Plane, Search, ShieldCheck, Clock, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSearch = (searchParams: FlightSearchParams) => {
    const params = new URLSearchParams({
      from: searchParams.from,
      to: searchParams.to,
      departureDate: searchParams.departureDate,
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 text-gray-800">
      {/* Navigation */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/80 sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              <Plane className="h-9 w-9 text-indigo-600" />
              <span className="text-2xl font-extrabold text-gray-900 tracking-tight">SkyBound</span>
            </div>
            <nav className="hidden md:flex items-center space-x-10">
              <a href="#search" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">Search Flights</a>
              <a href="#destinations" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">Destinations</a>
              <a href="#why-us" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">Why Us</a>
              <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">Deals</a>
            </nav>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700 font-medium hidden sm:inline">
                    Welcome, {user.user_metadata?.first_name || user.email?.split('@')[0]}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-gray-600 hover:text-indigo-600"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="text-gray-600 hover:text-indigo-600 font-semibold"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => navigate('/signup')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                  >
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="relative">
          <HeroSection />
          {/* <div className="relative -mt-48 z-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <FlightSearchForm onSearch={handleSearch} />
            </div>
          </div> */}
        </div>

        <div id="destinations" className="bg-white">
          <FeaturedDestinations />
        </div>

        {/* Why Choose Us Section */}
        <section id="why-us" className="py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">Why Fly With SkyBound?</h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">Your journey is our priority. We offer the best services to make your travel seamless and enjoyable.</p>
            </div>
            <div className="mt-20 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto mb-6">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Easy Search</h3>
                <p className="mt-4 text-lg text-gray-600">Find the best flights with our powerful and easy-to-use search engine.</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto mb-6">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Secure Payments</h3>
                <p className="mt-4 text-lg text-gray-600">Your payments are safe and secure with our industry-standard encryption.</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto mb-6">
                  <Clock className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">24/7 Support</h3>
                <p className="mt-4 text-lg text-gray-600">Our team is here to help you anytime, anywhere. We are always available for you.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-white py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">What Our Customers Say</h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">We are proud to have a large number of satisfied customers.</p>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              <Card className="border-0 bg-gray-50/80 rounded-2xl">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <img className="h-12 w-12 rounded-full mr-4" src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User avatar" />
                    <div>
                      <p className="font-bold text-gray-900">Sarah L.</p>
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600">"Booking my flight with SkyBound was a breeze. The website is beautiful and easy to navigate. I found the perfect flight in minutes!"</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gray-50/80 rounded-2xl">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <img className="h-12 w-12 rounded-full mr-4" src="https://i.pravatar.cc/150?u=a042581f4e29026704e" alt="User avatar" />
                    <div>
                      <p className="font-bold text-gray-900">Michael B.</p>
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600">"The flight search is incredibly fast and the prices are very competitive. I will definitely be using SkyBound for all my future travels."</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gray-50/80 rounded-2xl">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <img className="h-12 w-12 rounded-full mr-4" src="https://i.pravatar.cc/150?u=a042581f4e29026704f" alt="User avatar" />
                    <div>
                      <p className="font-bold text-gray-900">Jessica T.</p>
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600">"I love the featured destinations section. It gave me great ideas for my next vacation. The whole experience was top-notch!"</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-20 sm:py-28">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">Stay in the Loop</h2>
            <p className="mt-4 text-xl text-gray-600">Subscribe to our newsletter to get the latest deals, news, and updates.</p>
            <form className="mt-8 sm:flex justify-center">
              <input type="email" placeholder="Enter your email" className="w-full sm:w-auto max-w-md px-5 py-4 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
              <Button type="submit" size="lg" className="mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">Subscribe</Button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-screen-xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Plane className="h-8 w-8 text-indigo-400" />
                <span className="text-2xl font-bold">SkyBound</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Your trusted partner for seamless flight booking experiences worldwide. Discover, book, and manage your travel with ease.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 tracking-wider uppercase text-gray-300">Company</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 tracking-wider uppercase text-gray-300">Support</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 tracking-wider uppercase text-gray-300">Travel</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Flight Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Check-in</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Manage Booking</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Travel Guides</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} SkyBound. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
