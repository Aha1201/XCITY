use anchor_lang::prelude::*;

#[error_code]
pub enum XcityError {
    #[msg("Invalid xcity key")]
    InvalidXcityKey,
    #[msg("Invalid kyc mint token")]
    InvalidKycMintToken,
    #[msg("Invalid kyc token account")]
    InvalidKycTokenAccount,
    #[msg("Invalid resume mint token")]
    InvalidResumeMintToken,
    #[msg("Invalid reward mint token")]
    InvalidRewardMintToken,
    #[msg("Invalid resume mint authority")]
    InvalidResumeMintAuthority,
    #[msg("Invalid kyc validator")]
    InvalidKycValidator,
    #[msg("Invalid kyc mint authority")]
    InvalidKycMintAuthority,
    #[msg("Invalid identity")]
    InvalidIdentity,
    #[msg("Invalid reward mint authority")]
    InvalidRewardMintAuthority,
    #[msg("Invalid ata token")]
    InvalidAtaToken,
    #[msg("Invalid resume token account")]
    InvalidResumeTokenAccount,
    #[msg("Invalid reward token account")]
    InvalidRewardTokenAccount,
    #[msg("Invalid role")]
    InvalidRole,
    #[msg("Invalid role status")]
    InvalidRoleStatus,
    #[msg("Invalid signature")]
    InvalidSignature,   
    #[msg("Invalid talent")]
    InvalidTalent,
}