
const apiUrl = 'localhost:3000/api'


class LotteryService {
    
    // DRAWS
    async getDraws () {
        try {
            const res = await fetch(`${apiUrl}/draws/get-draws`)
            console.log(res)
            return
        } catch (error) {
            return error
        }
    }

    // BETS
    async getBets () {
        try {
            
        } catch (error) {
            return error
        }
    }

    async addBet () {
        try {
            
        } catch (error) {
            return error
        }
    }

    async executeBet () {
        try {
            
        } catch (error) {
           return error 
        }
    }
}

const lotteryService = new LotteryService()
export default lotteryService