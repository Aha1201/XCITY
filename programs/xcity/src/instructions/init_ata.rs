use {
    crate::{
        errors::*, 
        state::*,
    }, 
    anchor_lang::prelude::*, 
    anchor_spl::{
        associated_token,
        associated_token::AssociatedToken,
         token_interface::{self, TokenInterface}
    }, 
};
pub fn handler(ctx: Context<InitAta>) -> Result<()> {

        //create kyc ata token
    msg!("creating kyc ata token...");
    ctx.accounts.create_ata_token(
        ctx.accounts.kyc_token_account.to_account_info(), 
        ctx.accounts.kyc_mint_token.to_account_info()
    )?;
    //create resume ata token
    msg!("creating resume ata token...");
    ctx.accounts.create_ata_token(
        ctx.accounts.resume_token_account.to_account_info(), 
        ctx.accounts.resume_mint_token.to_account_info()
    )?;

    //create reward ata token
    msg!("creating reward ata token...");
    ctx.accounts.create_ata_token(
        ctx.accounts.reward_token_account.to_account_info(), 
        ctx.accounts.reward_mint_token.to_account_info()
    )?;

        //update identity
    let identity = &mut ctx.accounts.identity;
    identity.reward_token_account = ctx.accounts.reward_token_account.key();
    identity.kyc_token_account = ctx.accounts.kyc_token_account.key();
    identity.resume_token_account = ctx.accounts.resume_token_account.key();
    Ok(())
}

#[derive(Accounts)]
pub struct InitAta<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        seeds = [IDENTITY_SEED.as_bytes(), payer.key().as_ref()],
        bump = identity.bump
    )]
    pub identity: Account<'info, Identity>,
    #[account(
        seeds = [XCITY_SEED.as_bytes()],
        bump = xcity.bump
    )]
    pub xcity: Account<'info, Xcity>,

    /// CHECK: reward token account
    #[account(
        mut,
    )]
    pub reward_token_account: UncheckedAccount<'info>,
    #[account(
        mint::token_program = token_program,
        mint::authority = reward_mint_authority,
        constraint = reward_mint_token.key() == xcity.reward_mint_token @ XcityError::InvalidRewardMintToken,
    )]
    pub reward_mint_token: InterfaceAccount<'info, token_interface::Mint>,

    /// CHECK: reward mint authority
    #[account(
        seeds = [REWARD_MINT_AUTHORITY_SEED.as_bytes()],
        bump = xcity.reward_mint_authority_bump,
        constraint = reward_mint_authority.key() == xcity.reward_mint_authority @ XcityError::InvalidRewardMintAuthority
    )]
    pub reward_mint_authority: UncheckedAccount<'info>,
    /// CHECK: kyc token account
    #[account(
        mut,
    )]
    pub kyc_token_account: UncheckedAccount<'info>,

    #[account(
        mint::token_program = token_program,
        mint::authority = kyc_mint_authority,
        constraint = kyc_mint_token.key() == identity.kyc_mint_token @ XcityError::InvalidKycMintToken,
    )]
    pub kyc_mint_token: InterfaceAccount<'info, token_interface::Mint>,

    /// CHECK: kyc mint authority
    #[account(
        seeds = [KYC_MINT_AUTHORITY_SEED.as_bytes()],
        bump = xcity.kyc_mint_authority_bump,
        constraint = kyc_mint_authority.key() == xcity.kyc_mint_authority @ XcityError::InvalidKycMintAuthority
    )]
    pub kyc_mint_authority: UncheckedAccount<'info>,

    /// CHECK: resume token account
    #[account(
        mut,
    )]
    pub resume_token_account: UncheckedAccount<'info>,

    #[account(
        mint::token_program = token_program,
        mint::authority = resume_mint_authority,
        constraint = resume_mint_token.key() == identity.resume_mint_token @ XcityError::InvalidResumeMintToken,
    )]
    pub resume_mint_token: InterfaceAccount<'info, token_interface::Mint>,

    /// CHECK: resume mint authority
    #[account(
        seeds = [RESUME_MINT_AUTHORITY_SEED.as_bytes()],
        bump = xcity.resume_mint_authority_bump,
        constraint = resume_mint_authority.key() == xcity.resume_mint_authority @ XcityError::InvalidResumeMintAuthority
    )]
    pub resume_mint_authority: UncheckedAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitAta<'info> {
    fn create_ata_token(&self, ata_token: AccountInfo<'info>, mint: AccountInfo<'info>) -> Result<()> {

        let cal_ata_token : Pubkey = associated_token::get_associated_token_address_with_program_id  (
            self.payer.key, 
            mint.key, 
            self.token_program.key
        ).into();

        msg!("cata_token...{}", ata_token.key().to_string());
        msg!("cal_ata_token...{}", cal_ata_token.to_string());
        if cal_ata_token.to_string() != ata_token.key().to_string() {
            return Err(XcityError::InvalidAtaToken.into());
        }
        //create ata token

        associated_token::create(CpiContext::new_with_signer(
            self.associated_token_program.to_account_info(),
            associated_token::Create {
                payer: self.payer.to_account_info(),
                associated_token: ata_token,
                authority: self.payer.to_account_info(),
                mint: mint,
                system_program: self.system_program.to_account_info(),
                token_program: self.token_program.to_account_info(),
            },
            &[],
        ))?;

        Ok(())
    }
}