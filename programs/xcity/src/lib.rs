pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

use {
    anchor_lang::prelude::*,
    instructions::*,
    state::*
};

declare_id!("Dhg3N2qdtaRBfTzAo9CuNgKzEXUtHXMZcEGLTu6xMiDH");

#[program]
pub mod xcity {
    use super::*;

    pub fn init_xcity(ctx: Context<InitXcity>, kyc_skip: bool) -> Result<()> {
        init_xcity::handler(ctx, kyc_skip)
    }

    pub fn init_kyc(ctx: Context<InitKyc>,
        hash_id: String, 
        encryption_id: String, 
        data_hash: String, 
        name: String, 
        url: String) -> Result<()> {
        init_kyc::handler(ctx, hash_id, encryption_id, data_hash, name, url)
    }

    pub fn register(ctx: Context<Register>, id_type: IdType, kyc_mint_space: u32, resume_mint_space: u32) -> Result<()> {
        register::handler(ctx, id_type, kyc_mint_space as usize, resume_mint_space as usize)
    }  

    pub fn init_ata(ctx: Context<InitAta>) -> Result<()> {
        init_ata::handler(ctx)
    }

    pub fn approve_kyc(ctx: Context<ApproveKyc>, hash_id: String) -> Result<()> {
        approve_kyc::handler(ctx, hash_id)
    }  

    pub fn create_role(ctx: Context<CreateRole>, encryption_id: String, info: String) -> Result<()> {
        create_role::handler(ctx, encryption_id, info)
    }

    pub fn verify_role(ctx: Context<VerifyRole>, status: u8) -> Result<()> {
        verify_role::handler(ctx, status)
    }

    pub fn create_job_description(ctx: Context<CreateJobDescription>, jd_hash: String, jd_url: String) -> Result<()> {
        create_job_description::handler(ctx, jd_hash, jd_url)
    }
}


