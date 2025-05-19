import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntqkbeykywgljdmexyxi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50cWtiZXlreXdnbGpkbWV4eXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDM3MTIsImV4cCI6MjA2MTE3OTcxMn0.hVNpQN_CfzWvJnk6ubNgT92_sdtbvq9QDkxY2newA-8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
