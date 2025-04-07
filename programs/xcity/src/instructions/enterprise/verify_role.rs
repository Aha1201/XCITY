use {
    crate::{
        errors::*, state::*, utils::*
    }, 
    anchor_lang::prelude::*,
    solana_program::ed25519_program,
    anchor_spl::{
        token_interface::{Mint, TokenInterface, TokenAccount},
        token_2022_extensions::token_metadata,
        associated_token::AssociatedToken,
        token::Token,
        token_2022::Token2022,
    },
    ed25519_program::ID
};



pub fn handler(ctx: Context<VerifyRole>, status: u8) -> Result<()> {

    let role_key = ctx.accounts.role.key().to_string();
    msg!("role_key: {}", role_key);

    if status == 1 {
        //update the resume mint token's metadata
        // ctx.accounts.update_resume_metadata()?;
        //mint the reward token to the talent
        ctx.accounts.mint_reward_token(ctx.accounts.reward_token_account.to_account_info(), ctx.accounts.xcity.crate_role_reward.into())?;
        //mint the reward token to the verifier
        ctx.accounts.mint_reward_token(ctx.accounts.verifier_reward_token_account.to_account_info(), ctx.accounts.xcity.verify_role_reward.into())?;
    }
    //update the role
    let role = &mut ctx.accounts.role;
    role.verified_status = status;
    role.verified_at = Clock::get()?.unix_timestamp;
    Ok(())
}

#[derive(Accounts)]
pub struct VerifyRole<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        seeds = [IDENTITY_SEED.as_bytes(), role.owner.as_ref()],
        bump = identity.bump,
    )]
    pub identity: Account<'info, Identity>,
    #[account(
        seeds = [XCITY_SEED.as_bytes()],
        bump = xcity.bump
    )]
    pub xcity: Account<'info, Xcity>,
    #[account(
        mut,
        seeds = [ROLE_SEED.as_bytes(), role.order_id.to_string().as_bytes(), talent.key().as_ref()],
        bump = role.bump,
        constraint = role.verifier == payer.key() @ XcityError::InvalidRole,
        constraint = role.verified_status == 0 @ XcityError::InvalidRoleStatus
    )]
    pub role: Account<'info, Role>,
    /// CHECK: talent
    #[account(
        mut,
        constraint = talent.key() == role.owner @ XcityError::InvalidTalent,
    )]
    pub talent: UncheckedAccount<'info>,
    #[account(
        mut,
        mint::token_program = token_2022_program,
        mint::authority = resume_mint_authority,
        constraint = resume_mint_token.key() == identity.resume_mint_token @ XcityError::InvalidResumeMintToken,
    )]
    pub resume_mint_token: InterfaceAccount<'info, Mint>,
    /// CHECK: resume mint authority
    #[account(
        seeds = [RESUME_MINT_AUTHORITY_SEED.as_bytes()],
        bump = xcity.resume_mint_authority_bump,
        constraint = resume_mint_authority.key() == xcity.resume_mint_authority @ XcityError::InvalidResumeMintAuthority,
    )]
    pub resume_mint_authority: UncheckedAccount<'info>,
    #[account(
        mut,
        mint::token_program = token_2022_program,
        mint::authority = reward_mint_authority,
        constraint = reward_mint_token.key() == xcity.reward_mint_token @ XcityError::InvalidRewardMintToken,
    )]
    pub reward_mint_token: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = reward_mint_token,
        associated_token::authority = talent,
        associated_token::token_program = token_2022_program,
        constraint = reward_token_account.key() == identity.reward_token_account @ XcityError::InvalidRewardTokenAccount,
    )]
    pub reward_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = reward_mint_token,
        associated_token::authority = payer,
        associated_token::token_program = token_2022_program,
    )]
    pub verifier_reward_token_account: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: reward mint authority
    #[account(
        seeds = [REWARD_MINT_AUTHORITY_SEED.as_bytes()],
        bump = xcity.reward_mint_authority_bump,
        constraint = reward_mint_authority.key() == xcity.reward_mint_authority @ XcityError::InvalidRewardMintAuthority,
    )]
    pub reward_mint_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}


impl<'info> VerifyRole<'info> {
    pub fn update_resume_metadata(&self) -> Result<()> {
        let signer_seeds: &[&[&[u8]]] = &[&[RESUME_MINT_AUTHORITY_SEED.as_bytes(), 
        &[self.xcity.resume_mint_authority_bump]]];
        token_metadata::token_metadata_update_field(
            CpiContext::new_with_signer(
                self.token_2022_program.to_account_info(),
                token_metadata::TokenMetadataUpdateField {
                    token_program_id: self.token_2022_program.to_account_info(),
                    metadata: self.resume_mint_token.to_account_info(),
                    update_authority: self.resume_mint_authority.to_account_info(),
                },
                signer_seeds,
            ),
            spl_token_metadata_interface::state::Field::Key(self.payer.key().to_string()),
            self.role.key().to_string(),
        )?;
        Ok(())
    }

    pub fn mint_reward_token(&self, recipient: AccountInfo<'info>, amount: u32) -> Result<()> {
        if amount == 0 {
            Ok(())
        }else{
            let signer_seeds: &[&[&[u8]]] = &[&[REWARD_MINT_AUTHORITY_SEED.as_bytes(), &[self.xcity.reward_mint_authority_bump]]];
            mint_token(
                signer_seeds, 
                self.token_2022_program.to_account_info(), 
                self.reward_mint_token.to_account_info(), 
                recipient,
                self.reward_mint_authority.to_account_info(), 
                (amount * 10_u32.pow(self.reward_mint_token.decimals as u32)).into(),
            )
        }
    }

}
