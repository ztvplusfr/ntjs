import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase service key not configured' }, { status: 500 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('series_releases')
      .select('*')
      .eq('release_date', today)
      .order('release_time', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [], {
      headers: {
        'Cache-Control': 'public, max-age=300'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch today releases' }, { status: 500 })
  }
}
