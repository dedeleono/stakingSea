use anchor_lang::prelude::*;

declare_id!("CJcyzcyBMWqwFoMoLfRaa54kVa6EegK8EDRQKz2pobbG");

// Data Logics

#[program]
pub mod nft_staker {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        let jollyranch = &mut ctx.accounts.jollyranch;
        jollyranch.authority = ctx.accounts.authority.key();
        jollyranch.amount = 0;
        jollyranch.amount_redeemed = 0;
        Ok(())
    }

    pub fn fund_ranch(ctx: Context<FundRanch>, amount: u64) -> ProgramResult {
        let jollyranch = &mut ctx.accounts.jollyranch;
        // TODO: Take their spl_tokens and add them to the amount
        jollyranch.amount += amount;
        Ok(())
    }

    pub fn stake_nft(ctx: Context<StakeNFT>) -> ProgramResult {
        let clock = Clock::get().unwrap();
        let stake = &mut ctx.accounts.stake;
        // preform extra stake data checks here

        stake.authority = ctx.accounts.authority.key();
        // stake.nft = ;
        stake.start_date = clock.unix_timestamp;
        Ok(())
    }

    pub fn redeem_rewards(ctx: Context<RedeemRewards>) -> ProgramResult {
        let amount_to_redeem = 0;
        let stake = &mut ctx.accounts.stake;
        // TODO: Calculate the amount to redeem based on the stake amount and the current time

        stake.amount_redeemed += amount_to_redeem;
        stake.amount_redeemed = 0;
        Ok(())
    }
}

// Data Validators

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = JollyRanch::LEN)]
    pub jollyranch: Account<'info, JollyRanch>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundRanch<'info> {
    #[account(has_one = authority)]
    pub jollyranch: Account<'info, JollyRanch>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct StakeNFT<'info> {
    #[account(init, payer = authority, space = Stake::LEN)]
    pub stake: Account<'info, Stake>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RedeemRewards<'info> {
    #[account(has_one = authority)]
    pub stake: Account<'info, Stake>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RedeemNFT<'info> {
    #[account(has_one = authority)]
    pub stake: Account<'info, Stake>,
    pub authority: Signer<'info>,
}

// Data Structures

const DISCRIMINATOR_LENGTH: usize = 8;
const AUTHORITY_LENGTH: usize = 32;
const SPL_TOKEN_LENGTH: usize = 32;
const START_DATE_LENGTH: usize = 8;
const END_DATE_LENGTH: usize = 8;
const AMOUNT_LENGTH: usize = 8;
const AMOUNT_REDEEMED_LENGTH: usize = 8;
const AMOUNT_OWED_LENGTH: usize = 8;

#[account]
pub struct JollyRanch {
    pub authority: Pubkey,
    pub spl_token: Pubkey,
    pub amount: u64,
    pub amount_redeemed: u64,
}

impl JollyRanch {
    const LEN: usize = AMOUNT_LENGTH
        + AMOUNT_REDEEMED_LENGTH
        + DISCRIMINATOR_LENGTH
        + AUTHORITY_LENGTH
        + SPL_TOKEN_LENGTH;
}

#[account]
pub struct Stake {
    pub authority: Pubkey,
    pub spl_token: Pubkey,
    pub start_date: i64,
    pub end_date: i64,
    pub amount_redeemed: u64,
    pub amount_owed: u64,
}

impl Stake {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + AUTHORITY_LENGTH
        + SPL_TOKEN_LENGTH
        + START_DATE_LENGTH
        + END_DATE_LENGTH
        + AMOUNT_REDEEMED_LENGTH
        + AMOUNT_OWED_LENGTH;
}
// Error Codes
#[error]
pub enum ErrorCode {
    #[msg("Invalid stake")]
    InvalidStake,
}
