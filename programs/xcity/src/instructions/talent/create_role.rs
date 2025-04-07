use {
    crate::{
        errors::*, state::*
    }, anchor_lang::prelude::*,
};

pub fn handler(ctx: Context<CreateRole>, encryption_id: String, info: String) -> Result<()> {
    let role = &mut ctx.accounts.role;
    let identity = &mut ctx.accounts.identity;
    identity.publish_num += 1;

    role.bump = ctx.bumps.role;
    role.order_id = identity.publish_num;
    role.verifier = ctx.accounts.verifier.key();
    role.owner = ctx.accounts.payer.key();
    role.verified_status = 0;
    role.created_at = Clock::get()?.unix_timestamp;
    role.encryption_id = encryption_id;
    role.info = info;
    Ok(())
}

#[derive(Accounts)]
#[instruction(encryption_id: String, info: String)]
pub struct CreateRole<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        seeds = [IDENTITY_SEED.as_bytes(), payer.key().as_ref()],
        bump = identity.bump,
        constraint = identity.owner == payer.key() @ XcityError::InvalidIdentity
    )]
    pub identity: Account<'info, Identity>,
    #[account(
        init,
        payer = payer,
        space = Role::calc_len(encryption_id.as_str(), info.as_str()),
        seeds = [ROLE_SEED.as_bytes(), (identity.publish_num+1).to_string().as_bytes(), payer.key().as_ref()],
        bump
    )]
    pub role: Account<'info, Role>,
    /// CHECK: validator
    pub verifier: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

