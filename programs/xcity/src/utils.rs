use {
    anchor_lang::prelude::*, 
    solana_program::account_info::AccountInfo,
    spl_token_2022::{
        extension::{
            BaseStateWithExtensions, 
            ExtensionType, 
            StateWithExtensions
        },
        state::Mint
    },
    // anchor_spl::token::{
    //     MintTo, 
    //     mint_to,
    // },
    anchor_spl::token_2022::{
        MintTo, 
        mint_to,
    },
};



pub fn get_extension_types(account_info: &AccountInfo) -> core::result::Result<Vec<ExtensionType>, ProgramError> {
    let account_data = account_info.data.borrow();
    let account_with_extensions = StateWithExtensions::<Mint>::unpack(&account_data)?;
    account_with_extensions.get_extension_types()
}

pub fn has_extension_type(account_info: &AccountInfo, extension_type: ExtensionType) -> bool {
    let extension_types = get_extension_types(account_info).unwrap();
    // msg!("extension_types: {:?}", extension_types);
    extension_types.contains(&extension_type)
}

pub fn is_non_transferable(mint_account: &AccountInfo) -> bool {
    // msg!("is_non_transferable mint_account: {:?}", mint_account);
    has_extension_type(mint_account, ExtensionType::NonTransferable)
}

pub fn is_immutable_owner(token_account: &AccountInfo) -> bool {
    has_extension_type(token_account, ExtensionType::ImmutableOwner)
}

pub fn mint_token<'info>(
    signer_seeds: &[&[&[u8]]], 
    program: AccountInfo<'info>, 
    mint_account: AccountInfo<'info>, 
    token_account: AccountInfo<'info>, 
    authority: AccountInfo<'info>, 
    amount: u64
    ) -> Result<()> {
    mint_to(
        CpiContext::new_with_signer(
            program,
            MintTo {
                mint: mint_account,
                to: token_account,
                authority: authority,
            },
            signer_seeds
        ),
        amount
    ).unwrap();
    Ok(())
}