// utils/formatCurrency.js
export const formatCurrency = (amount) => {
	// Kiểm tra nếu amount không phải là số hoặc null/undefined
	if (amount === null || amount === undefined) {
		return '0 ₫';
	}

	// Đảm bảo amount là số
	let numericAmount;
	try {
		numericAmount = Number(amount);
		if (isNaN(numericAmount)) {
			console.error('Invalid amount value:', amount);
			return '0 ₫';
		}
	} catch (error) {
		console.error('Error converting amount to number:', error);
		return '0 ₫';
	}
	
	// Sử dụng định dạng tiền tệ VND thông thường
	try {
		return new Intl.NumberFormat('vi-VN', {
			style: 'currency',
			currency: 'VND',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(numericAmount);
	} catch (error) {
		console.error('Error formatting currency:', error, 'for amount:', numericAmount);
		return numericAmount + ' ₫';
	}
};
