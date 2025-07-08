import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFlightTracking } from '@/hooks/useFlightTracking';
import { Plane, Clock, MapPin, Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

const FlightTracking: React.FC = () => {
  const { isConnected, flights, lastUpdate, error, reconnect } = useFlightTracking();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'delayed':
        return 'bg-yellow-500';
      case 'departed':
        return 'bg-green-500';
      case 'arrived':
        return 'bg-green-600';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'delayed':
      case 'cancelled':
        return 'destructive';
      case 'departed':
      case 'arrived':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (timeString: string) => {
    return new Date(timeString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with connection status */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Plane className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Live Flight Tracking</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  {isConnected ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600 font-medium">Disconnected</span>
                    </>
                  )}
                  {lastUpdate && (
                    <span className="text-xs text-muted-foreground ml-2">
                      Last update: {formatTime(lastUpdate)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {error && (
              <Button
                onClick={reconnect}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reconnect</span>
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Error message */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flight updates */}
      <div className="grid gap-4">
        {flights.length === 0 && !error ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="flex flex-col items-center space-y-2 text-muted-foreground">
                <Plane className="h-8 w-8" />
                <p>No recent flight updates</p>
                <p className="text-sm">Live updates will appear here</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          flights.map((flight) => (
            <Card 
              key={flight.id} 
              className="transition-all duration-300 hover:shadow-lg border-l-4 border-l-primary/30 hover:border-l-primary animate-in slide-in-from-left-1"
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(flight.status)} animate-pulse`} />
                    <div>
                      <h3 className="font-semibold text-lg">{flight.flight_number}</h3>
                      <p className="text-sm text-muted-foreground">{flight.airline_name}</p>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(flight.status)} className="capitalize">
                    {flight.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Departure */}
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{flight.origin_airport}</p>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(flight.departure_time)}</span>
                        <span className="text-xs">({formatDate(flight.departure_time)})</span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <div className="w-8 h-px bg-primary" />
                      <Plane className="h-4 w-4 text-primary" />
                      <div className="w-8 h-px bg-primary" />
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    </div>
                  </div>

                  {/* Arrival */}
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{flight.destination_airport}</p>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(flight.arrival_time)}</span>
                        <span className="text-xs">({formatDate(flight.arrival_time)})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Last updated */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Last updated: {formatTime(flight.updated_at)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FlightTracking;