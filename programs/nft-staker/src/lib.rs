use anchor_lang::prelude::*;

declare_id!("CJcyzcyBMWqwFoMoLfRaa54kVa6EegK8EDRQKz2pobbG");

#[program]
pub mod nft_staker {
    use super::*;
    pub fn stake_nft(ctx: Context<StakeNFT>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct StakeNFT<'info> {
    #[account(init, payer = authority, space = Stake::LEN)]
    pub stake: Account<'info, Stake>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Data Structures

#[account]
pub struct Stake {
    pub authority: Pubkey,
    pub nft: Pubkey,
    pub start_date: i64,
    pub end_date: i64,
    pub amount_redeemed: u64,
}

const DISCRIMINATOR_LENGHT: usize = 8;
const AUTHORTY_LENGHT: usize = 32;
const NFT_LENGHT: usize = 32;
const START_DATE_LENGHT: usize = 8;
const END_DATE_LENGHT: usize = 8;
const AMOUNT_REDEEMED_LENGHT: usize = 8;

impl Stake {
    const LEN: usize = DISCRIMINATOR_LENGHT
        + AUTHORTY_LENGHT
        + NFT_LENGHT
        + START_DATE_LENGHT
        + END_DATE_LENGHT
        + AMOUNT_REDEEMED_LENGHT;
}

// Error Codes
#[error]
pub enum ErrorCode {
    #[msg("Invalid stake")]
    InvalidStake,
}
