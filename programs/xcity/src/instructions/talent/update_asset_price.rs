use anchor_lang::prelude::*;
use crate::{state::Identity, errors::XcityError, IDENTITY_SEED};

fn handler(ctx: Context<UpdateAssetPrice>, new_price: u64) -> Result<()> {
    let identity = &mut ctx.accounts.identity;
    identity.assets_price = new_price;
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateAssetPrice<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        seeds = [IDENTITY_SEED.as_bytes(), payer.key().as_ref()],
        bump = identity.bump,
        constraint = identity.owner == payer.key() @ XcityError::InvalidIdentity
    )]
    pub identity: Account<'info, Identity>
}

