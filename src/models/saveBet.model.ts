export interface SaveBetDto {
    member_address: string
    bet: {
        bet_number: string
        bet_amount: string
        transaction_hash: string
        draw_number: string
    }
}