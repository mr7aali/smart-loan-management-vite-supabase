import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function normalizeFunctionError(error: unknown) {
  const maybeContext = (error as { context?: unknown })?.context;

  if (maybeContext instanceof Response) {
    try {
      const payload = await maybeContext.clone().json();
      if (typeof payload?.error === 'string') {
        return new Error(payload.error);
      }
      if (typeof payload?.message === 'string') {
        return new Error(payload.message);
      }
    } catch {
      // Fall back to the SDK error message below.
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Failed to call Edge Function.');
}

async function invokeFunction<TBody extends Record<string, unknown>>(
  name: string,
  body: TBody,
) {
  const { data, error } = await supabase.functions.invoke(name, { body });

  return {
    data,
    error: error ? await normalizeFunctionError(error) : null,
  };
}

// Auth helpers
export const auth = {
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (!error && !data.session && data.user) {
      const identities = data.user.identities;
      const isObfuscatedExistingUser =
        Array.isArray(identities) && identities.length === 0;

      if (isObfuscatedExistingUser) {
        return {
          data,
          error: new Error(
            "An account with this email already exists. Please sign in instead.",
          ),
        };
      }

      const signInCheck = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInCheck.error) {
        const normalizedMessage = signInCheck.error.message.toLowerCase();
        const looksLikeExistingAccount =
          normalizedMessage.includes("invalid login credentials") ||
          normalizedMessage.includes("invalid_credentials") ||
          normalizedMessage.includes("email rate limit exceeded") ||
          normalizedMessage.includes("too many requests");
        const looksLikeNewUnconfirmedAccount =
          normalizedMessage.includes("email not confirmed") ||
          normalizedMessage.includes("email_not_confirmed");

        if (looksLikeExistingAccount && !looksLikeNewUnconfirmedAccount) {
          return {
            data,
            error: new Error(
              "An account with this email already exists. Please sign in instead.",
            ),
          };
        }
      } else if (signInCheck.data.session) {
        await supabase.auth.signOut();
      }
    }

    return { data, error };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helpers
export const db = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  async updateProfile(userId: string, profile: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  // Borrowers
  async getBorrowers(organizationId: string) {
    const { data, error } = await supabase
      .from('borrowers')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async addBorrower(userId: string, organizationId: string, borrower: any) {
    const { data, error } = await supabase
      .from('borrowers')
      .insert([{ ...borrower, user_id: userId, organization_id: organizationId }])
      .select()
      .single();
    return { data, error };
  },

  async updateBorrower(id: string, borrower: any) {
    const { data, error } = await supabase
      .from('borrowers')
      .update(borrower)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async deleteBorrower(id: string) {
    // Also delete associated loans
    await supabase.from('loans').delete().eq('borrower_id', id);
    const { error } = await supabase.from('borrowers').delete().eq('id', id);
    return { error };
  },

  // Loans
  async getLoans(organizationId: string) {
    const { data, error } = await supabase
      .from('loans')
      .select('*, borrowers(*)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async addLoan(userId: string, organizationId: string, loan: any) {
    const { data, error } = await supabase
      .from('loans')
      .insert([{ ...loan, user_id: userId, organization_id: organizationId }])
      .select()
      .single();
    return { data, error };
  },

  async updateLoan(id: string, loan: any) {
    const { data, error } = await supabase
      .from('loans')
      .update(loan)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async deleteLoan(id: string) {
    // Also delete associated repayments
    await supabase.from('repayments').delete().eq('loan_id', id);
    const { error } = await supabase.from('loans').delete().eq('id', id);
    return { error };
  },

  // Repayments
  async getRepayments(organizationId: string) {
    const { data, error } = await supabase
      .from('repayments')
      .select('*, loans(*)')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false });
    return { data, error };
  },

  async addRepayment(userId: string, organizationId: string, repayment: any) {
    const { data, error } = await supabase
      .from('repayments')
      .insert([{ ...repayment, user_id: userId, organization_id: organizationId }])
      .select()
      .single();
    return { data, error };
  },

  // Subscriptions
  async getSubscription(organizationId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();
    return { data, error };
  },

  async createSubscription(subscription: any) {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscription])
      .select()
      .single();
    return { data, error };
  },

  async updateSubscription(id: string, subscription: any) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(subscription)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },
};

export const teamApi = {
  async getMembers() {
    return invokeFunction('team-members', { action: 'list' });
  },

  async addMember(email: string) {
    return invokeFunction('team-members', { action: 'add', email });
  },

  async removeMember(memberId: string) {
    return invokeFunction('team-members', { action: 'remove', memberId });
  },
};

export const adminApi = {
  async getOverview() {
    const { data, error } = await supabase.functions.invoke(
      'admin-platform-overview',
      {
        body: {},
      },
    );
    return { data, error };
  },

  async getUsers() {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: {},
    });
    return { data, error };
  },

  async updateUser(payload: {
    userId: string;
    role?: 'user' | 'admin';
    accountStatus?: 'active' | 'suspended';
    plan?: 'free' | 'starter' | 'professional' | 'enterprise';
    subscriptionStatus?: 'active' | 'cancelled' | 'expired';
    endDate?: string | null;
  }) {
    const { data, error } = await supabase.functions.invoke(
      'admin-update-user',
      {
        body: payload,
      },
    );
    return { data, error };
  },
};

export default supabase;
