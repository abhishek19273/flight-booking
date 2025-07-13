import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFlightTracking } from '@/hooks/useFlightTracking';
import { Plane, Clock, Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

const FlightTracking: React.FC = () => {
  const { isConnected, flights, lastUpdate, error, reconnect } = useFlightTracking();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'on time':
        return 'bg-green-500';
      case 'delayed':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="space-y-6">
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
              key={flight.flight_id}
              className="transition-all duration-300 hover:shadow-lg border-l-4 border-l-primary/30 hover:border-l-primary animate-in slide-in-from-left-1"
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(flight.status)} animate-pulse`} />
                    <div>
                      <h3 className="font-semibold text-lg">{flight.flight_id}</h3>
                    </div>
                  </div>
                  <Badge variant={flight.status.toLowerCase() === 'cancelled' || flight.status.toLowerCase() === 'delayed' ? 'destructive' : 'secondary'} className="capitalize">
                    {flight.status}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4">{flight.message}</p>

                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Last updated: {formatTime(flight.updated_at)}</span>
                  </div>
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