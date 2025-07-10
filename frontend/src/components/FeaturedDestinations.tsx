
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';

const destinations = [
  {
    city: 'Paris',
    country: 'France',
    price: 450,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=800&q=60',
  },
  {
    city: 'Tokyo',
    country: 'Japan',
    price: 780,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60',
  },
  {
    city: 'Sydney',
    country: 'Australia',
    price: 920,
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=800&q=60',
  },
  {
    city: 'Rome',
    country: 'Italy',
    price: 380,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60',
  }
];

const FeaturedDestinations = () => {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Featured Destinations
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600">
            Explore our most popular destinations and find your next adventure.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((dest) => (
            <Card key={dest.city} className="overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group transform hover:-translate-y-2 border-0">
              <div className="relative h-64">
                <img src={dest.image} alt={dest.city} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute top-4 right-4 flex items-center bg-white/90 text-gray-800 px-3 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm">
                  <Star className="h-4 w-4 text-yellow-500 fill-current mr-1.5" />
                  <span>{dest.rating}</span>
                </div>
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-2xl font-bold text-white">{dest.city}</h3>
                  <p className="text-md text-gray-200">{dest.country}</p>
                </div>
              </div>
              <CardContent className="p-6 bg-white">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">From</p>
                    <p className="text-3xl font-bold text-gray-900">${dest.price}</p>
                  </div>
                  <Button asChild size="lg" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 group-hover:scale-105 transition-transform">
                    <a href="#">
                      Explore
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedDestinations;
