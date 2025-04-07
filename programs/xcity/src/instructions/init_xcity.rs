use {
    crate::state::*, anchor_lang::prelude::*, 
    anchor_spl::{
        associated_token::AssociatedToken,
         token_interface::{self, TokenInterface}
    }, 
    std::mem::size_of
};

pub fn handler(
    ctx: Context<InitXcity>,
    kyc_skip: bool
) -> Result<()> {
    let xcity = &mut ctx.accounts.xcity;
    xcity.bump = ctx.bumps.xcity;
    xcity.kyc_skip = kyc_skip;
    xcity.kyc_mint_authority = ctx.accounts.kyc_mint_authority.key();
    xcity.kyc_mint_authority_bump = ctx.bumps.kyc_mint_authority;
    xcity.reward_mint_token = ctx.accounts.reward_mint_token.key();
    xcity.reward_mint_authority = ctx.accounts.reward_mint_authority.key();
    xcity.reward_mint_authority_bump = ctx.bumps.reward_mint_authority;
    xcity.resume_mint_authority = ctx.accounts.resume_mint_authority.key();
    xcity.resume_mint_authority_bump = ctx.bumps.resume_mint_authority;
    xcity.reward_vault = ctx.accounts.reward_vault.key();
    xcity.reward_vault_authority = ctx.accounts.reward_vault_authority.key();
    xcity.reward_vault_authority_bump = ctx.bumps.reward_vault_authority;
    xcity.kyc_validator = ctx.accounts.kyc_validator.key();
    xcity.kyc_reward = 50;
    xcity.crate_role_reward = 20;
    xcity.verify_role_reward = 20;
    xcity.job_description_reward = 10;
    Ok(())
}

#[derive(Accounts)]
pub struct InitXcity<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + size_of::<Xcity>(),
        seeds = [XCITY_SEED.as_bytes()],
        bump
    )]
    pub xcity: Account<'info, Xcity>,

    /// CHECK: auth for the kyc mint authority
    #[account(
        seeds = [KYC_MINT_AUTHORITY_SEED.as_bytes()],
        bump 
    )]
    pub kyc_mint_authority: UncheckedAccount<'info>,

    #[account(
        mint::token_program = token_program,
        mint::authority = reward_mint_authority,
    )]
    pub reward_mint_token: InterfaceAccount<'info, token_interface::Mint>,

    /// CHECK: auth for the reward mint token
    #[account(
        seeds = [REWARD_MINT_AUTHORITY_SEED.as_bytes()],
        bump
    )]
    pub reward_mint_authority: UncheckedAccount<'info>,

    /// CHECK: auth for the resume mint authority
    #[account(
        seeds = [RESUME_MINT_AUTHORITY_SEED.as_bytes()],
        bump
    )]
    pub resume_mint_authority: UncheckedAccount<'info>,
    #[account(
        init,
        payer = payer,
        associated_token::token_program = token_program,
        associated_token::authority = reward_vault_authority,
        associated_token::mint = reward_mint_token
    )]
    pub reward_vault: InterfaceAccount<'info, token_interface::TokenAccount>,

    /// CHECK: auth for the reward vault
    #[account(
        seeds = [REWARD_VAULT_AUTHORITY_SEED.as_bytes()],
        bump
    )]
    pub reward_vault_authority: UncheckedAccount<'info>,

    /// CHECK: auth for the kyc validator
    pub kyc_validator: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

