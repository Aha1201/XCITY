use {
    crate::{
        errors::*, state::*, utils::*
    }, 
    anchor_lang::{accounts::program, prelude::*}, 
    spl_token_2022::extension::ExtensionType,
    anchor_spl::{
        token::Token, 
        token_2022::Token2022,
        associated_token::AssociatedToken,
         token_2022_extensions::{self, *},
         token_interface::{self, TokenInterface}
    }, 
};

pub fn handler(
    ctx: Context<InitKyc>, 
    hash_id: String, 
    encryption_id: String, 
    data_hash: String, 
    name: String, 
    url: String
) -> Result<()> {
    //CHECK THE kyc_mint_token WHERE Non-Transferable Token OR NOT
    if !is_non_transferable(&ctx.accounts.kyc_mint_token.to_account_info()) {
        return Err(XcityError::InvalidKycMintToken.into());
    }

    // //CHECK THE kyc_token_account WHERE Immutable Owner OR NOT
    // if is_immutable_owner(&ctx.accounts.kyc_token_account.to_account_info()) {
    //     return Err(XcityError::InvalidKycTokenAccount.into());
    // }

    //MINT THE resume_mint_token TO THE resume_token_account
    msg!("mint resume token...");
    ctx.accounts.mint_resume_token()?;

    //INIT THE identity ACCOUNT
    let init_kyc = ctx.accounts;
    let identity= &mut init_kyc.identity;
    identity.encryption_id = encryption_id;
    identity.data_hash = data_hash;
    identity.name = name;
    identity.url = url;

    //approve the kyc if the kyc_skip is true
    if init_kyc.xcity.kyc_skip {
        //MINT THE kyc_mint_token TO THE kyc_token_account
        msg!("mint kyc token...");
        init_kyc.mint_kyc_token()?;
        //UPDATE THE identity ACCOUNT
        init_kyc.identity.hash_id = hash_id.clone();
        //mint reward token to the owner
        msg!("mint reward token...");
        init_kyc.mint_reward_token()?;

        init_kyc.update_kyc_symbol(hash_id)?;

        init_kyc.identity.is_verified = true;    
    }
    Ok(())
}

#[derive(Accounts)]
#[instruction(hash_id: String, encryption_id: String, data_hash: String, name: String, url: String)]
pub struct InitKyc<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        realloc = Identity::calc_len(name.as_str(), url.as_str(), hash_id.as_str(), encryption_id.as_str(), data_hash.as_str()), 
        realloc::payer = payer,
        realloc::zero = false ,
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
        mut,
        mint::decimals = 0,
        mint::token_program = token_2022_program,
        mint::authority = kyc_mint_authority,
        constraint = kyc_mint_token.key() == identity.kyc_mint_token @ XcityError::InvalidKycMintToken,
        constraint = kyc_mint_token.supply == 0 @ XcityError::InvalidKycMintToken,
    )]
    pub kyc_mint_token: InterfaceAccount<'info, token_interface::Mint>,
    #[account(
        mut,
        mint::token_program = token_2022_program,
        constraint = kyc_token_account.key() == identity.kyc_token_account @ XcityError::InvalidKycTokenAccount,
        constraint = kyc_token_account.amount == 0 @ XcityError::InvalidKycTokenAccount,
    )]
    pub kyc_token_account: InterfaceAccount<'info, token_interface::TokenAccount>,
    #[account(
        mut,
        mint::decimals = 0,
        mint::token_program = token_2022_program,
        constraint = resume_mint_token.key() == identity.resume_mint_token @ XcityError::InvalidResumeMintToken,
        constraint = resume_mint_token.supply == 0 @ XcityError::InvalidResumeMintToken,
    )]
    pub resume_mint_token: InterfaceAccount<'info, token_interface::Mint>, 
    #[account(
        mut,
        mint::token_program = token_2022_program,
        constraint = resume_token_account.key() == identity.resume_token_account @ XcityError::InvalidResumeTokenAccount,
        constraint = resume_token_account.amount == 0 @ XcityError::InvalidResumeTokenAccount,
    )]
    pub resume_token_account: InterfaceAccount<'info, token_interface::TokenAccount>,

    #[account(
        mut,
        mint::token_program = token_2022_program,
        constraint = reward_mint_token.key() == xcity.reward_mint_token @ XcityError::InvalidRewardMintToken,
    )]
    pub reward_mint_token: InterfaceAccount<'info, token_interface::Mint>,

    /// CHECK: reward token account
    #[account(
        mut,
        constraint = reward_token_account.key() == identity.reward_token_account @ XcityError::InvalidRewardTokenAccount,
    )]
    pub reward_token_account: UncheckedAccount<'info>,

    /// CHECK: kyc mint authority
    #[account(
        constraint = kyc_mint_authority.key() == xcity.kyc_mint_authority @ XcityError::InvalidKycMintAuthority
    )]
    pub kyc_mint_authority: UncheckedAccount<'info>,

    /// CHECK: resume mint authority
    #[account(
        constraint = resume_mint_authority.key() == xcity.resume_mint_authority @ XcityError::InvalidResumeMintAuthority
    )]
    pub resume_mint_authority: UncheckedAccount<'info>,

    /// CHECK: reward mint authority
    #[account(
        constraint = reward_mint_authority.key() == xcity.reward_mint_authority @ XcityError::InvalidRewardMintAuthority
    )]
    pub reward_mint_authority: UncheckedAccount<'info>,
   
    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}


impl<'info> InitKyc<'info> {

    pub fn mint_resume_token(&self) -> Result<()> {
        let signer_seeds: &[&[&[u8]]] = &[&[RESUME_MINT_AUTHORITY_SEED.as_bytes(), &[self.xcity.resume_mint_authority_bump]]];
        mint_token(
            signer_seeds, 
            self.token_2022_program.to_account_info(), 
            self.resume_mint_token.to_account_info(), 
            self.resume_token_account.to_account_info(), 
            self.resume_mint_authority.to_account_info(), 
            1
        )
    }

    pub fn mint_kyc_token(&self) -> Result<()> {
        let signer_seeds: &[&[&[u8]]] = &[&[KYC_MINT_AUTHORITY_SEED.as_bytes(), &[self.xcity.kyc_mint_authority_bump]]];
        mint_token(
            signer_seeds, 
            self.token_2022_program.to_account_info(), 
            self.kyc_mint_token.to_account_info(), 
            self.kyc_token_account.to_account_info(), 
            self.kyc_mint_authority.to_account_info(), 
            1
        )
    }

    pub fn mint_reward_token(&self) -> Result<()> {
        if self.xcity.kyc_reward == 0 {
            Ok(())
        }else{
            let signer_seeds: &[&[&[u8]]] = &[&[REWARD_MINT_AUTHORITY_SEED.as_bytes(), &[self.xcity.reward_mint_authority_bump]]];
            mint_token(
                signer_seeds, 
                self.token_2022_program.to_account_info(), 
                self.reward_mint_token.to_account_info(), 
                self.reward_token_account.to_account_info(), 
                self.reward_mint_authority.to_account_info(), 
                (self.xcity.kyc_reward * 10_u32.pow(self.reward_mint_token.decimals as u32)).into()
            )
        }
    }

    pub fn update_kyc_symbol(&self, symbol: String) -> Result<()> {
        let signer_seeds: &[&[&[u8]]] = &[&[KYC_MINT_AUTHORITY_SEED.as_bytes(), &[self.xcity.kyc_mint_authority_bump]]];
        token_2022_extensions::token_metadata_update_field(
            CpiContext::new_with_signer(
                self.token_2022_program.to_account_info(),
                token_2022_extensions::TokenMetadataUpdateField {
                    token_program_id: self.token_2022_program.to_account_info(),
                    metadata: self.kyc_mint_token.to_account_info(),
                    update_authority: self.kyc_mint_authority.to_account_info(),
                },
                signer_seeds
            ),
            spl_token_metadata_interface::state::Field::Symbol.into(),  
            symbol
        )
    }


}
