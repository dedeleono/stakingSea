use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("5Wzhw9syRzXQSQkDs8pdCABC9gsWm2FpCjsV1wuqLnzZ");

// Data Logics

#[program]
pub mod nft_staker {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>, token: Pubkey) -> ProgramResult {
        msg!("initializer ran from anchor log");
        let jollyranch = &mut ctx.accounts.jollyranch;
        jollyranch.authority = ctx.accounts.authority.key();
        jollyranch.amount = 0;
        jollyranch.amount_redeemed = 0;
        jollyranch.spl_token = token;
        Ok(())
    }

    pub fn fund_ranch(ctx: Context<FundRanch>, jollyranch_bump: u8, amount: u64) -> ProgramResult {
        msg!("Funder starting tokens: {}", ctx.accounts.sender_spl_account.amount);
        token::transfer(ctx.accounts.transfer_ctx(), amount)?;
        ctx.accounts.sender_spl_account.reload()?;
        msg!("Funder ending tokens: {}", ctx.accounts.sender_spl_account.amount);
        let jollyranch = &mut ctx.accounts.jollyranch;
        jollyranch.amount += amount;
        jollyranch.jollyranch_bump = jollyranch_bump;
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
#[instruction(jollyranch_bump: u8)]
pub struct FundRanch<'info> {
    #[account(has_one = authority)]
    pub jollyranch: Account<'info, JollyRanch>,
    pub authority: Signer<'info>,
    // spl_token specific validations
    #[account(mut)]
    pub sender_spl_account: Account<'info, TokenAccount>,
    #[account(init, payer = authority, seeds = [jollyranch.key().as_ref()], bump = jollyranch_bump, token::mint = mint, token::authority = reciever_spl_account )]
    pub reciever_spl_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>
}

impl<'info> FundRanch<'info> {
    pub fn transfer_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.sender_spl_account.to_account_info(),
                to: self.reciever_spl_account.to_account_info(),
                authority: self.authority.to_account_info(),
            }
        )
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
const JOLLYRANCH_BUMP: usize = 8;

#[account]
pub struct JollyRanch {
    pub authority: Pubkey,
    pub spl_token: Pubkey,
    pub amount: u64,
    pub amount_redeemed: u64,
    pub jollyranch_bump: u8
}

impl JollyRanch {
    const LEN: usize = AMOUNT_LENGTH
        + AMOUNT_REDEEMED_LENGTH
        + DISCRIMINATOR_LENGTH
        + AUTHORITY_LENGTH
        + SPL_TOKEN_LENGTH
        + JOLLYRANCH_BUMP;
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
