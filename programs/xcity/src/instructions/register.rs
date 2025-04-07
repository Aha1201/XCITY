use {
    solana_program::program::invoke_signed,
    crate::{
        errors::*, 
        state::*,
    }, 
    anchor_lang::prelude::*, 
    anchor_spl::{
        associated_token::AssociatedToken,
        token_2022::{initialize_mint2, InitializeMint2},
        token_2022_extensions::{
            self, 
            token_metadata_initialize, 
            TokenMetadataInitialize, 
            *
        },
         token_interface::TokenInterface
    }, 
    spl_token_2022::{self, extension::ExtensionType,  *}, 
    std::mem::size_of, 
    token_metadata
};

pub fn handler(
    ctx: Context<Register>, id_type: IdType, kyc_mint_space: usize, resume_mint_space: usize
) -> Result<()> {
    //create kyc mint token
    msg!("creating kyc mint token...");
    ctx.accounts.create_kyc_mint_token(kyc_mint_space)?;
    //create resume mint token
    msg!("creating resume mint token...");
    ctx.accounts.create_resume_mint_token(resume_mint_space)?;
    //update kyc mint token
    msg!("updating kyc mint token...");
    ctx.accounts.update_kyc_mint_token()?;
    //update resume mint token
    msg!("updating resume mint token...");
    ctx.accounts.update_resume_mint_token()?;

    // //create kyc ata token
    // msg!("creating kyc ata token...");
    // ctx.accounts.create_ata_token(ctx.accounts.kyc_token_account.to_account_info(), ctx.accounts.kyc_mint_token.to_account_info())?;
    // //create resume ata token
    // msg!("creating resume ata token...");
    // ctx.accounts.create_ata_token(ctx.accounts.resume_token_account.to_account_info(), ctx.accounts.resume_mint_token.to_account_info())?;
    // let register = ctx.accounts;

    //INIT THE identity ACCOUNT
    let identity= &mut ctx.accounts.identity;
    identity.id_type = id_type;
    identity.bump = ctx.bumps.identity;
    identity.assets_price = 10;
    identity.publish_num = 0;
    identity.verified_num = 0;
    identity.is_verified = false;
    identity.is_staking = false;
    identity.is_registered = true;
    identity.owner = ctx.accounts.payer.key().clone();
    identity.kyc_mint_token =  ctx.accounts.kyc_mint_token.key().clone();
    identity.resume_mint_token = ctx.accounts.resume_mint_token.key().clone();

    Ok(())
}

#[derive(Accounts)]
pub struct Register<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + size_of::<Identity>(),
        seeds = [IDENTITY_SEED.as_bytes(), payer.key().as_ref()],
        bump
    )]
    pub identity: Account<'info, Identity>,
    #[account(
        seeds = [XCITY_SEED.as_bytes()],
        bump = xcity.bump
    )]
    pub xcity: Account<'info, Xcity>,
    #[account(mut)]
    pub kyc_mint_token: Signer<'info>,
    /// CHECK: kyc mint authority
    #[account(
        mut,
        seeds = [KYC_MINT_AUTHORITY_SEED.as_bytes()],
        bump = xcity.kyc_mint_authority_bump,
        constraint = kyc_mint_authority.key() == xcity.kyc_mint_authority @ XcityError::InvalidKycMintAuthority
    )]
    pub kyc_mint_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub resume_mint_token: Signer<'info>,

    /// CHECK: resume mint authority
    #[account(
        seeds = [RESUME_MINT_AUTHORITY_SEED.as_bytes()],
        bump = xcity.resume_mint_authority_bump,
        constraint = resume_mint_authority.key() == xcity.resume_mint_authority @ XcityError::InvalidResumeMintAuthority,
    )]
    pub resume_mint_authority: UncheckedAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,

}

impl<'info> Register<'info> {
    pub fn create_kyc_mint_token(&self, kyc_mint_space: usize) -> Result<()> {
        // getMintLen 
        let rent: Rent = Rent::get()?;
        let space: usize = spl_token_2022::extension::ExtensionType::try_calculate_account_len::<spl_token_2022::state::Mint>(&[ExtensionType::MetadataPointer, ExtensionType::NonTransferable])?;
        // let total_space = space + LENGTH_SIZE + TYPE_SIZE ;
        let lamports = rent.minimum_balance(kyc_mint_space);

        // createAccount 
        let create_account_ix = solana_program::system_instruction::create_account(
            self.payer.key,
            self.kyc_mint_token.key,
            lamports,
            space as u64,
            &self.token_program.key(),
        );
        invoke_signed(
            &create_account_ix,
            &[
                self.payer.to_account_info(),
                self.kyc_mint_token.to_account_info(),
                self.system_program.to_account_info(),
            ],
            &[],
        )?;

        // Set MetadataPointer 
        token_2022_extensions::metadata_pointer_initialize(
            CpiContext::new(
                self.token_program.to_account_info(),
                token_2022_extensions::MetadataPointerInitialize {
                    mint: self.kyc_mint_token.to_account_info(),
                    token_program_id: self.token_program.to_account_info(),
                },
            ),
            Some(self.kyc_mint_authority.key.clone()),
            Some(self.kyc_mint_token.key.clone()),
        )?;
        // Set NonTransferable 
        token_2022_extensions::non_transferable_mint_initialize(
            CpiContext::new(
                self.token_program.to_account_info(),
                token_2022_extensions::NonTransferableMintInitialize {
                    mint: self.kyc_mint_token.to_account_info(),
                    token_program_id: self.token_program.to_account_info(),
                },
            ),
        )?;
        // initialize mint
        let signer_seeds: &[&[&[u8]]] = &[&[KYC_MINT_AUTHORITY_SEED.as_bytes(), 
        &[self.xcity.kyc_mint_authority_bump]]];
        initialize_mint2(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                InitializeMint2 {
                    mint: self.kyc_mint_token.to_account_info(),
                }, 
                signer_seeds,
            ),
            0,
            &self.kyc_mint_authority.key,
            Some(&self.kyc_mint_authority.key),
        )?;

        msg!("space------: {}",space);
        msg!("kyc_mint_space------: {}",kyc_mint_space);
        token_metadata_initialize(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                TokenMetadataInitialize {
                    token_program_id: self.token_program.to_account_info(),
                    metadata: self.kyc_mint_token.to_account_info(),
                    update_authority: self.kyc_mint_authority.to_account_info(),
                    mint_authority: self.kyc_mint_authority.to_account_info(),
                    mint: self.kyc_mint_token.to_account_info(),
                },
                signer_seeds,
            ),
            "XCITY_KYC".to_string(),
            "XCITY_KYC".to_string(),
            "XCITY_KYC".to_string(),
        )?; 

        Ok(())
    }
    
    pub fn create_resume_mint_token(&self, resume_mint_space: usize) -> Result<()> {
        // getMintLen 
        let rent: Rent = Rent::get()?;
        let space: usize = spl_token_2022::extension::ExtensionType::try_calculate_account_len::<spl_token_2022::state::Mint>(&[ExtensionType::MetadataPointer])?;
        let lamports = rent.minimum_balance(resume_mint_space);
        // createAccount 
        let create_account_ix = solana_program::system_instruction::create_account(
            self.payer.key,
            self.resume_mint_token.key,
            lamports,
            space as u64,
            &self.token_program.key(),
        );
        invoke_signed(
            &create_account_ix,
            &[
                self.payer.to_account_info(),
                self.resume_mint_token.to_account_info(),
                self.system_program.to_account_info(),
            ],
            &[],
        )?;

        // Set MetadataPointer 
        token_2022_extensions::metadata_pointer_initialize(
            CpiContext::new(
                self.token_program.to_account_info(),
                token_2022_extensions::MetadataPointerInitialize {
                    mint: self.resume_mint_token.to_account_info(),
                    token_program_id: self.token_program.to_account_info(),
                },
            ),
            Some(self.resume_mint_authority.key.clone()),
            Some(self.resume_mint_token.key.clone()),
        )?;
        // initialize mint
        let signer_seeds: &[&[&[u8]]] = &[&[RESUME_MINT_AUTHORITY_SEED.as_bytes(), 
        &[self.xcity.resume_mint_authority_bump]]];
        initialize_mint2(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                InitializeMint2 {
                    mint: self.resume_mint_token.to_account_info(),
                },
                signer_seeds,
            ),
            0,
            &self.resume_mint_authority.key,
            Some(&self.resume_mint_authority.key),
        )?;


        msg!("space------: {}",space);
        msg!("resume_mint_space------: {}",resume_mint_space);
        token_metadata_initialize(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                TokenMetadataInitialize {
                    token_program_id: self.token_program.to_account_info(),
                    metadata: self.resume_mint_token.to_account_info(),
                    update_authority: self.resume_mint_authority.to_account_info(),
                    mint_authority: self.resume_mint_authority.to_account_info(),
                    mint: self.resume_mint_token.to_account_info(),
                },
                signer_seeds
            ),
            "XCITY_RESUME".to_string(),
            "XCITY_RESUME".to_string(),
            "XCITY_RESUME".to_string(),
        )?; 

        Ok(())
    }  

    fn update_kyc_mint_token(&self) -> Result<()> {
        let signer_seeds: &[&[&[u8]]] = &[&[KYC_MINT_AUTHORITY_SEED.as_bytes(), 
        &[self.xcity.kyc_mint_authority_bump]]];
        token_metadata::token_metadata_update_field(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                token_metadata::TokenMetadataUpdateField {
                    token_program_id: self.token_program.to_account_info(),
                    metadata: self.kyc_mint_token.to_account_info(),
                    update_authority: self.kyc_mint_authority.to_account_info(),
                },
                signer_seeds,
            ),
            spl_token_metadata_interface::state::Field::Name, 
            "XCITY_KYC".to_string(),
        )?;
        Ok(())
    }

    fn update_resume_mint_token(&self) -> Result<()> {
        let signer_seeds: &[&[&[u8]]] = &[&[RESUME_MINT_AUTHORITY_SEED.as_bytes(), 
        &[self.xcity.resume_mint_authority_bump]]];
        token_metadata::token_metadata_update_field(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                token_metadata::TokenMetadataUpdateField {
                    token_program_id: self.token_program.to_account_info(),
                    metadata: self.resume_mint_token.to_account_info(),
                    update_authority: self.resume_mint_authority.to_account_info(),
                },
                signer_seeds,
            ),
            spl_token_metadata_interface::state::Field::Symbol,  
            self.identity.key().to_string(),
        )?;
        Ok(())
    }



}
