-- =================================================================================
-- Create Support Tickets Table
-- =================================================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('help', 'software', 'report')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    reference_type TEXT,
    reference_id TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Allow anyone (or just authenticated users) to insert a ticket
CREATE POLICY "Users can insert support tickets" ON public.support_tickets
FOR INSERT 
WITH CHECK (true); -- Allow anonymous as well, or restrict to auth.role() = 'authenticated' if required.

-- Allow admins to read all tickets
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.email = 'thegreat@admin.sir' OR profiles.email LIKE '%@staff.marketplc.com')
    )
);

-- Allow admins to update all tickets (for changing status)
CREATE POLICY "Admins can update all tickets" ON public.support_tickets
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.email = 'thegreat@admin.sir' OR profiles.email LIKE '%@staff.marketplc.com')
    )
);

-- Allow users to view their own tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
FOR SELECT
USING (auth.uid() = user_id);
