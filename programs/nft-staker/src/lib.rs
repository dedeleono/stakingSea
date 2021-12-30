use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("5Wzhw9syRzXQSQkDs8pdCABC9gsWm2FpCjsV1wuqLnzZ");

// Data Logics

#[program]
pub mod nft_staker {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>, jolly_bump: u8, spl_bump: u8) -> ProgramResult {
        msg!("initializer ran from anchor log");
        let jollyranch = &mut ctx.accounts.jollyranch;
        jollyranch.authority = ctx.accounts.authority.key();
        jollyranch.amount = 0;
        jollyranch.amount_redeemed = 0;
        jollyranch.bump = jolly_bump;
        jollyranch.spl_bump = spl_bump;
        Ok(())
    }

    pub fn fund_ranch(ctx: Context<FundRanch>, amount: u64) -> ProgramResult {
        // msg!("Funder starting tokens: {}", ctx.accounts.sender_spl_account.amount);
        token::transfer(ctx.accounts.transfer_ctx(), amount)?;
        // ctx.accounts.sender_spl_account.reload()?;
        // msg!("Funder ending tokens: {}", ctx.accounts.sender_spl_account.amount);
        let jollyranch = &mut ctx.accounts.jollyranch;
        jollyranch.amount += amount;
        Ok(())
    }

    pub fn stake_nft(ctx: Context<StakeNFT>, spl_bump: u8, lockup: u8, rarity: u8) -> ProgramResult {
        if lockup > 3 {
            return Err(ErrorCode::InvalidLockupPeriod.into());
        }
        if rarity > 3 {
            return Err(ErrorCode::InvalidRarity.into());
        }        
        let clock = Clock::get().unwrap();
        // Clock::get().unwrap();
        token::transfer(ctx.accounts.transfer_ctx(), 1)?;

        let stake = &mut ctx.accounts.stake;
        stake.authority = ctx.accounts.authority.key();
        stake.start_date = clock.unix_timestamp;
        // lockup is 1/2/3 times days for lockup times seconds in a day aka lockup 1 = ten days
        stake.end_date = clock.unix_timestamp + (lockup as i64) * 10 * 24*60*60;
        stake.spl_bump = spl_bump;
        // msg!("NEW LOGS FOUND");
        let percentage = ((lockup+rarity)as f64) / 100.0;
        // msg!("reward percentage: {}", percentage);
        let jollyranch = &mut ctx.accounts.jollyranch;
        // msg!("jollyranch amount: {}", jollyranch.amount);
        let reward = ((jollyranch.amount as f64) * percentage) as u64;
        // msg!("reward amount in cheese: {}", reward);
        jollyranch.amount_redeemed += reward;
        jollyranch.amount -= reward;
        stake.amount_owed = reward;
        stake.amount_redeemed = 0;

        Ok(())
    }

    pub fn redeem_rewards(_ctx: Context<RedeemRewards>) -> ProgramResult {
        // let amount_to_redeem = 0;
        // let stake = &mut ctx.accounts.stake;
        // // TODO: Calculate the amount to redeem based on the stake amount and the current time

        // stake.amount_redeemed += amount_to_redeem;
        // stake.amount_redeemed = 0;
        let clock = Clock::get().unwrap();
        msg!("clock.unix_timestamp: {}", clock.unix_timestamp);
        let lockup = 10 * 24*60*60;
        msg!("clock.unix_timestamp + 10 days: {}", clock.unix_timestamp + lockup);
        Ok(())
    }

    pub fn redeem_nft(ctx: Context<RedeemNFT>) -> ProgramResult {
        let amount_to_redeem = 0;
        let stake = &mut ctx.accounts.stake;
        // TODO: Calculate the amount to redeem based on the stake amount and the current time
        // if clock.unix_timestamp < val {
        // if *ctx.accounts.payer.key != candy_machine.authority {
        //     return Err(ErrorCode::CandyMachineNotLiveYet.into());
        // }
        stake.amount_redeemed += amount_to_redeem;
        stake.amount_redeemed = 0;
        Ok(())
    }
}

// Data Validators

#[derive(Accounts)]
#[instruction(jolly_bump: u8, spl_bump: u8)]
pub struct Initialize<'info> {
    #[account(init, seeds = [b"jolly_account".as_ref()], bump = jolly_bump, payer = authority, space = JollyRanch::LEN)]
    pub jollyranch: Account<'info, JollyRanch>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init, seeds = [jollyranch.key().as_ref()], bump = spl_bump, token::mint = mint, token::authority = reciever_spl_account, payer = authority)]
    pub reciever_spl_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct FundRanch<'info> {
    #[account(mut, has_one = authority, seeds = [b"jolly_account".as_ref()], bump = jollyranch.bump)]
    pub jollyranch: Account<'info, JollyRanch>,
    pub authority: Signer<'info>,
    // spl_token specific validations
    #[account(mut)]
    pub sender_spl_account: Account<'info, TokenAccount>,
    #[account(mut, seeds = [jollyranch.key().as_ref()], bump = jollyranch.spl_bump)]
    pub reciever_spl_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
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
#[instruction(spl_bump: u8)]
pub struct StakeNFT<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init, payer = authority, space = Stake::LEN)]
    pub stake: Account<'info, Stake>,
    #[account(mut, seeds = [b"jolly_account".as_ref()], bump = jollyranch.bump)]
    pub jollyranch: Account<'info, JollyRanch>,
    #[account(mut)]
    pub sender_spl_account: Account<'info, TokenAccount>,
    #[account(init, seeds = [stake.key().as_ref()], bump = spl_bump, token::mint = mint, token::authority = reciever_spl_account, payer = authority)]
    pub reciever_spl_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> StakeNFT<'info> {
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
pub struct RedeemRewards {
    // #[account(has_one = authority)]
    // pub stake: Account<'info, Stake>,
    // pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RedeemNFT<'info> {
    #[account(has_one = authority)]
    pub stake: Account<'info, Stake>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

// Data Structures

const DISCRIMINATOR_LENGTH: usize = 8;
const AUTHORITY_LENGTH: usize = 32;
const START_DATE_LENGTH: usize = 8;
const END_DATE_LENGTH: usize = 8;
const AMOUNT_LENGTH: usize = 8;
const AMOUNT_REDEEMED_LENGTH: usize = 8;
const AMOUNT_OWED_LENGTH: usize = 8;
const BUMP: usize = 8;

#[account]
pub struct JollyRanch {
    pub authority: Pubkey,
    pub spl_bump: u8,
    pub amount: u64,
    pub amount_redeemed: u64,
    pub bump: u8
}

impl JollyRanch {
    const LEN: usize = AMOUNT_LENGTH
        + AMOUNT_REDEEMED_LENGTH
        + DISCRIMINATOR_LENGTH
        + AUTHORITY_LENGTH
        + BUMP
        + BUMP;
}

#[account]
pub struct Stake {
    pub authority: Pubkey,
    pub spl_bump: u8,
    pub start_date: i64,
    pub end_date: i64,
    pub amount_redeemed: u64,
    pub amount_owed: u64,
}

impl Stake {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + AUTHORITY_LENGTH
        + BUMP
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
    #[msg("Lockup period invalid")]
    InvalidLockupPeriod,
    #[msg("Rarity invalid")]
    InvalidRarity,
}
