import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RocketIcon, CheckCircle2, XCircle, Hourglass, PlaneTakeoff, PlaneLanding, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface FlightStatus {
  status: string;
  location: string;
  details: string;
}

class RetriableError extends Error { }
class FatalError extends Error { }

const FlightTrackingPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { session } = useAuth();
  const [statusUpdates, setStatusUpdates] = useState<FlightStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!bookingId || !session?.access_token) return;

    const ctrl = new AbortController();

    fetchEventSource(`/flights/track/${bookingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Accept': 'text/event-stream',
      },
      signal: ctrl.signal,
      onopen: async (response) => {
        if (response.ok) {
          console.log('SSE connection established');
          setError(null);
        } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          // Client-side errors are usually not retriable
          throw new FatalError(`Client error: ${response.status}`);
        }
      },
      onmessage: (event) => {
        try {
          const newStatus = JSON.parse(event.data) as FlightStatus;
          if (newStatus.status === 'Complete') {
            setIsComplete(true);
            ctrl.abort(); // Close the connection
            return;
          }
          setStatusUpdates((prevUpdates) => [...prevUpdates, newStatus]);
        } catch (e) {
          console.error('Failed to parse SSE message:', e);
        }
      },
      onerror: (err) => {
        if (err instanceof FatalError) {
          setError('Could not connect to the tracking service. Please ensure you are authorized and try again.');
          throw err; // Stop retrying
        }
        setError('Connection to the flight tracking service was lost. Reconnecting...');
        return 5000; // Retry after 5 seconds
      },
    });

    return () => {
      ctrl.abort();
    };
  }, [bookingId, session]);

  const getStatusIcon = (status: string) => {
    const statusIconMap: { [key: string]: JSX.Element } = {
      'Confirmed': <CheckCircle2 className="h-5 w-5 text-green-500" />,
      'On Time': <Hourglass className="h-5 w-5 text-blue-500" />,
      'Boarding': <PlaneTakeoff className="h-5 w-5 text-indigo-500" />,
      'Departed': <PlaneTakeoff className="h-5 w-5 text-purple-500" />,
      'In Air': <RocketIcon className="h-5 w-5 animate-pulse text-sky-500" />,
      'Landed': <PlaneLanding className="h-5 w-5 text-teal-500" />,
      'Arrived': <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      'Delayed': <Info className="h-5 w-5 text-yellow-500" />,
      'Cancelled': <XCircle className="h-5 w-5 text-red-500" />,
    };
    return statusIconMap[status] || <Info className="h-5 w-5 text-gray-500" />;
  };

  const lastStatus = useMemo(() => statusUpdates[statusUpdates.length - 1], [statusUpdates]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg border-indigo-100">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg p-6">
            <div className="flex items-center space-x-4">
              <RocketIcon className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl font-bold">Live Flight Tracker</CardTitle>
                <CardDescription className="text-blue-200">Booking ID: {bookingId}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Connection Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {statusUpdates.length === 0 && !error && !isComplete && (
              <div className="text-center py-12">
                <Hourglass className="h-12 w-12 mx-auto text-gray-400 animate-spin" />
                <p className="mt-4 text-lg font-medium text-gray-700">Connecting to flight control...</p>
                <p className="text-sm text-gray-500">Please wait while we fetch the latest updates for your flight.</p>
              </div>
            )}

            {statusUpdates.length > 0 && (
              <div className="space-y-6">
                <div className="relative pl-8">
                  <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200"></div>
                  {statusUpdates.map((update, index) => (
                    <div key={index} className="relative mb-6">
                      <div className="absolute left-[-1.3rem] top-0.5 flex items-center justify-center bg-white h-8 w-8 rounded-full border-2 border-blue-500">
                        {getStatusIcon(update.status)}
                      </div>
                      <div className="ml-4">
                        <p className="font-bold text-lg text-gray-800">{update.status}</p>
                        <p className="text-sm text-gray-600">{update.location}</p>
                        <p className="text-sm text-gray-500 mt-1">{update.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isComplete && (
              <Alert className="bg-green-50 border-green-400 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Tracking Complete</AlertTitle>
                <AlertDescription>
                  {lastStatus?.details || 'Your flight has reached its destination.'}
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-8 text-center">
              <Button asChild variant="outline">
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FlightTrackingPage;
