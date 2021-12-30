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

    pub fn stake_nft(
        ctx: Context<StakeNFT>,
        spl_bump: u8,
        lockup: u8,
        rarity: u8,
    ) -> ProgramResult {
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
        stake.end_date = clock.unix_timestamp + (lockup as i64) * 10 * 24 * 60 * 60;
        stake.spl_bump = spl_bump;
        // msg!("NEW LOGS FOUND");
        let percentage = ((lockup + rarity) as f64) / 100.0;
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

    pub fn redeem_rewards(ctx: Context<RedeemRewards>) -> ProgramResult {
        let stake = &mut ctx.accounts.stake;
        let mut clock_unix = Clock::get().unwrap().unix_timestamp;
        if clock_unix > stake.end_date {
            clock_unix = stake.end_date;
        }
        // msg!("end_date: {}, clock_unix: {},", stake.end_date, clock_unix);
        let percentage: f64 =
            ((clock_unix - stake.start_date) as f64) / ((stake.end_date - stake.start_date) as f64);
        // msg!("Percentage earned: {}", percentage);
        let amount_to_redeem =
            ((stake.amount_owed as f64 * percentage) - stake.amount_redeemed as f64) as u64;
        // msg!("Amount in token owed total {}", stake.amount_owed);
        // msg!("Amount in token to redeem {}", amount_to_redeem);
        stake.amount_redeemed += amount_to_redeem;
        // new hotness is borken
        // token::transfer(ctx.accounts.transfer_ctx(), amount_to_redeem)?;
        // ol reliable?
        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.sender_spl_account.to_account_info(),
                    to: ctx.accounts.reciever_spl_account.to_account_info(),
                    authority: ctx.accounts.sender_spl_account.to_account_info(),
                },
                &[&[
                    ctx.accounts.jollyranch.key().as_ref(),
                    &[ctx.accounts.jollyranch.spl_bump],
                ]],
            ),
            amount_to_redeem,
        )?;
        Ok(())
    }

    pub fn redeem_nft(ctx: Context<RedeemNFT>) -> ProgramResult {
        let clock_unix = Clock::get().unwrap().unix_timestamp;
        let stake = &mut ctx.accounts.stake;
        if stake.withdrawn == true {
            return Err(ErrorCode::InvalidNftWithdrawl.into());
        }
        if clock_unix < stake.end_date {
            return Err(ErrorCode::InvalidNftTime.into());
        }
        stake.withdrawn = true;

        // transfer back nft
        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.sender_spl_account.to_account_info(),
                    to: ctx.accounts.reciever_spl_account.to_account_info(),
                    authority: ctx.accounts.sender_spl_account.to_account_info(),
                },
                &[&[
                    ctx.accounts.stake.key().as_ref(),
                    &[ctx.accounts.stake.spl_bump],
                ]],
            ),
            1,
        )?;
        // Finally, close the escrow account and refund the maker (they paid for
        // its rent-exemption).
        anchor_spl::token::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::CloseAccount {
                account: ctx.accounts.sender_spl_account.to_account_info(),
                destination: ctx.accounts.reciever_spl_account.to_account_info(),
                authority: ctx.accounts.sender_spl_account.to_account_info(),
            },
            &[&[
                ctx.accounts.stake.key().as_ref(),
                &[ctx.accounts.stake.spl_bump],
            ]],
        ))?;
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
    pub rent: Sysvar<'info, Rent>,
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
            },
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
            },
        )
    }
}

#[derive(Accounts)]
pub struct RedeemRewards<'info> {
    #[account(mut, has_one = authority)]
    pub stake: Account<'info, Stake>,
    #[account(mut)]
    pub jollyranch: Account<'info, JollyRanch>,
    pub authority: Signer<'info>,
    // spl_token specific validations
    #[account(mut, seeds = [jollyranch.key().as_ref()], bump = jollyranch.spl_bump)]
    pub sender_spl_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub reciever_spl_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RedeemNFT<'info> {
    #[account(mut, has_one = authority)]
    pub stake: Account<'info, Stake>,
    pub jollyranch: Account<'info, JollyRanch>,
    pub authority: Signer<'info>,
    // spl_token specific validations
    #[account(mut, seeds = [stake.key().as_ref()], bump = stake.spl_bump)]
    pub sender_spl_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub reciever_spl_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// Data Structures

const DISCRIMINATOR_LENGTH: usize = 8;
const AUTHORITY_LENGTH: usize = 32;
const START_DATE_LENGTH: usize = 8;
const END_DATE_LENGTH: usize = 8;
const AMOUNT_LENGTH: usize = 8;
const AMOUNT_REDEEMED_LENGTH: usize = 8;
const AMOUNT_OWED_LENGTH: usize = 8;
const BUMP_LENGTH: usize = 8;
const WITHDRAWN_LENGTH: usize = 8;

#[account]
pub struct JollyRanch {
    pub authority: Pubkey,
    pub spl_bump: u8,
    pub amount: u64,
    pub amount_redeemed: u64,
    pub bump: u8,
}

impl JollyRanch {
    const LEN: usize = AMOUNT_LENGTH
        + AMOUNT_REDEEMED_LENGTH
        + DISCRIMINATOR_LENGTH
        + AUTHORITY_LENGTH
        + BUMP_LENGTH
        + BUMP_LENGTH;
}

#[account]
pub struct Stake {
    pub authority: Pubkey,
    pub spl_bump: u8,
    pub start_date: i64,
    pub end_date: i64,
    pub amount_redeemed: u64,
    pub amount_owed: u64,
    pub withdrawn: bool,
}

impl Stake {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + AUTHORITY_LENGTH
        + BUMP_LENGTH
        + START_DATE_LENGTH
        + END_DATE_LENGTH
        + AMOUNT_REDEEMED_LENGTH
        + AMOUNT_OWED_LENGTH
        + WITHDRAWN_LENGTH;
}
// Error Codes
#[error]
pub enum ErrorCode {
    #[msg("NFT can't be unlocked yet, not enough time has passed.")]
    InvalidNftTime,
    #[msg("NFT has already been un-staked")]
    InvalidNftWithdrawl,
    #[msg("Lockup period invalid")]
    InvalidLockupPeriod,
    #[msg("Rarity invalid")]
    InvalidRarity,
}
