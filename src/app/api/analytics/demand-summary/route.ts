import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

let _supabaseAdminClient: any = null;
const getSupabaseAdmin = () => {
  if (_supabaseAdminClient) return _supabaseAdminClient;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.",
    );
  }
  _supabaseAdminClient = createAdminClient(supabaseUrl, supabaseKey);
  return _supabaseAdminClient;
};

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required query parameter: userId" },
        { status: 400 },
      );
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await getSupabaseAdmin().rpc("get_demand_summary", {
      trader_user_id: userId,
    });

    if (error) {
      console.error("[analytics/demand-summary] RPC error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[analytics/demand-summary] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
