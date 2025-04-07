use {
    anchor_lang::prelude::*, 
    solana_program::pubkey::Pubkey,
    solana_program::ed25519_program,
};

pub const XCITY_SEED: &str = "xcity";
pub const KYC_MINT_AUTHORITY_SEED: &str = "kyc_mint_authority";
pub const REWARD_MINT_AUTHORITY_SEED: &str = "reward_mint_authority";
pub const REWARD_VAULT_AUTHORITY_SEED: &str = "reward_vault_authority";
pub const RESUME_MINT_AUTHORITY_SEED: &str = "resume_mint_authority";
pub const IDENTITY_SEED: &str = "identity";
pub const ROLE_SEED: &str = "role";
pub const JOB_DESCRIPTION_SEED: &str = "job_description";

pub const LENGTH_SIZE: usize = 2;
pub const TYPE_SIZE: usize = 1;





#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum IdType {
    Talent,
    Enterprise,
}

#[account]
pub struct Xcity {
    pub bump: u8,
    // skip the off-chain kyc
    pub kyc_skip: bool,
    // kyc mint authority
    pub kyc_mint_authority: Pubkey,
    // kyc mint authority bump
    pub kyc_mint_authority_bump: u8,
    // reward minttoken(XCC Token)
    pub reward_mint_token: Pubkey,
    // reward mint authority
    pub reward_mint_authority: Pubkey,
    // reward mint authority bump
    pub reward_mint_authority_bump: u8,
    // kyc validator
    pub kyc_validator: Pubkey,
    // kyc reward
    pub kyc_reward: u32,
    // create ro(talent)
    pub crate_role_reward: u32,
    // verify role reward(enterprise)
    pub verify_role_reward: u32,
    // job description reward
    pub job_description_reward: u32,
    // resume mint authority
    pub resume_mint_authority: Pubkey,
    // resume mint authority bump
    pub resume_mint_authority_bump: u8,
    // reward_ vault (use for staking nft which like the talent's resume)
    pub reward_vault: Pubkey,
    // reward_ vault authority
    pub reward_vault_authority: Pubkey,
    // reward_ vault authority bump
    pub reward_vault_authority_bump: u8,
}

#[account]
pub struct Identity {
    // true if kyc verified
    pub is_verified: bool, // size: 1
    // id type(talent or enterprise)
    pub id_type: IdType, // size: 1
    pub bump: u8, // size: 1
    pub owner: Pubkey, // size: 32
    pub kyc_mint_token: Pubkey, // size: 32
    pub kyc_token_account: Pubkey, // size: 32
    pub resume_mint_token: Pubkey, // size: 32
    pub resume_token_account: Pubkey, // size: 32
    pub reward_token_account: Pubkey, // size: 32
    pub is_registered: bool, // size: 1
    //  staking status
    pub is_staking: bool, // size: 1
    // the price to pay when the resume unlock by the enterprise
    pub assets_price: u64, // size: 8
    // role number
    pub publish_num: u32, // size: 4
    // verified number
    pub verified_num: u32, // size: 4
    // future capacity
    pub future_capacity: [u8; 128], // size: 128
    // name (the name of the enterprise, or the name of the talent[talent's name can ben null])
    pub name: String, // size: 24 
    // website url
    pub url: String, // size: 24 
    // off-chain id hash by kyc tissue (use for privacy and  verify identity)
    pub hash_id: String, // size: 24 
    //off-chain id rsa encrypted (use for privacy and company verify employee's identity )
    pub encryption_id: String, // size: 24 
    // resume hash (use for resume verify)
    pub data_hash: String, // size: 24 
}

#[account]
pub struct Role {
    // verifier (the enterprise who verify the role)
    pub verifier: Pubkey, //size: 32
    // owner (the talent who publish the role)
    pub owner: Pubkey, //size: 32
    // the order id of the role
    pub order_id: u32, //size: 4
    pub bump: u8, //size: 1
    // verified status (0: not verified, 1: verified, 2: rejected)
    pub verified_status: u8, //size: 1
    // created at (the time when the role is created)
    pub created_at: i64, //size: 8
    // verified at (the time when the role is verified)
    pub verified_at: i64, //size: 8
    // the id encrypted by the validator's public key
    pub encryption_id: String, //size: 4
    // info (the info of the role)
    pub info: String, //size: 4

}

#[account]
pub struct JobDescription {
    // owner (the enterprise who publish the job description)
    pub owner: Pubkey, //size: 32
    // the order id of the role
    pub order_id: u32, //size: 4
    pub bump: u8, //size: 1
    // the time when the job description is created
    pub created_at: i64, //size: 8
    // the status of the job description (0: invalid, 1: valid)
    pub status: u8, //size: 1
    // the expiration time of the job description
    pub expiration_time: i64, //size: 8
    // the hash of the job description
    pub jd_hash: String, //size: 4
    // the url of the job description
    pub jd_url: String, //size: 4
}


impl Identity {
    pub const BASE_LEN: usize = 8 + 1 + 1 + 1 + 32 + 32 + 32 + 32 + 32 + 32 + 1 + 1 + 8 + 4 + 4 + 128 + 4 + 4 + 4 + 4 + 4;
    pub fn len(&self) -> usize {
        Self::BASE_LEN + self.name.len() + self.url.len() + self.hash_id.len() + self.encryption_id.len() + self.data_hash.len()
    }
    pub fn calc_len(name: &str, url: &str, hash_id: &str, encryption_id: &str, data_hash: &str) -> usize {
        Self::BASE_LEN + name.len() + url.len() + hash_id.len() + encryption_id.len() + data_hash.len()
    }
}

impl Role {
    pub const BASE_LEN: usize = 8 + 32 + 32 + 4 + 1 + 1 + 8 + 8 + 4 + 4 ;
    pub fn len(&self) -> usize {
        Self::BASE_LEN + self.info.len() + self.encryption_id.len()
    }
    pub fn calc_len(encryption_id: &str, info: &str) -> usize {
        Self::BASE_LEN + info.len() +  encryption_id.len()
    }

}

impl JobDescription {
    pub const BASE_LEN: usize = 8 + 32 + 4 + 1 + 8 + 1 + 8 + 4 + 4;
    pub fn len(&self) -> usize {
        Self::BASE_LEN + self.jd_hash.len() + self.jd_url.len()
    }
    pub fn calc_len(jd_hash: &str, jd_url: &str) -> usize { 
        Self::BASE_LEN + jd_hash.len() + jd_url.len()
    }
}

