import axios from 'axios';
import { supabase } from './supabaseClient';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create axios instance with default config for Supabase REST API
const supabaseAxios = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    'apikey': supabaseAnonKey,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
});

// Request interceptor to add auth token
supabaseAxios.interceptors.request.use(
  async (config) => {
    // Get the current session token
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    } else {
      // Fallback to anon key if no session
      config.headers.Authorization = `Bearer ${supabaseAnonKey}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Error handler
supabaseAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Supabase API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Helper function to build query parameters
export const buildQuery = (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.select) {
    queryParams.append('select', params.select);
  }
  
  if (params.eq) {
    Object.entries(params.eq).forEach(([key, value]) => {
      queryParams.append(key, `eq.${value}`);
    });
  }
  
  if (params.order) {
    const orderBy = params.order.column || params.order;
    const ascending = params.order.ascending !== false;
    queryParams.append('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
  }
  
  return queryParams.toString();
};

// Supabase-like API wrapper using axios
export const supabaseApi = {
  from: (table) => ({
    select: (columns = '*') => {
      const selectColumns = Array.isArray(columns) ? columns.join(',') : columns;
      
      return {
        eq: (column, value) => ({
          single: async () => {
            try {
              const query = buildQuery({ select: selectColumns, eq: { [column]: value } });
              const response = await supabaseAxios.get(`/${table}?${query}`);
              return { 
                data: Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : response.data, 
                error: null 
              };
            } catch (error) {
              return { data: null, error: error.response?.data || error };
            }
          },
          order: async (orderColumn, options = { ascending: true }) => {
            try {
              const query = buildQuery({ 
                select: selectColumns, 
                eq: { [column]: value },
                order: { column: orderColumn, ascending: options.ascending }
              });
              const response = await supabaseAxios.get(`/${table}?${query}`);
              return { data: response.data, error: null };
            } catch (error) {
              return { data: null, error: error.response?.data || error };
            }
          }
        }),
        order: async (orderColumn, options = { ascending: true }) => {
          try {
            const query = buildQuery({ 
              select: selectColumns,
              order: { column: orderColumn, ascending: options.ascending }
            });
            const response = await supabaseAxios.get(`/${table}?${query}`);
            return { data: response.data, error: null };
          } catch (error) {
            return { data: null, error: error.response?.data || error };
          }
        }
      };
    },
    insert: (data) => ({
        select: (columns = '*') => ({
          single: async () => {
            try {
              const insertData = Array.isArray(data) ? data : [data];
              const response = await supabaseAxios.post(`/${table}`, insertData, {
                headers: {
                  'Prefer': 'return=representation'
                }
              });
              return { 
                data: Array.isArray(response.data) ? response.data[0] : response.data, 
                error: null 
              };
            } catch (error) {
              return { data: null, error: error.response?.data || error };
            }
          }
        })
    }),
    update: (data) => ({
      eq: (column, value) => ({
        select: (columns = '*') => ({
          single: async () => {
            try {
              const query = buildQuery({ eq: { [column]: value } });
              const response = await supabaseAxios.patch(`/${table}?${query}`, data, {
                headers: {
                  'Prefer': 'return=representation'
                }
              });
              return { 
                data: Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : response.data, 
                error: null 
              };
            } catch (error) {
              return { data: null, error: error.response?.data || error };
            }
          }
        })
      })
    }),
    delete: () => ({
      eq: async (column, value) => {
        try {
          const query = buildQuery({ eq: { [column]: value } });
          await supabaseAxios.delete(`/${table}?${query}`);
          return { data: null, error: null };
        } catch (error) {
          return { data: null, error: error.response?.data || error };
        }
      }
    }),
    upsert: (data, options = {}) => ({
      select: (columns = '*') => ({
        single: async () => {
          try {
            const insertData = Array.isArray(data) ? data : [data];
            const headers = {
              'Prefer': 'return=representation,resolution=merge-duplicates'
            };
            const response = await supabaseAxios.post(`/${table}`, insertData, { headers });
            return { 
              data: Array.isArray(response.data) ? response.data[0] : response.data, 
              error: null 
            };
          } catch (error) {
            return { data: null, error: error.response?.data || error };
          }
        }
      })
    })
  })
};

export default supabaseApi;
