import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

/**
 * This component handles the OAuth callback from Supabase
 * It's used as a redirect target after social login
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the hash from the URL
      const hashParams = window.location.hash;
      
      // Process the hash with Supabase
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error during auth callback:', error);
        navigate('/login?error=auth-callback-failed');
        return;
      }
      
      // If we have a session, redirect to the dashboard
      if (data?.session) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Processing login...</h2>
        <p>Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
}
