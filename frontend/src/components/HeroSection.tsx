
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-[650px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-500">
      {/* Background decorative shapes */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full filter blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto  pb-10 sm:pt-32 sm:pb-56 lg:pt-10 lg:pb-10">
        <div className="inline-flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full py-2 px-4 mb-6">
          <Star className="h-5 w-5 text-yellow-300 fill-current mr-2" />
          <span className="font-medium text-sm">Rated #1 Flight Booking Platform</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tighter">
          Discover Your Next
          <span className="block bg-gradient-to-r from-sky-300 to-blue-300 bg-clip-text text-transparent mt-2">
            Adventure
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-10 text-indigo-100 max-w-3xl mx-auto leading-relaxed">
          Book flights to over 1,000 destinations worldwide with our best price guarantee and seamless booking experience.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Button asChild size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 text-lg px-10 py-7 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-2xl hover:cursor-pointer" onClick={() => navigate('/search')}>
            <a>
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-indigo-700 border-indigo-700 hover:bg-white/10 hover:border-white text-lg px-10 py-7 rounded-xl font-bold transition-all hover:cursor-pointer">
            <a href="#destinations">
              Explore Destinations
            </a>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 pt-10 border-t border-white/20 max-w-2xl mx-auto">
          <div>
            <div className="text-4xl font-bold text-sky-200">1M+</div>
            <div className="text-indigo-100 font-medium">Happy Travelers</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-sky-200">500+</div>
            <div className="text-indigo-100 font-medium">Airlines</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-sky-200">1000+</div>
            <div className="text-indigo-100 font-medium">Destinations</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
