import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xsmvfgtgutefxbbwsuap.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZBD_xdCSgj7rhLB9DZwQLg_el8-YK9C';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
