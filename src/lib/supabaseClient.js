import { createClient } from '@supabase/supabase-js';

// These values should be stored in environment variables
// Create a .env file in the root directory with:
// VITE_SUPABASE_URL=your_supabase_url
// VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
};

// Helper function to get teacher profile using axios directly
export const getTeacherProfile = async (authUserId) => {
  console.log('[getTeacherProfile] Starting, authUserId:', authUserId);
  
  try {
    // Import axios directly
    const axios = (await import('axios')).default;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Get session token directly from storage to avoid hanging getSession() call
    console.log('[getTeacherProfile] Getting access token...');
    let accessToken = null;
    let sessionUserId = authUserId;
    
    // Try to get token from localStorage (Supabase stores it there)
    try {
      // Supabase stores session in localStorage with key pattern: sb-{project-ref}-auth-token
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'jytgfxwvxbinkwyuwerh';
      const storageKey = `sb-${projectRef}-auth-token`;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed?.access_token) {
          accessToken = parsed.access_token;
          sessionUserId = parsed.user?.id || authUserId;
          console.log('[getTeacherProfile] Got token from localStorage, user id:', sessionUserId);
        }
      }
    } catch (err) {
      console.warn('[getTeacherProfile] Could not get token from localStorage:', err);
    }
    
    // Fallback: try getSession with timeout
    if (!accessToken) {
      console.log('[getTeacherProfile] Token not in storage, trying getSession()...');
      try {
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 1000)
        );
        const sessionResult = await Promise.race([sessionPromise, sessionTimeout]);
        const session = sessionResult.data?.session;
        if (session?.access_token) {
          accessToken = session.access_token;
          sessionUserId = session.user?.id || authUserId;
          console.log('[getTeacherProfile] Got token from getSession(), user id:', sessionUserId);
        }
      } catch (err) {
        console.warn('[getTeacherProfile] getSession() failed or timed out:', err.message);
      }
    }
    
    if (!accessToken) {
      console.error('[getTeacherProfile] No access token available');
      return null;
    }
    
    // Verify the IDs match
    if (authUserId !== sessionUserId) {
      console.warn('[getTeacherProfile] authUserId mismatch! authUserId:', authUserId, 'session.user.id:', sessionUserId);
      authUserId = sessionUserId;
    }
    
    console.log('[getTeacherProfile] Access token found, length:', accessToken.length);
    console.log('[getTeacherProfile] Getting teacher profile for auth_user_id:', authUserId);
    
    // Use axios directly to query teachers table with RLS
    console.log('[getTeacherProfile] Making direct axios API call to teachers table...');
    const apiUrl = `${supabaseUrl}/rest/v1/teachers`;
    const headers = {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
    
    console.log('[getTeacherProfile] Request headers prepared (token length:', accessToken.length, ')');
    
    try {
      // Add timeout wrapper
      const queryPromise = axios.get(apiUrl, {
        headers,
        params: {
          select: '*',
          auth_user_id: `eq.${authUserId}`
        }
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Teacher profile query timeout')), 3000)
      );
      
      const response = await Promise.race([queryPromise, timeoutPromise]);
      console.log('[getTeacherProfile] Axios response:', response);
      console.log('[getTeacherProfile] Response data:', response.data);
      
      // Handle response
      let result;
      if (Array.isArray(response.data)) {
        if (response.data.length === 0) {
          result = { data: null, error: { code: 'PGRST116', message: 'No rows returned' } };
        } else {
          result = { data: response.data[0], error: null };
        }
      } else {
        result = { data: response.data, error: null };
      }
      
      console.log('[getTeacherProfile] Processed result:', result);
      
      const { data, error } = result;
      
      if (error) {
        // Handle different error formats (axios vs supabase)
        const errorCode = error.code || error.response?.data?.code || error.response?.data?.error_code;
        const errorMessage = error.message || error.response?.data?.message || JSON.stringify(error);
        
        console.error('Teacher profile query error:', {
          error: error,
          code: errorCode,
          message: errorMessage,
          status: error.response?.status,
          fullError: error.response?.data || error
        });
        
        // If teacher doesn't exist, try to create it
        if (errorCode === 'PGRST116' || errorMessage?.includes('No rows') || errorMessage?.includes('0 rows')) {
          console.log('[getTeacherProfile] Teacher profile not found in database, attempting to create...');
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            try {
              const createResponse = await axios.post(apiUrl, {
                auth_user_id: authUserId,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Teacher',
                email: user.email,
              }, {
                headers,
                params: {
                  select: '*'
                }
              });
              
              if (createResponse.data && createResponse.data.length > 0) {
                console.log('[getTeacherProfile] Successfully created teacher profile:', createResponse.data[0]);
                return createResponse.data[0];
              }
            } catch (createError) {
              console.error('[getTeacherProfile] Error creating teacher profile:', createError.response?.data || createError.message);
            }
          }
        }
        
        // For RLS errors
        if (errorCode === '42501' || error.response?.status === 403) {
          console.error('[getTeacherProfile] RLS Policy violation - user may not have permission to view teacher profile');
          console.error('[getTeacherProfile] Current user ID:', authUserId);
          // Try querying without filter to let RLS handle it
          console.log('[getTeacherProfile] Trying query without explicit filter (RLS should handle it)...');
          try {
            const rlsResponse = await axios.get(apiUrl, {
              headers,
              params: {
                select: '*',
                order: 'created_at.desc'
              }
            });
            
            if (rlsResponse.data && Array.isArray(rlsResponse.data) && rlsResponse.data.length > 0) {
              console.log('[getTeacherProfile] Found teacher via RLS:', rlsResponse.data[0]);
              return rlsResponse.data[0];
            }
          } catch (rlsError) {
            console.error('[getTeacherProfile] RLS fallback query also failed:', rlsError.response?.data || rlsError.message);
          }
        }
        
        return null;
      }
      
      if (data) {
        console.log('[getTeacherProfile] Successfully retrieved teacher profile:', data);
        return data;
      }
      
      // If no data but no error, try querying without filter (let RLS handle it)
      console.log('[getTeacherProfile] No data with filter, trying without filter (RLS should return user\'s profile)...');
      try {
        const rlsResponse = await axios.get(apiUrl, {
          headers,
          params: {
            select: '*',
            order: 'created_at.desc'
          }
        });
        
        if (rlsResponse.data && Array.isArray(rlsResponse.data) && rlsResponse.data.length > 0) {
          console.log('[getTeacherProfile] Found teacher via RLS (no filter):', rlsResponse.data[0]);
          return rlsResponse.data[0];
        }
      } catch (rlsError) {
        console.error('[getTeacherProfile] RLS fallback query failed:', rlsError.response?.data || rlsError.message);
      }
      
      console.warn('[getTeacherProfile] No data returned from query');
      return null;
    } catch (err) {
      if (err.message === 'Teacher profile query timeout') {
        console.error('[getTeacherProfile] Query timed out after 3 seconds');
        console.error('[getTeacherProfile] This means the axios request took longer than 3 seconds');
      } else {
        console.error('[getTeacherProfile] Error in teacher profile query:', err);
        console.error('[getTeacherProfile] Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          statusText: err.response?.statusText,
          headers: err.response?.headers,
          config: {
            url: err.config?.url,
            method: err.config?.method,
            headers: err.config?.headers
          },
          stack: err.stack
        });
        
        // If it's an axios error, log the full response
        if (err.response) {
          console.error('[getTeacherProfile] Full axios error response:', err.response);
        }
      }
      return null;
    }
  } catch (err) {
    console.error('[getTeacherProfile] Outer error:', err);
    console.error('[getTeacherProfile] Error stack:', err.stack);
    return null;
  }
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
  }
};
