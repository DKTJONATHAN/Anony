// Secure Supabase initialization with CORS protection
(function() {
  const SUPABASE_URL = 'https://ffmykoselvxqdtwgkdps.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmbXlrb3NlbHZ4cWR0d2drZHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzgxMDYsImV4cCI6MjA2NTUxNDEwNn0.egF_Yiw_8XdmxdFf-1sFtfPKqvzOsXd9_E1l4Z2cIGA';

  // Validate origin
  const allowedOrigins = [
    'https://your-netlify-site.netlify.app',
    'http://localhost:3000'
  ];

  function initSupabase() {
    if (!allowedOrigins.includes(window.location.origin)) {
      console.error('CORS violation: Invalid origin');
      document.getElementById('app').innerHTML = `
        <div class="p-4 text-red-500">
          Access denied: Invalid domain
        </div>
      `;
      return null;
    }

    return supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true
      },
      global: {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json'
        }
      }
    });
  }

  window.supabase = initSupabase();
})();