use {
    anchor_lang::prelude::*,
    crate::{state::*, errors::*,},
    anchor_spl::token_interface::{self, TokenInterface, Mint, TokenAccount},
};


pub fn handler(ctx: Context<CreateJobDescription>, jd_hash: String, jd_url: String) -> Result<()> {
    let job_description = &mut ctx.accounts.job_description;
    let identity = &mut ctx.accounts.identity;
    identity.publish_num += 1;

    job_description.owner = payer.key();
    job_description.order_id = identity.publish_num;
    job_description.jd_hash = jd_hash;
    job_description.jd_url = jd_url;
    job_description.created_at = Clock::get()?.unix_timestamp;
    job_description.status = 1;
    Ok(())
}


#[derive(Accounts)]
#[instruction(jd_hash: String, jd_url: String)]
pub struct CreateJobDescription<'info> {
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
        seeds = [XCITY_SEED.as_bytes()],
        bump = xcity.bump
    )]
    pub xcity: Account<'info, Xcity>,
    #[account(
        init,
        payer = payer,
        space = JobDescription::calc_len(jd_hash.as_str(), jd_url.as_str()),
        seeds = [JOB_DESCRIPTION_SEED.as_bytes(), (identity.publish_num+1).to_string().as_bytes(), payer.key().as_ref()],
        bump
    )]
    pub job_description: Account<'info, JobDescription>,
    #[account(
        mut,
        mint::token_program = token_program,
        mint::authority = reward_mint_authority,
        constraint = reward_mint_token.key() == xcity.reward_mint_token @ XcityError::InvalidRewardMintToken,
    )]
    pub reward_mint_token: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = reward_mint_token,
        associated_token::authority = payer,
        associated_token::token_program = token_program,
        constraint = reward_token_account.key() == identity.reward_token_account @ XcityError::InvalidRewardTokenAccount,
    )]
    pub reward_token_account: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: reward mint authority
    #[account(
        seeds = [REWARD_MINT_AUTHORITY_SEED.as_bytes()],
        bump = xcity.reward_mint_authority_bump,
        constraint = reward_mint_authority.key() == xcity.reward_mint_authority @ XcityError::InvalidRewardMintAuthority,
    )]
    pub reward_mint_authority: UncheckedAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}
