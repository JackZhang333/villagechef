const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gjemcqjjrxwvkgyqlwck.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZW1jcWpqcnh3dmtneXFsd2NrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE0MDIzNCwiZXhwIjoyMDg1NzE2MjM0fQ.9diTKmITa9gwxzi0uO3mMp_4TW8OgNROH2puksOpZRs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDishes() {
    const { data, error } = await supabase
        .from('dishes')
        .select('name, image_url')
        .limit(20);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Dishes Data:', JSON.stringify(data, null, 2));
    }
}

checkDishes();
