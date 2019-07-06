import formatMoney from '../lib/formatMoney';

describe('formatMoney util fuction', () => {
    it('should handle fractional money (cents)', () => {
        expect(formatMoney(1)).toBe('$0.01');
        expect(formatMoney(40)).toBe('$0.40');
    })

    it('should convert cents to whole dollars', () => {
        expect(formatMoney(5000)).toBe('$50');
        expect(formatMoney(100)).toBe('$1');
        expect(formatMoney(50000000)).toBe('$500,000');
    })

    it('works with whole and fractional money', () => {
        expect(formatMoney(512)).toBe('$5.12');
        expect(formatMoney(101)).toBe('$1.01');
        expect(formatMoney(220)).toBe('$2.20');
        //edge case 
        expect(formatMoney(9182548291037)).toBe('$91,825,482,910.37');
    })
})