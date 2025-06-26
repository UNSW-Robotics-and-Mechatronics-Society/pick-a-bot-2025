import { createClient } from '@supabase/supabase-js';
import { type NextRequest } from "next/server";
import { jwtVerify } from 'jose';


const supabase = createClient(process.env.DB_URL as string, process.env.DB_SECRET_KEY as string)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authorisation not found');
    }
    
    const jwt = authHeader.split(' ')[1];
    const secret = new TextEncoder().encode('secret');
    const { payload } = await jwtVerify(jwt, secret, {
      algorithms: ['HS256'] 
    });
    const userName = payload.name;
    const dbResp = await supabase
      .from('user')
      .select(' name, tokens ')
      .eq('name', userName)
      .single()
    if (!dbResp.data) {
      throw new Error('No data found');
    } 
    console.log(dbResp.data.name, dbResp.data.tokens);
    return Response.json({
      name: dbResp.data.name,
      points: dbResp.data.tokens
    });
  } catch (err) {
    console.error('Error fetching user:', err);
  }
}