import { ExecuteBetDto } from "../models/executeBet.model";

const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.1.24:3000';
       


class LotteryService {
    
    // DRAWS
    async getDraws () {
        try {
            const res = await fetch(`${apiUrl}/api/draws/get-draws`)
            const data = await res.json()

            return data
        } catch (error) {
            return error
        }
    }

    // BETS
    async getBets (draw_number: any) {
        try {
            const res = await fetch(`${apiUrl}/api/bets/get-bets/${draw_number}`)
            const data = await res.json()

            return data
        } catch (error) {
            return error
        }
    }

    async executeBet (transactionData: ExecuteBetDto) {
        try {
           const response = await fetch(`${apiUrl}/api/bets/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transactionData)
           })
           if (!response.ok) {
                throw new Error (`Adding of bet failed: ${response.status}`)
           }

           const data = await response.json()
           return data
        } catch (error) {
           throw error 
        }
    }

    async addBet () {
        try {
           const response = await fetch(`${apiUrl}/api/bets/add`, {
            method: 'POST'}
           ) 
           const data = response.json()
           return data
        } catch (error) {
            return error
        }
    }
}

const lotteryService = new LotteryService()
export default lotteryService;