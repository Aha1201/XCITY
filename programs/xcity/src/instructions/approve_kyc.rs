
use {
    anchor_lang::prelude::*, 
    anchor_spl::{
        associated_token::AssociatedToken,
        token,
        token_interface::{self, TokenInterface},
    },
    crate::errors::XcityError,
    crate::state::*,
};

pub fn handler(ctx: Context<ApproveKyc>, hash_id: String) -> Result<()> {
    let approve_kyc =  ctx.accounts;
    //MINT THE kyc_mint_token TO THE kyc_token_account
    approve_kyc.mint_kyc_token()?;
    //UPDATE THE identity ACCOUNT
    approve_kyc.identity.hash_id = hash_id;
    //mint reward token to the owner
    approve_kyc.mint_reward_token()?;
    Ok(())
}

#[derive(Accounts)]
pub struct ApproveKyc<'info> {
    #[account(
        mut,
        constraint = payer.key() == xcity.kyc_validator @ XcityError::InvalidKycValidator
    )]
    pub payer: Signer<'info>,
    #[account(
        seeds = [XCITY_SEED.as_bytes()],
        bump = xcity.bump
    )]
    pub xcity: Account<'info, Xcity>,
    #[account(
        mut,
        seeds = [IDENTITY_SEED.as_bytes(), identity_owner.key().as_ref()],
        bump = identity.bump,
    )]
    pub identity: Account<'info, Identity>,
    #[account(
        mut,
        mint::token_program = token_program,
        mint::authority = kyc_mint_authority,
        constraint = kyc_mint_token.key() == identity.kyc_mint_token @ XcityError::InvalidKycMintToken
    )]
    pub kyc_mint_token: InterfaceAccount<'info, token_interface::Mint>,
    #[account(
        mut,
        associated_token::token_program = token_program,
        associated_token::authority = identity_owner,
        associated_token::mint = kyc_mint_token,
    )]
    pub kyc_token_account: InterfaceAccount<'info, token_interface::TokenAccount>,
    #[account(
        mut,
        seeds = [KYC_MINT_AUTHORITY_SEED.as_bytes()],
        bump = xcity.kyc_mint_authority_bump,
        constraint = kyc_mint_authority.key() == xcity.kyc_mint_authority @ XcityError::InvalidKycMintAuthority
    )]
    pub kyc_mint_authority: InterfaceAccount<'info, token_interface::Mint>,
    #[account(
        mut,
        mint::token_program = token_program,
        mint::authority = reward_mint_authority,
        constraint = reward_mint_token.key() == xcity.reward_mint_token.key() @ XcityError::InvalidRewardMintToken
    )]
    pub reward_mint_token: InterfaceAccount<'info, token_interface::Mint>,
    #[account(
        seeds = [REWARD_MINT_AUTHORITY_SEED.as_bytes()],
        bump = xcity.reward_mint_authority_bump,
        constraint = reward_mint_authority.key() == xcity.reward_mint_authority @ XcityError::InvalidRewardMintAuthority
    )]
    pub reward_mint_authority: InterfaceAccount<'info, token_interface::Mint>,
    #[account(
        associated_token::token_program = token_program,
        associated_token::mint = reward_mint_token,
        associated_token::authority = identity_owner,
    )]
    pub reward_token_account: InterfaceAccount<'info, token_interface::TokenAccount>,
    /// CHECK: identity owner
    pub identity_owner: UncheckedAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> ApproveKyc<'info> {
    pub fn mint_kyc_token(&self) -> Result<()> {
        let signer_seeds: &[&[&[u8]]] = &[&[KYC_MINT_AUTHORITY_SEED.as_bytes(), &[self.xcity.kyc_mint_authority_bump]]];
        token::mint_to(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                token::MintTo {
                    mint: self.kyc_mint_token.to_account_info(),
                    to: self.kyc_token_account.to_account_info(),
                    authority: self.kyc_mint_authority.to_account_info(),
                },
                signer_seeds
            ),
            1
        ).unwrap();
        Ok(())
    }

    pub fn mint_reward_token(&self) -> Result<()> {
        if self.xcity.kyc_reward == 0 {
            Ok(())
        }else{
            let signer_seeds: &[&[&[u8]]] = &[&[REWARD_MINT_AUTHORITY_SEED.as_bytes(), &[self.xcity.reward_mint_authority_bump]]];
            token::mint_to(
                CpiContext::new_with_signer(
                    self.token_program.to_account_info(),
                    token::MintTo {
                        mint: self.reward_mint_token.to_account_info(),
                        to: self.reward_token_account.to_account_info(),
                        authority: self.reward_mint_authority.to_account_info(),
                    },
                    signer_seeds
                ),
                self.xcity.kyc_reward.into()
            ).unwrap();
            Ok(())
        }
    }
}