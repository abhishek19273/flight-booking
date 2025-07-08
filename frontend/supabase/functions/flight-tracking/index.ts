import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FlightUpdate {
  id: string;
  flight_number: string;
  airline_name: string;
  status: string;
  departure_time: string;
  arrival_time: string;
  origin_airport: string;
  destination_airport: string;
  updated_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      'https://gkufoavzgikkorogzfze.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrdWZvYXZ6Z2lra29yb2d6ZnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDU2NzYsImV4cCI6MjA2NzQ4MTY3Nn0.I8P2PR7e1Da1k8LWYc-EoBq4o_PaBzkVpMuyGb0cOw4',
      {
        auth: {
          persistSession: false
        }
      }
    )

    // Set up SSE headers
    const headers = {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }

    // Create a readable stream for SSE
    const body = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        
        // Send initial connection message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', message: 'Flight tracking connected' })}\n\n`))

        // Function to send flight updates
        const sendFlightUpdates = async () => {
          try {
            const { data: flights, error } = await supabaseClient.rpc('get_flight_updates')
            
            if (error) {
              console.error('Error fetching flight updates:', error)
              return
            }

            if (flights && flights.length > 0) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'flight_updates', 
                data: flights,
                timestamp: new Date().toISOString()
              })}\n\n`))
            }
          } catch (error) {
            console.error('Error in sendFlightUpdates:', error)
          }
        }

        // Send updates every 10 seconds
        const interval = setInterval(sendFlightUpdates, 10000)
        
        // Send initial update
        sendFlightUpdates()

        // Handle client disconnect
        const cleanup = () => {
          clearInterval(interval)
          controller.close()
        }

        // Set up cleanup on abort
        req.signal?.addEventListener('abort', cleanup)
        
        // Set up timeout (5 minutes)
        setTimeout(cleanup, 300000)
      }
    })

    return new Response(body, { headers })

  } catch (error) {
    console.error('Error in flight tracking:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})